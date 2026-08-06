import { useCallback, useRef, useState } from 'react';
import {
  joinCall,
  leaveCall,
  sendCallSignal,
  pollCallSignals,
  fetchCallState,
  fetchJoinRequestStatus,
  raiseHand as apiRaiseHand,
  lowerHand as apiLowerHand,
  advanceSpeaker as apiAdvanceSpeaker,
  resolveJoinRequest as apiResolveJoinRequest,
  updateCallSettings as apiUpdateCallSettings,
  removeParticipant as apiRemoveParticipant,
  advancePhase as apiAdvancePhase,
  CallParticipant,
  CallPhase,
  CallSettingsState,
  PendingJoinRequest,
  QueuedSpeaker,
  SpeakingMode,
  StartCallSettings,
} from '../api/calls';
import { createSpeakingDetector, SpeakingDetector } from '../utils/localSpeakingDetector';
import { computeFocusSet } from '../utils/callFocus';
import { captionsSupported, createLiveCaptioner, LiveCaptioner } from '../utils/liveCaptions';

// Google's public STUN servers — free, no account, no cost. No TURN relay
// (that needs a self-hosted VPS running coturn); direct P2P still connects
// for the large majority of home/office networks without one.
const ICE_SERVERS: RTCIceServer[] = [
  { urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] },
];

const POLL_INTERVAL_MS = 1500;
const APPROVAL_POLL_INTERVAL_MS = 2000;
const REACTION_LIFETIME_MS = 3000;
const CAPTION_SEND_THROTTLE_MS = 400; // interim results fire fast; final results always send immediately
const CAPTION_STALE_MS = 8000; // clear a caption line once its speaker's been quiet this long

export interface RemoteParticipant {
  userId: string;
  username: string;
  stream: MediaStream | null;
  micEnabled: boolean;
  cameraEnabled: boolean;
  /** Whether video is actually arriving right now — decoupled from `cameraEnabled` (their
   * own toggle), since a mesh peer may also have stopped *sending* us video to save
   * bandwidth (see focusedUserIds) even while their camera is otherwise on. */
  hasVideo: boolean;
  speaking: boolean;
  /** Space owner/moderator — the default featured tile when no one's actively speaking. */
  isOrganizer: boolean;
}

export interface CallReaction {
  id: string;
  emoji: string;
  userId: string;
  username: string;
}

export interface CaptionLine {
  userId: string;
  username: string;
  text: string;
  isFinal: boolean;
  updatedAt: number;
}

