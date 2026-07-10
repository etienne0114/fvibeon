import { useCallback, useEffect, useState } from 'react';
import {
  fetchDailyVocabulary,
  fetchVocabularyQueue,
  fetchVocabularyStats,
  markVocabularyResult,
  VocabularyEntry,
  VocabularyStats,
} from '../../api/practice';

export function useVocabularyDrill() {
  const [dailyEntry, setDailyEntry] = useState<VocabularyEntry | null>(null);
  const [queue, setQueue] = useState<VocabularyEntry[]>([]);
  const [stats, setStats] = useState<VocabularyStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [language, setLanguage] = useState('en');

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [entry, spaced, vocabStats] = await Promise.all([
        fetchDailyVocabulary(language),
        fetchVocabularyQueue(language),
        fetchVocabularyStats(),
      ]);
      setDailyEntry(entry);
      setQueue(spaced);
      setStats(vocabStats);
    } catch (err: any) {
      setError(err?.message || 'Unable to load vocabulary drills');
    } finally {
      setIsLoading(false);
    }
  }, [language]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const submitResult = useCallback(
    async (vocabularyItemId: string, correct: boolean) => {
      setIsSubmitting(true);
      setError(null);
      try {
        const updated = await markVocabularyResult(vocabularyItemId, correct);
        setStats((prev) => (prev ? { ...prev, accuracy: prev.accuracy } : prev));
        setDailyEntry((prev) =>
          prev && prev.vocabularyItemId === vocabularyItemId
            ? { ...prev, masteryLevel: updated.masteryLevel, streak: updated.streak, nextReviewAt: updated.nextReviewAt }
            : prev,
        );
        await refresh();
      } catch (err: any) {
        setError(err?.message || 'Result submission failed');
      } finally {
        setIsSubmitting(false);
      }
    },
    [refresh],
  );

  return {
    dailyEntry,
    queue,
    stats,
    isLoading,
    isSubmitting,
    error,
    refresh,
    submitResult,
    language,
    setLanguage,
  };
}
