import { useCallback, useEffect, useState } from 'react';
import {
  register,
  registerStart,
  registerCheckCode,
  registerComplete,
  updateProfile,
  login,
  verifyEmail,
  resendCode,
  googleLogin,
  forgotPassword,
  verifyResetCode,
  resetPassword,
  type ProfilePayload,
} from '../api/auth';
import { setAuthToken } from '../api/client';

const TOKEN_KEY = 'learn_auth_token';

export type AuthMode = 'login' | 'register';

export interface PendingVerification {
  email: string;
  message: string;
}

// Only surface messages our API deliberately wrote — never axios/status internals
const extractError = (err: any) => {
  const message = err?.response?.data?.error;
  if (typeof message === 'string' && message.trim()) {
    return message;
  }
  return 'Something went wrong. Please check your connection and try again.';
};

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

  // --- Staged sign-up: identity → code → password → optional profile ---
  const startRegistration = useCallback(
    async (payload: { username: string; email: string; firstName?: string; lastName?: string }) => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await registerStart(payload);
        return response.message;
      } catch (err: any) {
        setError(extractError(err));
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const checkRegistrationCode = useCallback(async (email: string, code: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await registerCheckCode({ email, code });
      return response.message;
    } catch (err: any) {
      setError(extractError(err));
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Returns the token WITHOUT committing it, so the onboarding profile step
  // can still render before the app switches to the authenticated shell.
  const completeRegistration = useCallback(async (email: string, code: string, password: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await registerComplete({ email, code, password });
      return response.token;
    } catch (err: any) {
      setError(extractError(err));
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const saveProfile = useCallback(async (payload: ProfilePayload, pendingToken: string) => {
    try {
      setIsLoading(true);
      setError(null);
      await updateProfile(payload, pendingToken);
    } catch (err: any) {
      setError(extractError(err));
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const finishRegistration = useCallback((pendingToken: string) => {
    setToken(pendingToken);
    setPendingVerification(null);
    setError(null);
  }, []);

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

  const requestReset = useCallback(async (email: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await forgotPassword({ email });
      return response.message;
    } catch (err: any) {
      setError(extractError(err));
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const checkResetCode = useCallback(async (email: string, code: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await verifyResetCode({ email, code });
      return response.message;
    } catch (err: any) {
      setError(extractError(err));
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const completeReset = useCallback(async (email: string, code: string, newPassword: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await resetPassword({ email, code, newPassword });
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
    startRegistration,
    checkRegistrationCode,
    completeRegistration,
    saveProfile,
    finishRegistration,
    verify,
    resend,
    requestReset,
    checkResetCode,
    completeReset,
    cancelVerification,
    loginWithGoogle,
    logout,
  };
}
