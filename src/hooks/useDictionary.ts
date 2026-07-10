import { useCallback, useState } from 'react';
import { fetchWordDefinition, DictionaryDefinition, translateDictionaryEntry } from '../api/dictionary';

export function useDictionary() {
  const [query, setQuery] = useState('');
  const [definition, setDefinition] = useState<DictionaryDefinition | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [visible, setVisible] = useState(true);

  const lookup = useCallback(async (word: string, language = 'en') => {
    if (!word.trim()) {
      setDefinition(null);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchWordDefinition(word, language);
      setDefinition(data);
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || 'Definition not available');
      setDefinition(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const translateEntry = useCallback(async (entry: DictionaryDefinition, targetLanguage: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const trans = await translateDictionaryEntry(entry, targetLanguage);
      return trans;
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || 'Translation failed');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const toggle = useCallback(() => setVisible((prev) => !prev), []);

  return {
    query,
    setQuery,
    definition,
    isLoading,
    error,
    lookup,
    translateEntry,
    visible,
    toggle,
  };
}
