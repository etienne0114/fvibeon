import client from './client';

export interface AuthResponse {
  token: string;
  user: { id: string; email: string; username: string };
}

export async function register(payload: { username: string; email: string; password: string }) {
  const response = await client.post('/auth/register', payload);
  return response.data as { success: boolean } & AuthResponse;
}

export async function login(payload: { email: string; password: string }) {
  const response = await client.post('/auth/login', payload);
  return response.data as { success: boolean } & AuthResponse;
}
