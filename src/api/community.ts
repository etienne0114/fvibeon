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
