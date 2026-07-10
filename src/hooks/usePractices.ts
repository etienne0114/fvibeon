import { useCallback, useEffect, useState } from 'react';
import { fetchPracticeModules, PracticeModule, startPracticeSession } from '../api/practices';

export function usePractices() {
  const [modules, setModules] = useState<PracticeModule[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [activeModule, setActiveModule] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadPractices = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const payload = await fetchPracticeModules();
      setModules(payload.modules);
    } catch (err: any) {
      setError(err?.message || 'Unable to load practice modules');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPractices();
  }, [loadPractices]);

  const startPractice = useCallback(
    async (moduleId: string) => {
      setIsStarting(true);
      setActiveModule(moduleId);
      setMessage(null);
      setError(null);
      try {
        const response = await startPracticeSession(moduleId);
        setMessage(`Practice session started for ${response.moduleId}`);
        await loadPractices();
      } catch (err: any) {
        setError(err?.message || 'Failed to start practice session');
      } finally {
        setIsStarting(false);
      }
    },
    [loadPractices],
  );

  return {
    modules,
    isLoading,
    isStarting,
    activeModule,
    message,
    error,
    startPractice,
    reload: loadPractices,
  };
}
