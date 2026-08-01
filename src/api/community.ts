import client from './client';

export interface SentenceToCorrect {
  id: string;
  language: string;
  text: string;
  createdAt: string;
  user: { username: string };
}

export interface MySubmission {
  id: string;
  language: string;
  text: string;
  status: 'PENDING' | 'CORRECTED';
  createdAt: string;
  correction: {
    correctedText: string;
    note: string | null;
    createdAt: string;
    corrector: { username: string };
  } | null;
}

export interface CommunityStats {
  submitted: number;
  corrected: number;
  pendingReceived: number;
}

function handleResponse(response: any) {
  return response.data.data;
}

export async function submitSentence(language: string, text: string) {
  const response = await client.post('/community/sentences', { language, text });
  return handleResponse(response);
}

export async function fetchSentenceToCorrect(language: string): Promise<SentenceToCorrect | null> {
  const response = await client.get('/community/sentences/to-correct', { params: { language } });
  return handleResponse(response);
}

export async function submitCorrection(submissionId: string, correctedText: string, note?: string) {
  const response = await client.post(`/community/sentences/${submissionId}/correct`, { correctedText, note });
  return handleResponse(response);
}

export async function fetchMySubmissions(): Promise<MySubmission[]> {
  const response = await client.get('/community/sentences/mine');
  return handleResponse(response);
}

export async function fetchCommunityStats(): Promise<CommunityStats> {
  const response = await client.get('/community/stats');
  return handleResponse(response);
}

export interface AudioContribution {
  id: string;
  createdAt: string;
  contributor: { username: string };
}

export async function fetchAudioForWord(word: string, language: string): Promise<AudioContribution[]> {
  const response = await client.get('/community/audio', { params: { word, language } });
  return handleResponse(response);
}

export function audioFileUrl(id: string) {
  const base = (client.defaults.baseURL || '/api').replace(/\/$/, '');
  return `${base}/community/audio/${id}/file`;
}

export async function submitAudioContribution(word: string, language: string, audioBase64: string, mimeType: string) {
  const response = await client.post('/community/audio', { word, language, audio: audioBase64, mimeType });
  return handleResponse(response);
}

export async function reportAudioContribution(id: string) {
  const response = await client.post(`/community/audio/${id}/report`);
  return handleResponse(response);
}
