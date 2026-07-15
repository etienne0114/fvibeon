import { useCallback, useEffect, useState } from 'react';
import { fetchMe } from '../api/learn';

export interface MeUser {
  id: string;
  username: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  preferredLanguage?: string | null;
  learningLanguage?: string | null;
  proficiencyLevel?: string | null;
  dailyGoalMinutes?: number | null;
  isPremium?: boolean;
  emailVerified?: boolean;
  createdAt?: string;
}

export function useMe(enabled = true) {
  const [user, setUser] = useState<MeUser | null>(null);

  const refetch = useCallback(async () => {
    const response = await fetchMe().catch(() => undefined);
    if (response?.user) setUser(response.user);
    return response?.user as MeUser | undefined;
  }, []);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    fetchMe()
      .then((response) => {
        if (!cancelled && response?.user) setUser(response.user);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [enabled]);

  return { user, refetchUser: refetch };
}
