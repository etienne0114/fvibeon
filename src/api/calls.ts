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

export interface PendingJoinRequest {
  userId: string;
  username: string;
}

export interface CallSettingsState {
  speakingMode: SpeakingMode;
  speakerTimeSec: number | null;
  currentSpeaker: QueuedSpeaker | null;
  currentSpeakerStartedAt: string | null;
  queue: QueuedSpeaker[];
  requireApproval: boolean;
  autoMuteOnJoin: boolean;
  topic: string | null;
  startedBy: string;
  startedAt: string;
  /** Whether the caller is this call's host (its starter, or a space owner/moderator). */
  isHost: boolean;
  /** Populated only when the caller is the call's host. */
  joinRequests: PendingJoinRequest[];
}

export interface ActiveCall extends CallSettingsState {
  id: string;
  channelId: string;
  startedAt: string;
  participants: CallParticipant[];
}

export interface CallState extends CallSettingsState {
  participants: CallParticipant[];
}

export interface StartCallSettings {
  speakingMode: SpeakingMode;
  speakerTimeSec?: number;
  topic?: string;
  requireApproval?: boolean;
  autoMuteOnJoin?: boolean;
}

export type JoinCallResult =
  | ({ pending?: false; callSessionId: string; participants: CallParticipant[] } & CallSettingsState)
  | { pending: true; callSessionId: string; topic: string | null; speakingMode: SpeakingMode };

export interface CallSignal {
  id: string;
  fromUserId: string;
  toUserId: string | null;
  type: 'OFFER' | 'ANSWER' | 'ICE_CANDIDATE' | 'JOIN' | 'LEAVE' | 'KICKED' | 'MEDIA_STATE' | 'FORCE_MUTE';
  payload: string;
  createdAt: string;
}

function unwrap(response: any) {
  return response.data.data;
}

export async function fetchActiveCall(channelId: string): Promise<ActiveCall | null> {
  return unwrap(await client.get(`/calls/channel/${channelId}`));
}

export async function joinCall(channelId: string, settings?: StartCallSettings): Promise<JoinCallResult> {
  return unwrap(await client.post(`/calls/channel/${channelId}/join`, settings || {}));
}

export async function leaveCall(callSessionId: string) {
  return unwrap(await client.post(`/calls/${callSessionId}/leave`));
}

export async function fetchCallState(callSessionId: string): Promise<CallState> {
  return unwrap(await client.get(`/calls/${callSessionId}/state`));
}

export async function raiseHand(callSessionId: string): Promise<CallSettingsState> {
  return unwrap(await client.post(`/calls/${callSessionId}/raise-hand`));
}

export async function lowerHand(callSessionId: string): Promise<CallSettingsState> {
  return unwrap(await client.post(`/calls/${callSessionId}/lower-hand`));
}

export async function advanceSpeaker(callSessionId: string): Promise<CallSettingsState> {
  return unwrap(await client.post(`/calls/${callSessionId}/advance-speaker`));
}

export async function fetchJoinRequestStatus(callSessionId: string): Promise<{ status: 'PENDING' | 'APPROVED' | 'DENIED' | null }> {
  return unwrap(await client.get(`/calls/${callSessionId}/join-request-status`));
}

export async function resolveJoinRequest(callSessionId: string, requesterId: string, decision: 'APPROVE' | 'DENY') {
  return unwrap(await client.post(`/calls/${callSessionId}/join-requests/${requesterId}/resolve`, { decision }));
}

export async function updateCallSettings(
  callSessionId: string,
  patch: Partial<{ speakingMode: SpeakingMode; speakerTimeSec: number; topic: string; requireApproval: boolean; autoMuteOnJoin: boolean }>,
): Promise<CallSettingsState> {
  return unwrap(await client.patch(`/calls/${callSessionId}/settings`, patch));
}

export async function removeParticipant(callSessionId: string, targetUserId: string): Promise<CallSettingsState> {
  return unwrap(await client.post(`/calls/${callSessionId}/participants/${targetUserId}/remove`));
}

export async function sendCallSignal(
  callSessionId: string,
  type: 'OFFER' | 'ANSWER' | 'ICE_CANDIDATE' | 'MEDIA_STATE' | 'FORCE_MUTE',
  toUserId: string | null,
  payload: unknown,
) {
  return unwrap(await client.post(`/calls/${callSessionId}/signal`, { type, toUserId, payload }));
}

export async function pollCallSignals(callSessionId: string, since: string | null): Promise<CallSignal[]> {
  return unwrap(await client.get(`/calls/${callSessionId}/signals`, { params: since ? { since } : {} }));
}
