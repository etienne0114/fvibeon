import client from './client';

export interface SpaceSummary {
  id: string;
  name: string;
  description: string | null;
  visibility: 'PUBLIC' | 'PRIVATE';
  ownerId: string;
  createdAt: string;
  myRole: 'OWNER' | 'MODERATOR' | 'MEMBER' | null;
  _count: { memberships: number; channels: number };
}

export interface ChannelSummary {
  id: string;
  name: string;
  description: string | null;
  type: 'TEXT' | 'DEBATE';
  order: number;
}

export interface SpaceDetail extends SpaceSummary {
  channels: ChannelSummary[];
}

export interface PrivateSpaceLocked {
  id: string;
  name: string;
  visibility: 'PRIVATE';
  notAMember: true;
}

export interface ChannelMessage {
  id: string;
  type: 'TEXT' | 'VOICE' | 'IMAGE';
  text: string | null;
  mimeType: string | null;
  createdAt: string;
  user: { id: string; username: string };
}

export interface DebateRequest {
  id: string;
  channelId: string;
  userId: string;
  status: 'PENDING' | 'APPROVED' | 'DECLINED';
  createdAt: string;
  user: { id: string; username: string };
}

function unwrap(response: any) {
  return response.data.data;
}

export async function createSpace(name: string, description: string, visibility: 'PUBLIC' | 'PRIVATE') {
  return unwrap(await client.post('/spaces', { name, description, visibility }));
}

export async function fetchSpaces(): Promise<SpaceSummary[]> {
  return unwrap(await client.get('/spaces'));
}

export async function fetchSpace(spaceId: string): Promise<SpaceDetail | PrivateSpaceLocked> {
  return unwrap(await client.get(`/spaces/${spaceId}`));
}

export async function joinSpace(spaceId: string) {
  return unwrap(await client.post(`/spaces/${spaceId}/join`));
}

export async function joinViaInvite(code: string): Promise<{ spaceId: string }> {
  return unwrap(await client.post(`/spaces/join/${code}`));
}

export async function createInvite(spaceId: string): Promise<{ code: string }> {
  return unwrap(await client.post(`/spaces/${spaceId}/invites`));
}

export async function createChannel(spaceId: string, name: string, description: string, type: 'TEXT' | 'DEBATE') {
  return unwrap(await client.post(`/spaces/${spaceId}/channels`, { name, description, type }));
}

export async function fetchMessages(channelId: string): Promise<{ channel: ChannelSummary; messages: ChannelMessage[] }> {
  return unwrap(await client.get(`/spaces/channels/${channelId}/messages`));
}

export async function postTextMessage(channelId: string, text: string) {
  return unwrap(await client.post(`/spaces/channels/${channelId}/messages`, { type: 'TEXT', text }));
}

export async function postMediaMessage(channelId: string, type: 'VOICE' | 'IMAGE', media: string, mimeType: string) {
  return unwrap(await client.post(`/spaces/channels/${channelId}/messages`, { type, media, mimeType }));
}

export function messageMediaUrl(messageId: string) {
  const base = (client.defaults.baseURL || '/api').replace(/\/$/, '');
  return `${base}/spaces/messages/${messageId}/media`;
}

export async function requestToJoinDebate(channelId: string) {
  return unwrap(await client.post(`/spaces/channels/${channelId}/debate/request`));
}

export async function fetchDebateRequests(channelId: string): Promise<DebateRequest[]> {
  return unwrap(await client.get(`/spaces/channels/${channelId}/debate/requests`));
}

export async function fetchMyDebateStatus(channelId: string): Promise<string | null> {
  const result = await unwrap(await client.get(`/spaces/channels/${channelId}/debate/my-status`));
  return result.status;
}

export async function resolveDebateRequest(requestId: string, approve: boolean) {
  return unwrap(await client.post(`/spaces/debate/requests/${requestId}/resolve`, { approve }));
}
