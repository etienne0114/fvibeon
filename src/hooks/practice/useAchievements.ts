import { useCallback, useEffect, useState } from 'react';
import { fetchAchievements, AchievementPayload } from '../../api/practice';

export function useAchievements() {
  const [data, setData] = useState<AchievementPayload | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const payload = await fetchAchievements();
      setData(payload);
    } catch (err: any) {
      setError(err?.message || 'Unable to load achievements');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { data, isLoading, error, refresh };
}
