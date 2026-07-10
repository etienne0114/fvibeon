import client from './client';

export interface AuthResponse {
  token: string;
  user: { id: string; email: string; username: string };
}

export interface RegisterResponse {
  success: boolean;
  requiresVerification: boolean;
  email: string;
  message: string;
}

export async function register(payload: { username: string; email: string; password: string }) {
  const response = await client.post('/auth/register', payload);
  return response.data as RegisterResponse;
}

// New sign-up flow: identity → email code → password → optional profile
export async function registerStart(payload: {
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
}) {
  const response = await client.post('/auth/register/start', payload);
  return response.data as RegisterResponse;
}

export async function registerCheckCode(payload: { email: string; code: string }) {
  const response = await client.post('/auth/register/check-code', payload);
  return response.data as { success: boolean; message: string };
}

export async function registerComplete(payload: { email: string; code: string; password: string }) {
  const response = await client.post('/auth/register/complete', payload);
  return response.data as { success: boolean } & AuthResponse;
}

export interface ProfilePayload {
  firstName?: string;
  lastName?: string;
  preferredLanguage?: string;
  learningLanguage?: string;
  proficiencyLevel?: 'BEGINNER' | 'ELEMENTARY' | 'INTERMEDIATE' | 'ADVANCED';
  dailyGoalMinutes?: number;
}

// Token passed explicitly: during onboarding it is not committed globally yet
export async function updateProfile(payload: ProfilePayload, token: string) {
  const response = await client.patch('/auth/profile', payload, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data as { success: boolean; user: AuthResponse['user'] };
}

export async function login(payload: { email: string; password: string }) {
  const response = await client.post('/auth/login', payload);
  return response.data as { success: boolean } & AuthResponse;
}

export async function verifyEmail(payload: { email: string; code: string }) {
  const response = await client.post('/auth/verify-email', payload);
  return response.data as { success: boolean } & AuthResponse;
}

export async function resendCode(payload: { email: string }) {
  const response = await client.post('/auth/resend-code', payload);
  return response.data as { success: boolean; message: string };
}

export async function googleLogin(credential: string) {
  const response = await client.post('/auth/google', { credential });
  return response.data as { success: boolean } & AuthResponse;
}

export async function forgotPassword(payload: { email: string }) {
  const response = await client.post('/auth/forgot-password', payload);
  return response.data as { success: boolean; message: string };
}

export async function resetPassword(payload: { email: string; code: string; newPassword: string }) {
  const response = await client.post('/auth/reset-password', payload);
  return response.data as { success: boolean } & AuthResponse;
}

export async function verifyResetCode(payload: { email: string; code: string }) {
  const response = await client.post('/auth/verify-reset-code', payload);
  return response.data as { success: boolean; message: string };
}
