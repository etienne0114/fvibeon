import { useCallback, useRef, useState } from 'react';
import { joinCall, leaveCall, sendCallSignal, pollCallSignals, CallParticipant } from '../api/calls';

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

  const callSessionIdRef = useRef<string | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const pendingCandidatesRef = useRef<Map<string, RTCIceCandidateInit[]>>(new Map());
  const usernamesRef = useRef<Map<string, string>>(new Map());
  const lastSignalAtRef = useRef<string | null>(null);
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

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

  const join = useCallback(
    async (channelId: string, existingParticipants?: CallParticipant[]) => {
      setStatus('connecting');
      setError(null);
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

        const result = await joinCall(channelId);
        callSessionIdRef.current = result.callSessionId;
        lastSignalAtRef.current = new Date().toISOString();

        const participants = existingParticipants || result.participants;
        for (const p of participants) {
          usernamesRef.current.set(p.userId, p.user.username);
          upsertRemoteParticipant(p.userId, {});
          const pc = createPeerConnection(p.userId);
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          await sendCallSignal(result.callSessionId, 'OFFER', p.userId, offer);
        }

        pollTimerRef.current = setInterval(pollOnce, POLL_INTERVAL_MS);
        setStatus('in-call');
      } catch (err: any) {
        setError(err?.response?.data?.error || err?.message || 'Could not join the call — check camera/mic permissions.');
        setStatus('error');
      }
    },
    [createPeerConnection, pollOnce, upsertRemoteParticipant],
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
    lastSignalAtRef.current = null;
    setStatus('idle');
  }, []);

  const toggleMic = useCallback(() => {
    const next = !micEnabled;
    localStreamRef.current?.getAudioTracks().forEach((t) => (t.enabled = next));
    setMicEnabled(next);
  }, [micEnabled]);

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
    join,
    leave,
    toggleMic,
    toggleCamera,
  };
}
