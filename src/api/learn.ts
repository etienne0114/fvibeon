import client from './client';

export async function fetchCourses(params?: Record<string, string | number>) {
  const response = await client.get('/courses', { params });
  return response.data;
}

export async function fetchDashboard() {
  const response = await client.get('/learn/dashboard');
  return response.data;
}

export async function enrollCourse(courseId: string) {
  const response = await client.post('/progress/enroll', { courseId });
  return response.data;
}

export async function trackProgress(payload: {
  courseId: string;
  lessonId: string;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
  completionPercentage?: number;
  timeSpentMinutes?: number;
}) {
  const response = await client.post('/progress/track', payload);
  return response.data;
}

export async function chatWithTutor(message: string) {
  const response = await client.post('/ai/tutor', { message });
  return response.data;
}
