import { useCallback, useEffect, useState } from 'react';
import { fetchDashboard } from '../api/learn';

export interface DashboardSummary {
  enrolledCourses: number;
  completedCourses: number;
  activeCourses: number;
  streakDays: number;
  totalTimeMinutes: number;
  lessonsCompleted: number;
}

export interface DashboardCourse {
  id: string;
  title: string;
  progress: number;
  isCompleted: boolean;
  imageUrl?: string | null;
  category?: string;
  level?: string;
  lessonCount?: number;
}

export interface ContinueLearning {
  courseId: string;
  courseTitle: string;
  level?: string;
  progress: number;
  totalLessons: number;
  completedLessons: number;
  nextLesson: { id: string; title: string; order: number; duration: number; type: string } | null;
}

export interface WeeklyActivityDay {
  date: string;
  minutes: number;
  lessons: number;
}

export interface AchievementItem {
  id: string;
  title: string;
  description?: string | null;
  type: string;
  xpReward: number;
  unlockedAt: string;
}

export interface DashboardPayload {
  summary: DashboardSummary;
  recentCourses: DashboardCourse[];
  continueLearning: ContinueLearning | null;
  weeklyActivity: WeeklyActivityDay[];
  achievements: AchievementItem[];
  learningGoals: { goals: unknown[]; timeframe: string };
  generatedAt: string;
}

export interface UseDashboardOptions {
  enabled?: boolean;
}

// Module-level cache: switching sections or remounting shows the last data
// instantly while a background refresh runs (stale-while-revalidate).
let dashboardCache: DashboardPayload | null = null;

export function useDashboard(options: UseDashboardOptions = {}) {
  const { enabled = true } = options;
  const [data, setData] = useState<DashboardPayload | null>(dashboardCache);
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
      if (payload) {
        dashboardCache = payload;
        setData(payload);
      }
      setError(null);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to load dashboard');
    } finally {
      setIsLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    load();
  }, [load]);

  return {
    data,
    summary: data?.summary ?? null,
    generatedAt: data?.generatedAt,
    isLoading,
    error,
    refetch: load,
  };
}
