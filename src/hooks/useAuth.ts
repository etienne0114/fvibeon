import { useCallback, useEffect, useState } from 'react';
import { register, login, verifyEmail, resendCode, googleLogin } from '../api/auth';
import { setAuthToken } from '../api/client';

const TOKEN_KEY = 'learn_auth_token';

export type AuthMode = 'login' | 'register';

export interface PendingVerification {
  email: string;
  message: string;
}

const extractError = (err: any) =>
  err?.response?.data?.error || err?.message || 'Authentication failed';

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
  const [pendingVerification, setPendingVerification] = useState<PendingVerification | null>(null);

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
        setError(null);
        if (mode === 'register') {
          const response = await register(payload as { username: string; email: string; password: string });
          setPendingVerification({ email: response.email, message: response.message });
          return;
        }
        const response = await login(payload);
        setToken(response.token);
        setPendingVerification(null);
      } catch (err: any) {
        if (err?.response?.data?.requiresVerification) {
          // Unverified account: backend just emailed a fresh code
          setPendingVerification({ email: payload.email, message: extractError(err) });
          return;
        }
        setError(extractError(err));
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const verify = useCallback(async (email: string, code: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await verifyEmail({ email, code });
      setToken(response.token);
      setPendingVerification(null);
    } catch (err: any) {
      setError(extractError(err));
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const resend = useCallback(async (email: string) => {
    try {
      setError(null);
      const response = await resendCode({ email });
      setPendingVerification((prev) => (prev ? { ...prev, message: response.message } : prev));
    } catch (err: any) {
      setError(extractError(err));
    }
  }, []);

  const loginWithGoogle = useCallback(async (credential: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await googleLogin(credential);
      setToken(response.token);
      setPendingVerification(null);
    } catch (err: any) {
      setError(extractError(err));
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const cancelVerification = useCallback(() => {
    setPendingVerification(null);
    setError(null);
  }, []);

  const logout = useCallback(() => {
    setToken(null);
  }, []);

  return {
    token,
    isLoading,
    error,
    pendingVerification,
    authenticate,
    verify,
    resend,
    cancelVerification,
    loginWithGoogle,
    logout,
  };
}
