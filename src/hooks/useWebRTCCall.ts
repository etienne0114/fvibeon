import { useCallback, useRef, useState } from 'react';
import {
  joinCall,
  leaveCall,
  sendCallSignal,
  pollCallSignals,
  fetchCallState,
  raiseHand as apiRaiseHand,
  lowerHand as apiLowerHand,
  advanceSpeaker as apiAdvanceSpeaker,
  CallParticipant,
  QueuedSpeaker,
  SpeakingMode,
} from '../api/calls';

// Google's public STUN servers — free, no account, no cost. No TURN relay
// (that needs a self-hosted VPS running coturn); direct P2P still connects
// for the large majority of home/office networks without one.
const ICE_SERVERS: RTCIceServer[] = [
  { urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] },
];

const POLL_INTERVAL_MS = 1500;

export interface RemoteParticipant {
  userId: string;
  username: string;
  stream: MediaStream | null;
}

export function useWebRTCCall() {
  const [status, setStatus] = useState<'idle' | 'connecting' | 'in-call' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteParticipants, setRemoteParticipants] = useState<Map<string, RemoteParticipant>>(new Map());
  const [micEnabled, setMicEnabled] = useState(true);
  const [cameraEnabled, setCameraEnabled] = useState(true);

  // Structured speaking turns — the feature that makes this different from a plain
  // Meet-style call: a raise-hand queue with a per-speaker timer, tailored to language
  // practice/debate sessions rather than open-floor talk.
  const [speakingMode, setSpeakingMode] = useState<SpeakingMode>('OPEN');
  const [speakerTimeSec, setSpeakerTimeSec] = useState<number | null>(null);
  const [currentSpeaker, setCurrentSpeaker] = useState<QueuedSpeaker | null>(null);
  const [currentSpeakerStartedAt, setCurrentSpeakerStartedAt] = useState<string | null>(null);
  const [queue, setQueue] = useState<QueuedSpeaker[]>([]);

  const callSessionIdRef = useRef<string | null>(null);
  const myUserIdRef = useRef<string | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const pendingCandidatesRef = useRef<Map<string, RTCIceCandidateInit[]>>(new Map());
  const usernamesRef = useRef<Map<string, string>>(new Map());
  const lastSignalAtRef = useRef<string | null>(null);
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const advanceInFlightRef = useRef(false);

  const upsertRemoteParticipant = useCallback((userId: string, patch: Partial<RemoteParticipant>) => {
    setRemoteParticipants((prev) => {
      const next = new Map(prev);
      const existing = next.get(userId) || { userId, username: usernamesRef.current.get(userId) || 'Learner', stream: null };
      next.set(userId, { ...existing, ...patch });
      return next;
    });
  }, []);

  const createPeerConnection = useCallback(
    (remoteUserId: string) => {
      const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
      localStreamRef.current?.getTracks().forEach((track) => pc.addTrack(track, localStreamRef.current!));

      pc.onicecandidate = (e) => {
        if (e.candidate && callSessionIdRef.current) {
          sendCallSignal(callSessionIdRef.current, 'ICE_CANDIDATE', remoteUserId, e.candidate.toJSON()).catch(() => undefined);
        }
      };
      pc.ontrack = (e) => {
        upsertRemoteParticipant(remoteUserId, { stream: e.streams[0] });
      };
      pc.onconnectionstatechange = () => {
        if (pc.connectionState === 'failed' || pc.connectionState === 'closed') {
          peerConnectionsRef.current.delete(remoteUserId);
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
    setRemoteParticipants((prev) => {
      const next = new Map(prev);
      next.delete(fromUserId);
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
    }
  }, [handleOffer, handleAnswer, handleIceCandidate, handleLeave]);

  const applySpeakingState = useCallback(
    (state: { speakingMode: SpeakingMode; speakerTimeSec: number | null; currentSpeaker: QueuedSpeaker | null; currentSpeakerStartedAt: string | null; queue: QueuedSpeaker[] }) => {
      setSpeakingMode(state.speakingMode);
      setSpeakerTimeSec(state.speakerTimeSec);
      setCurrentSpeaker(state.currentSpeaker);
      setCurrentSpeakerStartedAt(state.currentSpeakerStartedAt);
      setQueue(state.queue);

      // In structured mode, only the current speaker's mic is actually live — enforced here,
      // not just in the UI, so no one can talk over their turn.
      if (state.speakingMode === 'STRUCTURED') {
        const isMyTurn = state.currentSpeaker?.id === myUserIdRef.current;
        localStreamRef.current?.getAudioTracks().forEach((t) => (t.enabled = isMyTurn));
        setMicEnabled(isMyTurn);
      }
    },
    [],
  );

  const refreshCallState = useCallback(async () => {
    if (!callSessionIdRef.current) return;
    const state = await fetchCallState(callSessionIdRef.current).catch(() => null);
    if (!state) return;
    applySpeakingState(state);

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
  }, [applySpeakingState]);

  const join = useCallback(
    async (
      channelId: string,
      myUserId: string,
      existingParticipants?: CallParticipant[],
      settings?: { speakingMode: SpeakingMode; speakerTimeSec?: number },
    ) => {
      setStatus('connecting');
      setError(null);
      myUserIdRef.current = myUserId;
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

        const result = await joinCall(channelId, settings);
        callSessionIdRef.current = result.callSessionId;
        lastSignalAtRef.current = new Date().toISOString();
        applySpeakingState(result);

        const participants = existingParticipants || result.participants;
        for (const p of participants) {
          usernamesRef.current.set(p.userId, p.user.username);
          upsertRemoteParticipant(p.userId, {});
          const pc = createPeerConnection(p.userId);
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          await sendCallSignal(result.callSessionId, 'OFFER', p.userId, offer);
        }

        pollTimerRef.current = setInterval(() => {
          pollOnce();
          refreshCallState();
        }, POLL_INTERVAL_MS);
        setStatus('in-call');
      } catch (err: any) {
        setError(err?.response?.data?.error || err?.message || 'Could not join the call — check camera/mic permissions.');
        setStatus('error');
      }
    },
    [createPeerConnection, pollOnce, refreshCallState, applySpeakingState, upsertRemoteParticipant],
  );

  const leave = useCallback(async () => {
    if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    pollTimerRef.current = null;
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;
    setLocalStream(null);
    peerConnectionsRef.current.forEach((pc) => pc.close());
    peerConnectionsRef.current.clear();
    pendingCandidatesRef.current.clear();
    setRemoteParticipants(new Map());
    if (callSessionIdRef.current) {
      await leaveCall(callSessionIdRef.current).catch(() => undefined);
    }
    callSessionIdRef.current = null;
    myUserIdRef.current = null;
    lastSignalAtRef.current = null;
    advanceInFlightRef.current = false;
    setSpeakingMode('OPEN');
    setSpeakerTimeSec(null);
    setCurrentSpeaker(null);
    setCurrentSpeakerStartedAt(null);
    setQueue([]);
    setStatus('idle');
  }, []);

  const toggleMic = useCallback(() => {
    if (speakingMode === 'STRUCTURED') return; // mic is turn-controlled — use raise/lower hand instead
    const next = !micEnabled;
    localStreamRef.current?.getAudioTracks().forEach((t) => (t.enabled = next));
    setMicEnabled(next);
  }, [micEnabled, speakingMode]);

  const raiseHand = useCallback(async () => {
    if (!callSessionIdRef.current) return;
    const state = await apiRaiseHand(callSessionIdRef.current).catch(() => null);
    if (state) applySpeakingState(state);
  }, [applySpeakingState]);

  const lowerHand = useCallback(async () => {
    if (!callSessionIdRef.current) return;
    const state = await apiLowerHand(callSessionIdRef.current).catch(() => null);
    if (state) applySpeakingState(state);
  }, [applySpeakingState]);

  const skipSpeaker = useCallback(async () => {
    if (!callSessionIdRef.current) return;
    const state = await apiAdvanceSpeaker(callSessionIdRef.current).catch(() => null);
    if (state) applySpeakingState(state);
  }, [applySpeakingState]);

  const toggleCamera = useCallback(() => {
    const next = !cameraEnabled;
    localStreamRef.current?.getVideoTracks().forEach((t) => (t.enabled = next));
    setCameraEnabled(next);
  }, [cameraEnabled]);

  return {
    status,
    error,
    localStream,
    remoteParticipants: Array.from(remoteParticipants.values()),
    micEnabled,
    cameraEnabled,
    speakingMode,
    speakerTimeSec,
    currentSpeaker,
    currentSpeakerStartedAt,
    queue,
    join,
    leave,
    toggleMic,
    toggleCamera,
    raiseHand,
    lowerHand,
    skipSpeaker,
  };
}
