import { useCallback, useEffect, useState } from 'react';
import { fetchDashboard } from '../api/learn';

export interface DashboardSummary {
  enrolledCourses: number;
  completedCourses: number;
  activeCourses: number;
}

export interface DashboardPayload {
  summary: DashboardSummary;
  recentCourses: Array<Record<string, unknown>>;
  courseRecommendations: Array<Record<string, unknown>>;
  generatedAt: string;
}

export interface UseDashboardOptions {
  enabled?: boolean;
}

export function useDashboard(options: UseDashboardOptions = {}) {
  const { enabled = true } = options;
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [generatedAt, setGeneratedAt] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!enabled) {
      return;
    }
    try {
      setIsLoading(true);
      const response = await fetchDashboard();
      const payload: DashboardPayload | null = response?.data ?? null;
      if (payload && payload.summary) {
        setSummary(payload.summary);
        setGeneratedAt(payload.generatedAt);
      }
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard');
    } finally {
      setIsLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    load();
  }, [load]);

  return { summary, generatedAt, isLoading, error, refetch: load };
}
