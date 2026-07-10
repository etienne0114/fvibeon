import { useCallback, useEffect, useState } from 'react';
import { fetchAnalytics } from '../api/analytics';

export function useAnalytics() {
  const [data, setData] = useState<{ completedCourses: number; averageProgress: number; mostRecentCourse: { id: string; title: string } | null } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const payload = await fetchAnalytics();
      setData(payload);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load analytics');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { data, isLoading, error, refetch: load };
}
