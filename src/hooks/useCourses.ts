import { useCallback, useEffect, useState } from 'react';
import { enrollCourse, fetchCourses } from '../api/learn';

export type Course = {
  id: string;
  title: string;
  description: string;
  level: string;
  _count?: { enrollments: number };
  estimatedDuration?: number;
};

export interface UseCoursesOptions {
  enabled?: boolean;
  page?: number;
  limit?: number;
  level?: string;
  search?: string;
}

export interface UseCoursesResult {
  courses: Course[];
  isLoading: boolean;
  error: string | null;
  onEnroll: (courseId: string) => Promise<void>;
  refetch: () => Promise<void>;
}

export function useCourses(options: UseCoursesOptions = {}): UseCoursesResult {
  const { enabled = true, page = 1, limit = 6, level, search } = options;
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!enabled) {
      return;
    }
    try {
      setIsLoading(true);
      const payload: Record<string, string | number> = { page, limit };
      if (level) {
        payload.level = level;
      }
      if (search) {
        payload.search = search;
      }
      const data = await fetchCourses(payload);
      setCourses(data.courses || []);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load courses');
    } finally {
      setIsLoading(false);
    }
  }, [enabled, page, limit, level, search]);

  const onEnroll = useCallback(
    async (courseId: string) => {
      if (!enabled) {
        return;
      }
      try {
        await enrollCourse(courseId);
        load();
      } catch (err) {
        throw err;
      }
    },
    [enabled, load],
  );

  useEffect(() => {
    load();
  }, [load]);

  return { courses, isLoading, error, onEnroll, refetch: load };
}
