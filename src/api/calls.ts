import client from './client';

export type SpeakingMode = 'OPEN' | 'STRUCTURED';

export interface CallParticipant {
  id: string;
  userId: string;
  joinedAt: string;
  user: { id: string; username: string };
}

export interface QueuedSpeaker {
  id: string;
  username: string;
}

export interface SpeakingState {
  speakingMode: SpeakingMode;
  speakerTimeSec: number | null;
  currentSpeaker: QueuedSpeaker | null;
  currentSpeakerStartedAt: string | null;
  queue: QueuedSpeaker[];
}

export interface ActiveCall extends SpeakingState {
  id: string;
  channelId: string;
  startedAt: string;
  participants: CallParticipant[];
}

export interface CallState extends SpeakingState {
  participants: CallParticipant[];
}

export interface CallSignal {
  id: string;
  fromUserId: string;
  toUserId: string | null;
  type: 'OFFER' | 'ANSWER' | 'ICE_CANDIDATE' | 'JOIN' | 'LEAVE';
  payload: string;
  createdAt: string;
}

function unwrap(response: any) {
  return response.data.data;
}

export async function fetchActiveCall(channelId: string): Promise<ActiveCall | null> {
  return unwrap(await client.get(`/calls/channel/${channelId}`));
}

export async function joinCall(
  channelId: string,
  settings?: { speakingMode: SpeakingMode; speakerTimeSec?: number },
): Promise<{ callSessionId: string; participants: CallParticipant[] } & SpeakingState> {
  return unwrap(await client.post(`/calls/channel/${channelId}/join`, settings || {}));
}

export async function leaveCall(callSessionId: string) {
  return unwrap(await client.post(`/calls/${callSessionId}/leave`));
}

export async function fetchCallState(callSessionId: string): Promise<CallState> {
  return unwrap(await client.get(`/calls/${callSessionId}/state`));
}

export async function raiseHand(callSessionId: string): Promise<SpeakingState> {
  return unwrap(await client.post(`/calls/${callSessionId}/raise-hand`));
}

export async function lowerHand(callSessionId: string): Promise<SpeakingState> {
  return unwrap(await client.post(`/calls/${callSessionId}/lower-hand`));
}

export async function advanceSpeaker(callSessionId: string): Promise<SpeakingState> {
  return unwrap(await client.post(`/calls/${callSessionId}/advance-speaker`));
}

export async function sendCallSignal(callSessionId: string, type: 'OFFER' | 'ANSWER' | 'ICE_CANDIDATE', toUserId: string, payload: unknown) {
  return unwrap(await client.post(`/calls/${callSessionId}/signal`, { type, toUserId, payload }));
}

export async function pollCallSignals(callSessionId: string, since: string | null): Promise<CallSignal[]> {
  return unwrap(await client.get(`/calls/${callSessionId}/signals`, { params: since ? { since } : {} }));
}
