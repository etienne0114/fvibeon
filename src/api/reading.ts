import client from './client';

export type SkillLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
export type Skill = 'READING' | 'LISTENING';

export interface SkillPassage {
  passageId: string;
  language: string;
  level: SkillLevel;
  contentType: 'WORDS' | 'PARAGRAPH';
  topic?: string;
  words?: string[];
  text?: string;
}

export interface SkillStats {
  totalSessions: number;
  avgAccuracy: number;
  level: SkillLevel;
  streak: number;
}

export interface SkillMistake {
  expected: string;
  heard: string;
}

const addCacheBust = (params: Record<string, any>) => ({ params: { ...params, _t: Date.now() } });
const handleResponse = (response: any) => response.data?.data;

const basePath = (skill: Skill) => (skill === 'READING' ? '/learn/reading' : '/learn/listening');

export async function fetchSkillPassage(skill: Skill, language = 'en', level?: SkillLevel) {
  const response = await client.get(`${basePath(skill)}/passage`, addCacheBust({ language, level }));
  return handleResponse(response) as SkillPassage;
}

export async function submitSkillSession(
  skill: Skill,
  payload: { passageId: string; accuracy: number; mistakes?: SkillMistake[] },
) {
  const response = await client.post(`${basePath(skill)}/sessions`, payload);
  return handleResponse(response) as { sessionId: string; accuracy: number; level: SkillLevel };
}

export async function fetchSkillStats(skill: Skill, language = 'en') {
  const response = await client.get(`${basePath(skill)}/stats`, addCacheBust({ language }));
  return handleResponse(response) as SkillStats;
}
