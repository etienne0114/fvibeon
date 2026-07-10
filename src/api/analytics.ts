import client from './client';

export interface AnalyticsPayload {
  completedCourses: number;
  averageProgress: number;
  mostRecentCourse: { id: string; title: string } | null;
}

export async function fetchAnalytics() {
  const response = await client.get('/learn/analytics');
  return response.data.data as AnalyticsPayload;
}
