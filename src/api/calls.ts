import client from './client';

export interface CallParticipant {
  id: string;
  userId: string;
  joinedAt: string;
  user: { id: string; username: string };
}

export interface ActiveCall {
  id: string;
  channelId: string;
  startedAt: string;
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

export async function joinCall(channelId: string): Promise<{ callSessionId: string; participants: CallParticipant[] }> {
  return unwrap(await client.post(`/calls/channel/${channelId}/join`));
}

export async function leaveCall(callSessionId: string) {
  return unwrap(await client.post(`/calls/${callSessionId}/leave`));
}

export async function sendCallSignal(callSessionId: string, type: 'OFFER' | 'ANSWER' | 'ICE_CANDIDATE', toUserId: string, payload: unknown) {
  return unwrap(await client.post(`/calls/${callSessionId}/signal`, { type, toUserId, payload }));
}

export async function pollCallSignals(callSessionId: string, since: string | null): Promise<CallSignal[]> {
  return unwrap(await client.get(`/calls/${callSessionId}/signals`, { params: since ? { since } : {} }));
}
