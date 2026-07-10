import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  fetchTranslatorLanguages,
  checkTranslatorHealth,
  translateText,
  translateImage,
  translateDocument,
  synthesizeSpeech,
  transcribeAudio,
} from '../api/translator';
import type {
  TranslatorTranslation,
  TranslatorImageTranslation,
  TranslatorDocumentTranslation,
  TTSParams,
  STTParams,
} from '../api/translator';

export type LanguageOption = { code: string; name: string };

interface RawLanguageResponse {
  code?: string;
  id?: string;
  language?: string;
  name?: string;
  language_name?: string;
}

export function useTranslator() {
  const [inputValue, setInputValue] = useState('');
  const [translation, setTranslation] = useState<TranslatorTranslation | null>(null);
  const [imageTranslation, setImageTranslation] = useState<TranslatorImageTranslation | null>(null);
  const [documentTranslation, setDocumentTranslation] = useState<TranslatorDocumentTranslation | null>(null);
  const [languages, setLanguages] = useState<LanguageOption[]>([{ code: 'auto', name: 'Auto detect' }]);
  const [sourceLanguage, setSourceLanguage] = useState('auto');
  const [targetLanguage, setTargetLanguage] = useState('en');
  const [isLoadingLanguages, setIsLoadingLanguages] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [isTranslatingImage, setIsTranslatingImage] = useState(false);
  const [isTranslatingDocument, setIsTranslatingDocument] = useState(false);
  const [health, setHealth] = useState<Record<string, any> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<Array<{ id: string; text: string; translation: string; timestamp: string }>>([]);
  const [historyVisible, setHistoryVisible] = useState(true);

  const loadLanguages = useCallback(async () => {
    setIsLoadingLanguages(true);
    try {
      const payload = await fetchTranslatorLanguages();
      const normalized = (payload.languages || []).map((language: RawLanguageResponse) => ({
        code: language.code || language.language || language.id || 'unknown',
        name: language.name || language.language_name || language.language || language.code || 'Unknown',
      }));
      setLanguages([{ code: 'auto', name: 'Auto detect' }, ...normalized]);
    } catch (err: any) {
      setError(err?.message || 'Unable to load languages');
    } finally {
      setIsLoadingLanguages(false);
    }
  }, []);

  const loadHealth = useCallback(async () => {
    try {
      const payload = await checkTranslatorHealth();
      setHealth(payload);
    } catch (err: any) {
      setHealth({ isHealthy: false, error: err?.message || 'Health check failed' });
    }
  }, []);

  useEffect(() => {
    loadLanguages();
    loadHealth();
  }, [loadLanguages, loadHealth]);

  const translate = useCallback(async () => {
    if (!inputValue.trim()) {
      setError('Start typing to translate.');
      return;
    }
    if (targetLanguage === 'auto') {
      setError('Select a target language.');
      return;
    }
    setError(null);
    setIsTranslating(true);
    try {
      const payload = await translateText({
        text: inputValue.trim(),
        targetLanguage,
        sourceLanguage,
        includeConfidence: true,
        includeAlternatives: true,
      });
      setTranslation(payload);
      const entry = {
        id: `${Date.now()}-${Math.random()}`,
        text: inputValue.trim(),
        translation: payload.translatedText,
        timestamp: new Date().toLocaleTimeString(),
      };
      setHistory((prev) => [entry, ...prev].slice(0, 6));
    } catch (err: any) {
      setError(err?.message || 'Translation failed');
    } finally {
      setIsTranslating(false);
    }
  }, [inputValue, sourceLanguage, targetLanguage]);

  const translateRealtime = useCallback(async (text: string): Promise<string> => {
    if (!text.trim() || !targetLanguage || targetLanguage === 'auto') return '';
    try {
      const payload = await translateText({
        text: text.trim(),
        targetLanguage,
        sourceLanguage,
        includeConfidence: false,
        includeAlternatives: false,
      });
      return payload.translatedText || '';
    } catch {
      return '';
    }
  }, [sourceLanguage, targetLanguage]);

  const translateFile = useCallback(async (file: File) => {
    if (!file) return;

    setError(null);
    setIsTranslatingImage(true);

    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result.split(',')[1]);
        };
        reader.onerror = error => reject(error);
      });

      const payload = await translateImage({
        imageBase64: base64,
        mimeType: file.type,
        targetLanguage,
        sourceLanguage,
        enhanceImage: true,
        annotateImage: true,
      });

      setImageTranslation(payload);
    } catch (err: any) {
      setError(err?.message || 'Image translation failed');
    } finally {
      setIsTranslatingImage(false);
    }
  }, [sourceLanguage, targetLanguage]);

  const translateDoc = useCallback(async (file: File) => {
    if (!file) return;

    setError(null);
    setIsTranslatingDocument(true);

    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result.split(',')[1]);
        };
        reader.onerror = error => reject(error);
      });

      const payload = await translateDocument({
        documentBase64: base64,
        mimeType: file.type,
        fileName: file.name,
        targetLanguage,
        sourceLanguage,
        preserveFormat: true,
      });

      setDocumentTranslation(payload);
    } catch (err: any) {
      setError(err?.message || 'Document translation failed');
    } finally {
      setIsTranslatingDocument(false);
    }
  }, [sourceLanguage, targetLanguage]);

  /**
   * Speak text using backend TTS (vibeon_translator) with Web Speech Synthesis fallback.
   * Returns the audio element if backend TTS succeeded, null otherwise.
   */
  const speakText = useCallback(async (text: string, language: string, quality: TTSParams['quality'] = 'medium') => {
    if (!text.trim()) return null;
    try {
      const result = await synthesizeSpeech({ text: text.trim(), language, quality });
      if (result?.audioBase64) {
        const mimeType = result.audioFormat === 'mp3' ? 'audio/mpeg' : `audio/${result.audioFormat || 'wav'}`;
        const blob = new Blob(
          [Uint8Array.from(atob(result.audioBase64), (c) => c.charCodeAt(0))],
          { type: mimeType },
        );
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        audio.onended = () => URL.revokeObjectURL(url);
        audio.play().catch(() => {
          // Browser autoplay blocked — fall through to Web Speech
          URL.revokeObjectURL(url);
          _browserSpeak(text, language);
        });
        return audio;
      }
    } catch {
      // Backend unavailable — fallback silently
    }
    _browserSpeak(text, language);
    return null;
  }, []);

  /** Web Speech Synthesis fallback */
  const _browserSpeak = (text: string, language: string) => {
    try {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = language;
      window.speechSynthesis.speak(u);
    } catch { /* ignore */ }
  };

  /**
   * Transcribe audio blob using backend STT (vibeon_translator).
   * Used for Kinyarwanda and Firefox fallback where Web Speech API is unavailable.
   */
  const transcribeBlob = useCallback(async (blob: Blob, language: string): Promise<string> => {
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = reject;
      });
      const result = await transcribeAudio({
        audioBase64: base64,
        mimeType: blob.type || 'audio/wav',
        language,
        quality: 'medium',
      });
      return result?.text || '';
    } catch {
      return '';
    }
  }, []);

  const swapLanguages = useCallback(() => {
    if (sourceLanguage === 'auto') return;
    setSourceLanguage(targetLanguage);
    setTargetLanguage(sourceLanguage);
  }, [sourceLanguage, targetLanguage]);

  const toggleHistory = useCallback(() => {
    setHistoryVisible((prev) => !prev);
  }, []);

  return {
    inputValue,
    setInputValue,
    translation,
    imageTranslation,
    documentTranslation,
    languages,
    sourceLanguage,
    targetLanguage,
    setSourceLanguage,
    setTargetLanguage,
    isLoadingLanguages,
    isTranslating,
    isTranslatingImage,
    isTranslatingDocument,
    health,
    error,
    translate,
    translateRealtime,
    translateFile,
    translateDoc,
    swapLanguages,
    speakText,
    transcribeBlob,
    history,
    historyVisible,
    toggleHistory,
    setImageTranslation,
    setDocumentTranslation,
  };
}
