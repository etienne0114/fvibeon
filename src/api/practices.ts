import client from './client';

export interface PracticeModule {
  id: string;
  title: string;
  description: string;
  icon: string;
  focus: string;
  level: string;
  durationMinutes: number;
  requiredCourses: number;
  scenarioId: string;
  unlocked: boolean;
  completionRate: number;
  friendlyDuration: string;
}

export async function fetchPracticeModules() {
  const response = await client.get('/learn/practices');
  return response.data.data as { modules: PracticeModule[] };
}

export async function startPracticeSession(moduleId: string) {
  const response = await client.post('/learn/practices/sessions', { moduleId });
  return response.data.data;
}
