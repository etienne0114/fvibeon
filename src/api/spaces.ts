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

export interface DebatePhase {
  name: string;
  perSideSeconds: number;
}

export interface ChannelSummary {
  id: string;
  name: string;
  description: string | null;
  type: 'TEXT' | 'DEBATE';
  order: number;
  debateQuestion?: string | null;
  debatePolicies?: string | null;
  /** Raw JSON string from the API — use `parseDebatePhases` rather than JSON.parse directly. */
  debatePhases?: string | null;
}

export function parseDebatePhases(raw?: string | null): DebatePhase[] | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
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

export interface MessageReactionSummary {
  emoji: string;
  count: number;
  reactedByMe: boolean;
}

export interface ChannelMessage {
  id: string;
  type: 'TEXT' | 'VOICE' | 'IMAGE';
  text: string | null;
  mimeType: string | null;
  createdAt: string;
  user: { id: string; username: string };
  replyCount?: number;
  reactions?: MessageReactionSummary[];
}

export interface DebateRequest {
  id: string;
  channelId: string;
  userId: string;
  status: 'PENDING' | 'APPROVED' | 'DECLINED';
  side?: 'FOR' | 'AGAINST' | null;
  createdAt: string;
  user: { id: string; username: string };
}

export interface DebateVoteTally {
  counts: { FOR: number; AGAINST: number; NEUTRAL: number };
  total: number;
  myVote: 'FOR' | 'AGAINST' | 'NEUTRAL' | null;
}

export interface SpaceMember {
  id: string;
  role: 'OWNER' | 'MODERATOR' | 'MEMBER';
  joinedAt: string;
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

export async function updateSpace(spaceId: string, updates: { name?: string; description?: string; visibility?: 'PUBLIC' | 'PRIVATE' }) {
  return unwrap(await client.patch(`/spaces/${spaceId}`, updates));
}

export async function deleteSpace(spaceId: string) {
  return unwrap(await client.delete(`/spaces/${spaceId}`));
}

export async function leaveSpace(spaceId: string) {
  return unwrap(await client.post(`/spaces/${spaceId}/leave`));
}

export async function fetchMembers(spaceId: string): Promise<SpaceMember[]> {
  return unwrap(await client.get(`/spaces/${spaceId}/members`));
}

export async function updateMemberRole(spaceId: string, userId: string, role: 'MODERATOR' | 'MEMBER') {
  return unwrap(await client.patch(`/spaces/${spaceId}/members/${userId}/role`, { role }));
}

export async function removeMember(spaceId: string, userId: string) {
  return unwrap(await client.delete(`/spaces/${spaceId}/members/${userId}`));
}

export async function transferOwnership(spaceId: string, userId: string) {
  return unwrap(await client.post(`/spaces/${spaceId}/transfer/${userId}`));
}

export interface DebateChannelSettings {
  debateQuestion?: string;
  debatePolicies?: string;
  debatePhases?: DebatePhase[];
}

export async function createChannel(spaceId: string, name: string, description: string, type: 'TEXT' | 'DEBATE', debateSettings?: DebateChannelSettings) {
  return unwrap(await client.post(`/spaces/${spaceId}/channels`, { name, description, type, ...debateSettings }));
}

export async function updateChannel(channelId: string, updates: { name?: string; description?: string } & DebateChannelSettings) {
  return unwrap(await client.patch(`/spaces/channels/${channelId}`, updates));
}

export async function deleteChannel(channelId: string) {
  return unwrap(await client.delete(`/spaces/channels/${channelId}`));
}

export async function fetchMessages(channelId: string): Promise<{ channel: ChannelSummary; messages: ChannelMessage[] }> {
  return unwrap(await client.get(`/spaces/channels/${channelId}/messages`));
}

export async function postTextMessage(channelId: string, text: string, parentMessageId?: string) {
  return unwrap(await client.post(`/spaces/channels/${channelId}/messages`, { type: 'TEXT', text, parentMessageId }));
}

export async function postMediaMessage(channelId: string, type: 'VOICE' | 'IMAGE', media: string, mimeType: string, parentMessageId?: string) {
  return unwrap(await client.post(`/spaces/channels/${channelId}/messages`, { type, media, mimeType, parentMessageId }));
}

export async function deleteMessage(channelId: string, messageId: string) {
  return unwrap(await client.delete(`/spaces/channels/${channelId}/messages/${messageId}`));
}

export async function fetchReplies(messageId: string): Promise<{ root: ChannelMessage; replies: ChannelMessage[] }> {
  return unwrap(await client.get(`/spaces/messages/${messageId}/replies`));
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

export async function resolveDebateRequest(requestId: string, approve: boolean, side?: 'FOR' | 'AGAINST') {
  return unwrap(await client.post(`/spaces/debate/requests/${requestId}/resolve`, { approve, side }));
}

export async function fetchApprovedDebateParticipants(channelId: string): Promise<DebateRequest[]> {
  return unwrap(await client.get(`/spaces/channels/${channelId}/debate/participants`));
}

/** Every request regardless of status (pending/approved/declined) — for the participants sidebar. */
export async function fetchDebateRoster(channelId: string): Promise<DebateRequest[]> {
  return unwrap(await client.get(`/spaces/channels/${channelId}/debate/roster`));
}

export async function revokeDebateApproval(requestId: string) {
  return unwrap(await client.post(`/spaces/debate/requests/${requestId}/revoke`));
}

export async function castDebateVote(channelId: string, side: 'FOR' | 'AGAINST' | 'NEUTRAL'): Promise<DebateVoteTally> {
  return unwrap(await client.post(`/spaces/channels/${channelId}/debate/vote`, { side }));
}

export async function fetchDebateVoteTally(channelId: string): Promise<DebateVoteTally> {
  return unwrap(await client.get(`/spaces/channels/${channelId}/debate/vote`));
}

export async function toggleMessageReaction(messageId: string, emoji: string): Promise<MessageReactionSummary[]> {
  return unwrap(await client.post(`/spaces/messages/${messageId}/reactions`, { emoji }));
}
