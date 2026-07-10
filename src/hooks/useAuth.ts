import { useCallback, useEffect, useState } from 'react';
import { register, login } from '../api/auth';
import { setAuthToken } from '../api/client';

const TOKEN_KEY = 'learn_auth_token';

export type AuthMode = 'login' | 'register';

export function useAuth() {
  const getInitialToken = () => {
    if (typeof window === 'undefined') {
      return null;
    }
    return localStorage.getItem(TOKEN_KEY);
  };
  const [token, setToken] = useState<string | null>(getInitialToken);
  setAuthToken(token);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
      return;
    }
    localStorage.removeItem(TOKEN_KEY);
  }, [token]);

  const authenticate = useCallback(
    async (payload: { email: string; password: string; username?: string }, mode: AuthMode) => {
      try {
        setIsLoading(true);
        const response = mode === 'register' ? await register(payload as any) : await login(payload as any);
        setToken(response.token);
        setError(null);
      } catch (err: any) {
        setError(err?.message || 'Authentication failed');
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const logout = useCallback(() => {
    setToken(null);
  }, []);

  return { token, isLoading, error, authenticate, logout };
}
