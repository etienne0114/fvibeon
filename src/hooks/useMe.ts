import { useEffect, useState } from 'react';
import { fetchMe } from '../api/learn';

export interface MeUser {
  id: string;
  username: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  learningLanguage?: string | null;
}

export function useMe(enabled = true) {
  const [user, setUser] = useState<MeUser | null>(null);

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

  return user;
}