export function useWebRTCCall() {
  const [status, setStatus] = useState<'idle' | 'connecting' | 'pending-approval' | 'in-call' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteParticipants, setRemoteParticipants] = useState<Map<string, RemoteParticipant>>(new Map());
  const [micEnabled, setMicEnabled] = useState(true);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [mySpeaking, setMySpeaking] = useState(false);

  // Smart mesh limits — bounded set of participants who actually get video sent to/from
  // them, so bandwidth stays flat instead of growing with the square of the group size.
  const [focusedUserIds, setFocusedUserIds] = useState<Set<string>>(new Set());
  const [reactions, setReactions] = useState<CallReaction[]>([]);

  // Live captions — opt-in per person (each device can only transcribe its own mic),
  // browser-only (Web Speech API), free.
  const [captionsEnabled, setCaptionsEnabled] = useState(false);
  const [captions, setCaptions] = useState<Map<string, CaptionLine>>(new Map());

  // Structured speaking turns — the feature that makes this different from a plain
  // Meet-style call: a raise-hand queue with a per-speaker timer, tailored to language
  // practice/debate sessions rather than open-floor talk.
  const [speakingMode, setSpeakingMode] = useState<SpeakingMode>('OPEN');
  const [speakerTimeSec, setSpeakerTimeSec] = useState<number | null>(null);
  const [currentSpeaker, setCurrentSpeaker] = useState<QueuedSpeaker | null>(null);
  const [currentSpeakerStartedAt, setCurrentSpeakerStartedAt] = useState<string | null>(null);
  const [queue, setQueue] = useState<QueuedSpeaker[]>([]);

  // Live, host-configurable call settings + the door — a real approval flow, not decoration.
  const [requireApproval, setRequireApproval] = useState(false);
  const [autoMuteOnJoin, setAutoMuteOnJoin] = useState(false);
  const [topic, setTopic] = useState<string | null>(null);
  const [isHost, setIsHost] = useState(false);
  const [joinRequests, setJoinRequests] = useState<PendingJoinRequest[]>([]);
  const [callStartedAt, setCallStartedAt] = useState<string | null>(null);
  // A debate's formal phase structure (opening statements -> rebuttal -> closing), if its
  // creator set one — reuses this same structured-turns engine, just relabeled per round.
  const [phases, setPhases] = useState<CallPhase[] | null>(null);
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState<number | null>(null);

  const callSessionIdRef = useRef<string | null>(null);
  const myUserIdRef = useRef<string | null>(null);
  const pendingChannelIdRef = useRef<string | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const videoSendersRef = useRef<Map<string, RTCRtpSender>>(new Map());
  const pendingCandidatesRef = useRef<Map<string, RTCIceCandidateInit[]>>(new Map());
  const usernamesRef = useRef<Map<string, string>>(new Map());
  const remoteParticipantsRef = useRef<Map<string, RemoteParticipant>>(new Map());
  const lastSpokeAtRef = useRef<Map<string, number>>(new Map());
  const joinOrderRef = useRef<string[]>([]);
  const lastSignalAtRef = useRef<string | null>(null);
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const approvalPollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const advanceInFlightRef = useRef(false);
  const leaveRef = useRef<() => Promise<void>>(async () => undefined);
  const speakingDetectorRef = useRef<SpeakingDetector | null>(null);
  const captionerRef = useRef<LiveCaptioner | null>(null);
  const lastCaptionSentAtRef = useRef(0);

  const upsertRemoteParticipant = useCallback((userId: string, patch: Partial<RemoteParticipant>) => {
    setRemoteParticipants((prev) => {
      const next = new Map(prev);
      const existing = next.get(userId) || {
        userId,
        username: usernamesRef.current.get(userId) || 'Learner',
        stream: null,
        micEnabled: true,
        cameraEnabled: true,
        hasVideo: false,
        speaking: false,
        isOrganizer: false,
      };
      const merged = { ...existing, ...patch };
      next.set(userId, merged);
      remoteParticipantsRef.current = next;
      return next;
    });
  }, []);

  /** Applies the shared focus-set decision to one connection's outgoing video — the actual
   * bandwidth lever. `replaceTrack` needs no renegotiation, so this is cheap to call often. */
  const applyFocusToSender = useCallback((remoteUserId: string, focusSet: Set<string>) => {
    const sender = videoSendersRef.current.get(remoteUserId);
    if (!sender) return;
    const myVideoTrack = localStreamRef.current?.getVideoTracks()[0] || null;
    const wantTrack = focusSet.has(remoteUserId) && myVideoTrack?.enabled ? myVideoTrack : null;
    if (sender.track !== wantTrack) sender.replaceTrack(wantTrack).catch(() => undefined);
  }, []);

  const recomputeFocus = useCallback(
    (currentSpeakerId: string | null) => {
      const focusSet = computeFocusSet({ currentSpeakerId, lastSpokeAt: lastSpokeAtRef.current, joinOrder: joinOrderRef.current });
      setFocusedUserIds(focusSet);
      videoSendersRef.current.forEach((_sender, remoteUserId) => applyFocusToSender(remoteUserId, focusSet));
    },
    [applyFocusToSender],
  );

  const addReaction = useCallback((emoji: string, fromUserId: string) => {
    const id = `${fromUserId}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const username = fromUserId === myUserIdRef.current ? 'You' : usernamesRef.current.get(fromUserId) || 'Learner';
    setReactions((prev) => [...prev, { id, emoji, userId: fromUserId, username }]);
    setTimeout(() => setReactions((prev) => prev.filter((r) => r.id !== id)), REACTION_LIFETIME_MS);
  }, []);

  const upsertCaption = useCallback((userId: string, text: string, isFinal: boolean) => {
    const username = userId === myUserIdRef.current ? 'You' : usernamesRef.current.get(userId) || 'Learner';
    setCaptions((prev) => {
      const next = new Map(prev);
      next.set(userId, { userId, username, text, isFinal, updatedAt: Date.now() });
      return next;
    });
  }, []);

  const createPeerConnection = useCallback(
    (remoteUserId: string) => {
      const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
      localStreamRef.current?.getTracks().forEach((track) => {
        const sender = pc.addTrack(track, localStreamRef.current!);
        if (track.kind === 'video') videoSendersRef.current.set(remoteUserId, sender);
      });

      pc.onicecandidate = (e) => {
        if (e.candidate && callSessionIdRef.current) {
          sendCallSignal(callSessionIdRef.current, 'ICE_CANDIDATE', remoteUserId, e.candidate.toJSON()).catch(() => undefined);
        }
      };
      pc.ontrack = (e) => {
        if (e.track.kind === 'video') {
          const track = e.track;
          upsertRemoteParticipant(remoteUserId, { stream: e.streams[0], hasVideo: !track.muted });
          track.onmute = () => upsertRemoteParticipant(remoteUserId, { hasVideo: false });
          track.onunmute = () => upsertRemoteParticipant(remoteUserId, { hasVideo: true });
        } else {
          upsertRemoteParticipant(remoteUserId, { stream: e.streams[0] });
        }
      };
      pc.onconnectionstatechange = () => {
        if (pc.connectionState === 'failed' || pc.connectionState === 'closed') {
          peerConnectionsRef.current.delete(remoteUserId);
          videoSendersRef.current.delete(remoteUserId);
        }
      };

      peerConnectionsRef.current.set(remoteUserId, pc);
      return pc;
    },
    [upsertRemoteParticipant],
  );

  const flushPendingCandidates = useCallback(async (userId: string, pc: RTCPeerConnection) => {
    const queued = pendingCandidatesRef.current.get(userId);
    if (!queued?.length) return;
    for (const candidate of queued) {
      await pc.addIceCandidate(new RTCIceCandidate(candidate)).catch(() => undefined);
    }
    pendingCandidatesRef.current.delete(userId);
  }, []);

  const handleOffer = useCallback(
    async (fromUserId: string, sdp: RTCSessionDescriptionInit) => {
      if (!callSessionIdRef.current) return;
      const pc = peerConnectionsRef.current.get(fromUserId) || createPeerConnection(fromUserId);
      await pc.setRemoteDescription(new RTCSessionDescription(sdp));
      await flushPendingCandidates(fromUserId, pc);
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      await sendCallSignal(callSessionIdRef.current, 'ANSWER', fromUserId, answer);
    },
    [createPeerConnection, flushPendingCandidates],
  );

  const handleAnswer = useCallback(
    async (fromUserId: string, sdp: RTCSessionDescriptionInit) => {
      const pc = peerConnectionsRef.current.get(fromUserId);
      if (!pc) return;
      await pc.setRemoteDescription(new RTCSessionDescription(sdp));
      await flushPendingCandidates(fromUserId, pc);
    },
    [flushPendingCandidates],
  );

  const handleIceCandidate = useCallback(async (fromUserId: string, candidate: RTCIceCandidateInit) => {
    const pc = peerConnectionsRef.current.get(fromUserId);
    if (!pc || !pc.remoteDescription) {
      const queue = pendingCandidatesRef.current.get(fromUserId) || [];
      queue.push(candidate);
      pendingCandidatesRef.current.set(fromUserId, queue);
      return;
    }
    await pc.addIceCandidate(new RTCIceCandidate(candidate)).catch(() => undefined);
  }, []);

  const handleLeave = useCallback((fromUserId: string) => {
    peerConnectionsRef.current.get(fromUserId)?.close();
    peerConnectionsRef.current.delete(fromUserId);
    pendingCandidatesRef.current.delete(fromUserId);
    videoSendersRef.current.delete(fromUserId);
    lastSpokeAtRef.current.delete(fromUserId);
    setRemoteParticipants((prev) => {
      const next = new Map(prev);
      next.delete(fromUserId);
      remoteParticipantsRef.current = next;
      return next;
    });
  }, []);

  const pollOnce = useCallback(async () => {
    if (!callSessionIdRef.current) return;
    const signals = await pollCallSignals(callSessionIdRef.current, lastSignalAtRef.current).catch(() => []);
    for (const signal of signals) {
      lastSignalAtRef.current = signal.createdAt;
      const payload = signal.payload ? JSON.parse(signal.payload) : null;
      if (signal.type === 'OFFER') await handleOffer(signal.fromUserId, payload);
      else if (signal.type === 'ANSWER') await handleAnswer(signal.fromUserId, payload);
      else if (signal.type === 'ICE_CANDIDATE') await handleIceCandidate(signal.fromUserId, payload);
      else if (signal.type === 'LEAVE') handleLeave(signal.fromUserId);
      else if (signal.type === 'MEDIA_STATE') {
        upsertRemoteParticipant(signal.fromUserId, { micEnabled: Boolean(payload?.micEnabled), cameraEnabled: Boolean(payload?.cameraEnabled) });
      } else if (signal.type === 'SPEAKING') {
        const speaking = Boolean(payload?.speaking);
        upsertRemoteParticipant(signal.fromUserId, { speaking });
        if (speaking) lastSpokeAtRef.current.set(signal.fromUserId, new Date(signal.createdAt).getTime());
      } else if (signal.type === 'REACTION') {
        if (typeof payload?.emoji === 'string') addReaction(payload.emoji, signal.fromUserId);
      } else if (signal.type === 'CAPTION') {
        if (typeof payload?.text === 'string') upsertCaption(signal.fromUserId, payload.text, Boolean(payload.isFinal));
      } else if (signal.type === 'FORCE_MUTE') {
        localStreamRef.current?.getAudioTracks().forEach((t) => (t.enabled = false));
        setMicEnabled(false);
        if (callSessionIdRef.current) {
          const liveCameraEnabled = localStreamRef.current?.getVideoTracks().some((t) => t.enabled) ?? false;
          sendCallSignal(callSessionIdRef.current, 'MEDIA_STATE', null, { micEnabled: false, cameraEnabled: liveCameraEnabled }).catch(() => undefined);
        }
      } else if (signal.type === 'KICKED') {
        await leaveRef.current();
        setError('You were removed from the call by the host.');
        setStatus('error');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handleOffer, handleAnswer, handleIceCandidate, handleLeave, upsertRemoteParticipant, addReaction, upsertCaption]);

  const applyCallSettingsState = useCallback(
    (state: CallSettingsState) => {
      setSpeakingMode(state.speakingMode);
      setSpeakerTimeSec(state.speakerTimeSec);
      setCurrentSpeaker(state.currentSpeaker);
      setCurrentSpeakerStartedAt(state.currentSpeakerStartedAt);
      setQueue(state.queue);
      setRequireApproval(state.requireApproval);
      setAutoMuteOnJoin(state.autoMuteOnJoin);
      setTopic(state.topic);
      setIsHost(state.isHost);
      setJoinRequests(state.joinRequests);
      setCallStartedAt(state.startedAt);
      setPhases(state.phases);
      setCurrentPhaseIndex(state.currentPhaseIndex);

      // In structured mode, only the current speaker's mic is actually live — enforced here,
      // not just in the UI, so no one can talk over their turn.
      if (state.speakingMode === 'STRUCTURED') {
        const isMyTurn = state.currentSpeaker?.id === myUserIdRef.current;
        localStreamRef.current?.getAudioTracks().forEach((t) => (t.enabled = isMyTurn));
        setMicEnabled(isMyTurn);
      }

      recomputeFocus(state.currentSpeaker?.id ?? null);
    },
    [recomputeFocus],
  );

  const refreshCallState = useCallback(async () => {
    if (!callSessionIdRef.current) return;

    setCaptions((prev) => {
      const now = Date.now();
      const next = new Map(prev);
      let changed = false;
      for (const [id, line] of prev) {
        if (now - line.updatedAt > CAPTION_STALE_MS) {
          next.delete(id);
          changed = true;
        }
      }
      return changed ? next : prev;
    });

    const state = await fetchCallState(callSessionIdRef.current).catch(() => null);
    if (!state) return;

    // Authoritative participant list — keeps usernames correct for anyone who joined after
    // us (the WebRTC handshake alone doesn't carry a display name) and gives a stable join
    // order for the focus-set fallback ranking.
    const others = state.participants.filter((p) => p.userId !== myUserIdRef.current);
    const sorted = [...others].sort((a, b) => new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime());
    joinOrderRef.current = sorted.map((p) => p.userId);
    for (const p of sorted) {
      usernamesRef.current.set(p.userId, p.user.username);
      upsertRemoteParticipant(p.userId, { isOrganizer: p.role === 'OWNER' || p.role === 'MODERATOR' });
    }

    applyCallSettingsState(state);

    // Only the speaker's own client auto-advances when their time is up (the host can always
    // skip manually as a fallback if that client has gone away).
    if (
      state.speakingMode === 'STRUCTURED' &&
      state.currentSpeaker?.id === myUserIdRef.current &&
      state.speakerTimeSec &&
      state.currentSpeakerStartedAt &&
      !advanceInFlightRef.current
    ) {
      const elapsed = Date.now() - new Date(state.currentSpeakerStartedAt).getTime();
      if (elapsed >= state.speakerTimeSec * 1000) {
        advanceInFlightRef.current = true;
        await apiAdvanceSpeaker(callSessionIdRef.current).catch(() => undefined);
        advanceInFlightRef.current = false;
      }
    }
  }, [applyCallSettingsState, upsertRemoteParticipant]);

  const finishJoining = useCallback(
    async (result: { callSessionId: string; participants: CallParticipant[] } & CallSettingsState, overrideParticipants?: CallParticipant[]) => {
      callSessionIdRef.current = result.callSessionId;
      lastSignalAtRef.current = new Date().toISOString();

      const participants = overrideParticipants || result.participants;
      const sorted = [...participants].sort((a, b) => new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime());
      joinOrderRef.current = sorted.map((p) => p.userId);

      applyCallSettingsState(result);

      if (result.autoMuteOnJoin) {
        localStreamRef.current?.getAudioTracks().forEach((t) => (t.enabled = false));
        setMicEnabled(false);
      }

      for (const p of sorted) {
        usernamesRef.current.set(p.userId, p.user.username);
        upsertRemoteParticipant(p.userId, { isOrganizer: p.role === 'OWNER' || p.role === 'MODERATOR' });
        const pc = createPeerConnection(p.userId);
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        await sendCallSignal(result.callSessionId, 'OFFER', p.userId, offer);
      }

      // Let existing participants know our real starting mic/camera state right away.
      await sendCallSignal(result.callSessionId, 'MEDIA_STATE', null, {
        micEnabled: !result.autoMuteOnJoin,
        cameraEnabled: localStreamRef.current?.getVideoTracks().some((t) => t.enabled) ?? false,
      }).catch(() => undefined);

      pollTimerRef.current = setInterval(() => {
        pollOnce();
        refreshCallState();
      }, POLL_INTERVAL_MS);
      setStatus('in-call');
    },
    [applyCallSettingsState, createPeerConnection, pollOnce, refreshCallState, upsertRemoteParticipant],
  );

  const checkApproval = useCallback(async () => {
    if (!callSessionIdRef.current) return;
    const { status: reqStatus } = await fetchJoinRequestStatus(callSessionIdRef.current).catch(() => ({ status: null }));
    if (reqStatus === 'APPROVED') {
      if (approvalPollTimerRef.current) clearInterval(approvalPollTimerRef.current);
      approvalPollTimerRef.current = null;
      const channelId = pendingChannelIdRef.current;
      if (!channelId) return;
      const result = await joinCall(channelId).catch(() => null);
      if (result && !result.pending) await finishJoining(result);
      else {
        setError("Couldn't join after being admitted — try again.");
        setStatus('error');
      }
    } else if (reqStatus === 'DENIED') {
      if (approvalPollTimerRef.current) clearInterval(approvalPollTimerRef.current);
      approvalPollTimerRef.current = null;
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
      setLocalStream(null);
      setError('The host declined your request to join.');
      setStatus('error');
    }
  }, [finishJoining]);

  const join = useCallback(
    async (channelId: string, myUserId: string, existingParticipants?: CallParticipant[], settings?: StartCallSettings) => {
      setStatus('connecting');
      setError(null);
      myUserIdRef.current = myUserId;
      pendingChannelIdRef.current = channelId;
      try {
        let stream: MediaStream;
        try {
          stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
        } catch {
          // Camera denied/unavailable — degrade to audio-only rather than failing the whole call.
          stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          setCameraEnabled(false);
        }
        localStreamRef.current = stream;
        setLocalStream(stream);

        speakingDetectorRef.current = createSpeakingDetector((speaking) => {
          setMySpeaking(speaking);
          if (callSessionIdRef.current) {
            sendCallSignal(callSessionIdRef.current, 'SPEAKING', null, { speaking }).catch(() => undefined);
          }
        });
        speakingDetectorRef.current.start(stream);

        const result = await joinCall(channelId, settings);
        if (result.pending) {
          callSessionIdRef.current = result.callSessionId;
          setTopic(result.topic);
          setSpeakingMode(result.speakingMode);
          setStatus('pending-approval');
          approvalPollTimerRef.current = setInterval(checkApproval, APPROVAL_POLL_INTERVAL_MS);
          return;
        }

        await finishJoining(result, existingParticipants);
      } catch (err: any) {
        setError(err?.response?.data?.error || err?.message || 'Could not join the call — check camera/mic permissions.');
        setStatus('error');
      }
    },
    [checkApproval, finishJoining],
  );

  const leave = useCallback(async () => {
    if (approvalPollTimerRef.current) clearInterval(approvalPollTimerRef.current);
    approvalPollTimerRef.current = null;
    if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    pollTimerRef.current = null;
    speakingDetectorRef.current?.stop();
    speakingDetectorRef.current = null;
    captionerRef.current?.stop();
    captionerRef.current = null;
    setCaptionsEnabled(false);
    setCaptions(new Map());
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;
    setLocalStream(null);
    peerConnectionsRef.current.forEach((pc) => pc.close());
    peerConnectionsRef.current.clear();
    videoSendersRef.current.clear();
    pendingCandidatesRef.current.clear();
    lastSpokeAtRef.current.clear();
    joinOrderRef.current = [];
    remoteParticipantsRef.current = new Map();
    setRemoteParticipants(new Map());
    setFocusedUserIds(new Set());
    setReactions([]);
    setMySpeaking(false);
    if (callSessionIdRef.current) {
      await leaveCall(callSessionIdRef.current).catch(() => undefined);
    }
    callSessionIdRef.current = null;
    myUserIdRef.current = null;
    pendingChannelIdRef.current = null;
    lastSignalAtRef.current = null;
    advanceInFlightRef.current = false;
    setSpeakingMode('OPEN');
    setSpeakerTimeSec(null);
    setCurrentSpeaker(null);
    setCurrentSpeakerStartedAt(null);
    setQueue([]);
    setRequireApproval(false);
    setAutoMuteOnJoin(false);
    setTopic(null);
    setIsHost(false);
    setJoinRequests([]);
    setCallStartedAt(null);
    setPhases(null);
    setCurrentPhaseIndex(null);
    setMicEnabled(true);
    setCameraEnabled(true);
    setStatus('idle');
  }, []);
  leaveRef.current = leave;

  const toggleMic = useCallback(() => {
    if (speakingMode === 'STRUCTURED') return; // mic is turn-controlled — use raise/lower hand instead
    const next = !micEnabled;
    localStreamRef.current?.getAudioTracks().forEach((t) => (t.enabled = next));
    setMicEnabled(next);
    if (callSessionIdRef.current) {
      sendCallSignal(callSessionIdRef.current, 'MEDIA_STATE', null, { micEnabled: next, cameraEnabled }).catch(() => undefined);
    }
  }, [micEnabled, cameraEnabled, speakingMode]);

  const toggleCamera = useCallback(() => {
    const next = !cameraEnabled;
    localStreamRef.current?.getVideoTracks().forEach((t) => (t.enabled = next));
    setCameraEnabled(next);
    if (callSessionIdRef.current) {
      sendCallSignal(callSessionIdRef.current, 'MEDIA_STATE', null, { micEnabled, cameraEnabled: next }).catch(() => undefined);
    }
    // Re-apply focus immediately — turning the camera off/on should stop/resume outgoing
    // video to focused peers right away, not wait for the next poll tick.
    videoSendersRef.current.forEach((_sender, remoteUserId) => applyFocusToSender(remoteUserId, focusedUserIds));
  }, [cameraEnabled, micEnabled, focusedUserIds, applyFocusToSender]);

  const raiseHand = useCallback(async () => {
    if (!callSessionIdRef.current) return;
    const state = await apiRaiseHand(callSessionIdRef.current).catch(() => null);
    if (state) applyCallSettingsState(state);
  }, [applyCallSettingsState]);

  const lowerHand = useCallback(async () => {
    if (!callSessionIdRef.current) return;
    const state = await apiLowerHand(callSessionIdRef.current).catch(() => null);
    if (state) applyCallSettingsState(state);
  }, [applyCallSettingsState]);

  const skipSpeaker = useCallback(async () => {
    if (!callSessionIdRef.current) return;
    const state = await apiAdvanceSpeaker(callSessionIdRef.current).catch(() => null);
    if (state) applyCallSettingsState(state);
  }, [applyCallSettingsState]);

  const updateSettings = useCallback(
    async (patch: Partial<{ speakingMode: SpeakingMode; speakerTimeSec: number; topic: string; requireApproval: boolean; autoMuteOnJoin: boolean }>) => {
      if (!callSessionIdRef.current) return;
      const state = await apiUpdateCallSettings(callSessionIdRef.current, patch).catch(() => null);
      if (state) applyCallSettingsState(state);
    },
    [applyCallSettingsState],
  );

  const advancePhase = useCallback(async () => {
    if (!callSessionIdRef.current) return;
    const state = await apiAdvancePhase(callSessionIdRef.current).catch(() => null);
    if (state) applyCallSettingsState(state);
  }, [applyCallSettingsState]);

  const admitJoinRequest = useCallback(async (requesterId: string) => {
    if (!callSessionIdRef.current) return;
    await apiResolveJoinRequest(callSessionIdRef.current, requesterId, 'APPROVE').catch(() => undefined);
  }, []);

  const denyJoinRequest = useCallback(async (requesterId: string) => {
    if (!callSessionIdRef.current) return;
    await apiResolveJoinRequest(callSessionIdRef.current, requesterId, 'DENY').catch(() => undefined);
  }, []);

  const kickParticipant = useCallback(
    async (targetUserId: string) => {
      if (!callSessionIdRef.current) return;
      await apiRemoveParticipant(callSessionIdRef.current, targetUserId).catch(() => undefined);
      handleLeave(targetUserId);
    },
    [handleLeave],
  );

  const forceMuteParticipant = useCallback(async (targetUserId: string) => {
    if (!callSessionIdRef.current) return;
    await sendCallSignal(callSessionIdRef.current, 'FORCE_MUTE', targetUserId, {}).catch(() => undefined);
  }, []);

  const sendReaction = useCallback(
    async (emoji: string) => {
      if (!callSessionIdRef.current || !myUserIdRef.current) return;
      addReaction(emoji, myUserIdRef.current); // optimistic local echo — we never receive our own broadcast back
      await sendCallSignal(callSessionIdRef.current, 'REACTION', null, { emoji }).catch(() => undefined);
    },
    [addReaction],
  );

  /** `lang` — a BCP-47 tag (e.g. "en-US") for the caller's own speech. Only transcribes
   * their own mic; there's no way to caption anyone else's audio without their own
   * device opting in too. */
  const toggleCaptions = useCallback(
    (lang: string) => {
      if (captionsEnabled) {
        captionerRef.current?.stop();
        captionerRef.current = null;
        setCaptionsEnabled(false);
        if (myUserIdRef.current) {
          setCaptions((prev) => {
            const next = new Map(prev);
            next.delete(myUserIdRef.current!);
            return next;
          });
        }
        return;
      }

      captionerRef.current = createLiveCaptioner(
        lang,
        (text, isFinal) => {
          if (!myUserIdRef.current) return;
          upsertCaption(myUserIdRef.current, text, isFinal);
          const now = Date.now();
          if (!isFinal && now - lastCaptionSentAtRef.current < CAPTION_SEND_THROTTLE_MS) return;
          lastCaptionSentAtRef.current = now;
          if (callSessionIdRef.current) {
            sendCallSignal(callSessionIdRef.current, 'CAPTION', null, { text, isFinal }).catch(() => undefined);
          }
        },
        () => {
          // Non-fatal — the call itself is fine, captions just aren't available for this
          // language/browser combination. Fails quiet rather than interrupting the call.
          setCaptionsEnabled(false);
          captionerRef.current = null;
        },
      );
      captionerRef.current.start();
      setCaptionsEnabled(true);
    },
    [captionsEnabled, upsertCaption],
  );

  return {
    status,
    error,
    localStream,
    remoteParticipants: Array.from(remoteParticipants.values()),
    micEnabled,
    cameraEnabled,
    mySpeaking,
    focusedUserIds,
    reactions,
    speakingMode,
    speakerTimeSec,
    currentSpeaker,
    currentSpeakerStartedAt,
    queue,
    requireApproval,
    autoMuteOnJoin,
    topic,
    isHost,
    joinRequests,
    callStartedAt,
    phases,
    currentPhaseIndex,
    join,
    leave,
    toggleMic,
    toggleCamera,
    raiseHand,
    lowerHand,
    skipSpeaker,
    updateSettings,
    admitJoinRequest,
    denyJoinRequest,
    kickParticipant,
    forceMuteParticipant,
    sendReaction,
    advancePhase,
    captionsSupported: captionsSupported(),
    captionsEnabled,
    captions: Array.from(captions.values()),
    toggleCaptions,
  };
}
