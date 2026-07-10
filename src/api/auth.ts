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
