import { useCallback, useEffect, useState } from 'react';
import {
  generateQuiz,
  submitQuizAnswer,
  fetchQuizHistory,
  QuizAnswer,
  QuizHistoryItem,
  QuizPayload,
  QuizResult,
} from '../../api/practice';

export function useQuizDrill() {
  const [currentQuiz, setCurrentQuiz] = useState<QuizPayload | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [history, setHistory] = useState<QuizHistoryItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  const loadHistory = useCallback(async () => {
    try {
      const items = await fetchQuizHistory();
      setHistory(items);
    } catch (err: any) {
      setError(err?.message || 'Unable to load quiz history');
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const createQuiz = useCallback(
    async (topic: string, language?: string, count?: number) => {
      setIsGenerating(true);
      setError(null);
      setResult(null);
      setAnswers({});
      try {
        const quiz = await generateQuiz(topic, language, count);
        setCurrentQuiz(quiz);
      } catch (err: any) {
        setError(err?.message || 'Quiz generation failed');
      } finally {
        setIsGenerating(false);
      }
    },
    [],
  );

  const updateAnswer = useCallback((questionId: string, selected: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: selected }));
  }, []);

  const submit = useCallback(
    async (quizId: string) => {
      setIsSubmitting(true);
      setError(null);
      try {
        const payload: QuizAnswer[] = Object.entries(answers).map(([questionId, selectedAnswer]) => ({
          questionId,
          selectedAnswer,
        }));
        const scored = await submitQuizAnswer(quizId, payload);
        setResult(scored);
        await loadHistory();
      } catch (err: any) {
        setError(err?.message || 'Quiz submission failed');
      } finally {
        setIsSubmitting(false);
      }
    },
    [answers, loadHistory],
  );

  const reset = useCallback(() => {
    setCurrentQuiz(null);
    setAnswers({});
    setResult(null);
    setError(null);
  }, []);

  return {
    currentQuiz,
    answers,
    result,
    history,
    isGenerating,
    isSubmitting,
    error,
    createQuiz,
    updateAnswer,
    submit,
    reset,
    refreshHistory: loadHistory,
  };
}
