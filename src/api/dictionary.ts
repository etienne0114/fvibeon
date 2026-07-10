import client from './client';

export interface DictionaryDefinition {
  word: string;
  phonetic?: string;
  pronunciation?: string;
  meanings?: Array<{
    partOfSpeech?: string;
    definitions?: Array<{
      definition?: string;
      example?: string;
      synonyms?: string[];
      antonyms?: string[];
    }>;
    synonyms?: string[];
    antonyms?: string[];
  }>;
  examples?: string[];
  synonyms?: string[];
  antonyms?: string[];
  source?: string;
}

export async function fetchWordDefinition(word: string, language = 'en') {
  const response = await client.get(`/learn/dictionary/word/${encodeURIComponent(word)}`, {
    params: { language },
  });
  return response.data.data as DictionaryDefinition;
}

export async function searchVocabulary(query: string, language = 'en', limit = 8) {
  const response = await client.get('/learn/dictionary/search', {
    params: { query, language, limit },
  });
  return response.data.data as DictionaryDefinition[];
}

export async function fetchDailyVocabulary(params: {
  targetLanguage?: string;
  nativeLanguage?: string;
  limit?: number;
}) {
  const response = await client.post('/learn/dictionary/daily-vocabulary', params);
  return response.data.data;
}

export async function fetchVocabularyRecommendations(params: { targetLanguage?: string; limit?: number }) {
  const response = await client.get('/learn/dictionary/recommendations', { params });
  return response.data.data;
}

export async function translateDictionaryText(payload: {
  text: string;
  targetLanguage: string;
  sourceLanguage?: string;
  includeConfidence?: boolean;
  includeAlternatives?: boolean;
}) {
  const response = await client.get('/learn/dictionary/translate', {
    params: {
      text: payload.text,
      targetLanguage: payload.targetLanguage,
      fromLang: payload.sourceLanguage,
      includeConfidence: String(payload.includeConfidence ?? true),
      includeAlternatives: String(payload.includeAlternatives ?? false),
    },
  });
  return response.data.data;
}

export async function translateDictionaryEntry(entry: DictionaryDefinition, targetLanguage: string) {
  const response = await client.post('/learn/dictionary/translate-entry', {
    entry,
    targetLanguage,
  });
  return response.data.data as DictionaryDefinition;
}
