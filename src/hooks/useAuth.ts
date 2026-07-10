import { useCallback, useEffect, useState } from 'react';
import { register, login, googleLogin } from '../api/auth';
import { setAuthToken } from '../api/client';

const extractError = (err: any) =>
  err?.response?.data?.error || err?.message || 'Authentication failed';

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
        setError(extractError(err));
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const loginWithGoogle = useCallback(async (credential: string) => {
    try {
      setIsLoading(true);
      const response = await googleLogin(credential);
      setToken(response.token);
      setError(null);
    } catch (err: any) {
      setError(extractError(err));
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    setToken(null);
  }, []);

  return { token, isLoading, error, authenticate, loginWithGoogle, logout };
}
