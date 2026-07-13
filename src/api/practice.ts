import client from './client';

export interface VocabularyEntry {
  vocabularyItemId: string;
  word: string;
  definition: string;
  partOfSpeech: string;
  difficulty: number;
  language: string;
  examples: string[];
  masteryLevel: number;
  streak: number;
  nextReviewAt: string | null;
  isNew?: boolean;
}

export interface GrammarError {
  incorrectText: string;
  correction: string;
  startIndex: number;
  endIndex: number;
  errorType: string;
  explanation?: string;
}

export interface AIReply {
  reply: string;
  grammarErrors?: GrammarError[];
  nativeSpeakerVersion?: string | null;
  confidence?: number | null;
  transcribedText?: string | null;
}

export interface VocabularyStats {
  totalWords: number;
  mastered: number;
  learning: number;
  accuracy: number;
  currentStreak: number;
}

export interface RoleplayScenario {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: number;
  instructions?: string;
  tags: string[];
}

export interface RoleplaySession {
  sessionId: string;
  scenario: RoleplayScenario;
  greeting: string;
}

export interface QuizQuestion {
  id: string;
  text: string;
  options: string[];
  points: number;
}

export interface QuizPayload {
  quizId: string;
  title: string;
  questions: QuizQuestion[];
}

export interface QuizResult {
  score: number;
  maxScore: number;
  percentage: number;
  passed: boolean;
  passingScore: number;
  results: Array<{
    questionId: string;
    question: string;
    selectedAnswer: string;
    correctAnswer: string;
    explanation: string;
    correct: boolean;
    options: string[];
  }>;
}

export interface QuizHistoryItem {
  id: string;
  quizTitle: string;
  score: number;
  passed: boolean;
  completedAt: string;
}

export interface TechnologyTopic {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: number;
  tags: string[];
}

export interface TechnologySession {
  sessionId: string;
  topic: TechnologyTopic;
  intro: string;
}

export interface Achievement {
  type: string;
  title: string;
  description: string;
  xpReward: number;
  unlocked: boolean;
  unlockedAt: string | null;
}

export interface AchievementPayload {
  achievements: Achievement[];
  totalXP: number;
  unlockedCount: number;
}

function handleResponse(response: any) {
  return response.data?.data;
}

const addCacheBust = (params: Record<string, any>) => ({ params: { ...params, _t: Date.now() } });

export async function fetchDailyVocabulary(language = 'en') {
  const response = await client.get('/learn/practice/vocabulary/daily', addCacheBust({ language }));
  return handleResponse(response) as VocabularyEntry | null;
}

export async function fetchVocabularyQueue(language = 'en', limit = 8) {
  const response = await client.get('/learn/practice/vocabulary/queue', addCacheBust({ language, limit }));
  return handleResponse(response) as VocabularyEntry[];
}

export async function markVocabularyResult(vocabularyItemId: string, correct: boolean) {
  const response = await client.post('/learn/practice/vocabulary/mark', { vocabularyItemId, correct });
  return handleResponse(response) as { masteryLevel: number; streak: number; nextReviewAt: string | null };
}

export async function fetchVocabularyStats() {
  const response = await client.get('/learn/practice/vocabulary/stats', addCacheBust({}));
  return handleResponse(response) as VocabularyStats;
}

export async function fetchRoleplayScenarios(category?: string) {
  const params = category ? { category } : {};
  const response = await client.get('/learn/practice/roleplay/scenarios', addCacheBust(params));
  return handleResponse(response) as RoleplayScenario[];
}

export async function startRoleplaySession(scenarioId: string, language?: string) {
  const response = await client.post('/learn/practice/roleplay/start', { scenarioId, language });
  return handleResponse(response) as RoleplaySession;
}

export async function sendRoleplayMessage(sessionId: string, message: string, language?: string, audio?: string) {
  const response = await client.post('/learn/practice/roleplay/message', { sessionId, message, language, audio });
  return handleResponse(response) as AIReply;
}

export async function completeRoleplaySession(sessionId: string) {
  const response = await client.post('/learn/practice/roleplay/complete', { sessionId });
  return handleResponse(response) as { feedback: string; completedAt: string };
}

export async function generateQuiz(topic: string, language?: string, count?: number) {
  const response = await client.post('/learn/practice/quiz/generate', { topic, language, count });
  return handleResponse(response) as QuizPayload;
}

export interface QuizAnswer {
  questionId: string;
  selectedAnswer: string;
}

export async function submitQuizAnswer(quizId: string, answers: QuizAnswer[]) {
  const response = await client.post('/learn/practice/quiz/submit', { quizId, answers });
  return handleResponse(response) as QuizResult;
}

export async function fetchQuizHistory(limit = 10) {
  const response = await client.get('/learn/practice/quiz/history', addCacheBust({ limit }));
  return handleResponse(response) as QuizHistoryItem[];
}

export async function fetchTechnologyTopics(category?: string) {
  const params = category ? { category } : {};
  const response = await client.get('/learn/practice/technology/topics', addCacheBust(params));
  return handleResponse(response) as TechnologyTopic[];
}

export async function startTechnologySession(topicId: string, language?: string) {
  const response = await client.post('/learn/practice/technology/start', { topicId, language });
  return handleResponse(response) as TechnologySession;
}

export async function sendTechnologyMessage(sessionId: string, message: string, language?: string, audio?: string) {
  const response = await client.post('/learn/practice/technology/message', { sessionId, message, language, audio });
  return handleResponse(response) as AIReply;
}

export async function completeTechnologySession(sessionId: string) {
  const response = await client.post('/learn/practice/technology/complete', { sessionId });
  return handleResponse(response) as { feedback: string; completedAt: string };
}

export async function fetchAchievements() {
  const response = await client.get('/learn/practice/achievements', addCacheBust({}));
  return handleResponse(response) as AchievementPayload;
}
