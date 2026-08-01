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

export async function fetchCourse(courseId: string) {
  const response = await client.get(`/courses/${courseId}`);
  return response.data;
}

export async function fetchMe() {
  const response = await client.get('/auth/me');
  return response.data;
}

export interface Certificate {
  id: string;
  courseId: string | null;
  title: string;
  description: string | null;
  type: string;
  status: string;
  issuerName: string;
  issueDate: string;
  verifyCode: string;
  metadata?: { courseTitle?: string; finalScore?: number; achievements?: string[] } | null;
}

export async function fetchMyCertificates(): Promise<Certificate[]> {
  const response = await client.get('/certificates');
  return response.data.data;
}

export async function fetchCourseCertificate(courseId: string): Promise<Certificate> {
  const response = await client.get(`/certificates/course/${courseId}`);
  return response.data.data;
}

export interface PlacementQuestion {
  index: number;
  type: 'mc' | 'fill';
  question: string;
  options?: string[];
}

export interface PlacementResult {
  score: number;
  total: number;
  recommendedLevel: string;
  breakdown: { index: number; correct: boolean; explanation?: string }[];
}

export async function fetchPlacementTest(): Promise<PlacementQuestion[]> {
  const response = await client.get('/learn/placement-test');
  return response.data.data;
}

export async function submitPlacementTest(answers: (string | number)[]): Promise<PlacementResult> {
  const response = await client.post('/learn/placement-test/submit', { answers });
  return response.data.data;
}

export interface PathSummary {
  id: string;
  title: string;
  description: string | null;
  difficulty: string;
  estimatedDuration: number;
  _count: { steps: number; enrollments: number };
  enrollment: { progress: number; status: string } | null;
}

export interface PathStepDetail {
  id: string;
  title: string;
  description: string | null;
  order: number;
  isRequired: boolean;
  courseId: string | null;
  course: { id: string; title: string; description: string; level: string } | null;
  courseEnrolled: boolean;
  courseProgress: number;
  courseCompleted: boolean;
}

export interface PathDetail {
  id: string;
  title: string;
  description: string | null;
  difficulty: string;
  estimatedDuration: number;
  steps: PathStepDetail[];
  enrollment: { progress: number; status: string } | null;
}

export async function fetchPaths(): Promise<PathSummary[]> {
  const response = await client.get('/paths');
  return response.data.data;
}

export async function fetchPath(pathId: string): Promise<PathDetail> {
  const response = await client.get(`/paths/${pathId}`);
  return response.data.data;
}

export async function enrollPath(pathId: string) {
  const response = await client.post(`/paths/${pathId}/enroll`);
  return response.data.data;
}
