import client from './client';

interface TranslateParams {
  text: string;
  targetLanguage: string;
  sourceLanguage?: string;
  includeConfidence?: boolean;
  includeAlternatives?: boolean;
}

export interface TranslatorTranslation {
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
  confidence: number;
  model?: string;
  alternatives?: string[];
  detectedLanguage?: {
    language: string;
    confidence: number;
    isReliable: boolean;
  };
  processingTime?: number;
  cached?: boolean;
  raw?: any;
}

export interface TranslatorImageTranslation {
  originalText: string;
  translatedText: string;
  detectedLanguage: string;
  targetLanguage: string;
  ocrConfidence: number;
  translationConfidence: number;
  annotatedImage?: string;
  processingTime?: number;
  raw?: any;
}

export interface TranslatorDocumentTranslation {
  originalText: string;
  translatedText: string;
  detectedLanguage: string;
  targetLanguage: string;
  confidence: number;
  qualityScore?: number;
  model?: string;
  pages?: number;
  processingTime?: number;
  metadata?: Record<string, any>;
  raw?: any;
}

interface TranslateImageParams {
  imageBase64: string;
  mimeType: string;
  targetLanguage: string;
  sourceLanguage?: string;
  enhanceImage?: boolean;
  annotateImage?: boolean;
}

interface TranslateDocumentParams {
  documentBase64: string;
  mimeType: string;
  fileName: string;
  targetLanguage: string;
  sourceLanguage?: string;
  preserveFormat?: boolean;
}

export async function translateText(params: TranslateParams) {
  const payload = {
    text: params.text,
    targetLanguage: params.targetLanguage,
    sourceLanguage: params.sourceLanguage,
    includeConfidence: params.includeConfidence ?? true,
    includeAlternatives: params.includeAlternatives ?? false,
  };
  const response = await client.post('/translation/translate', payload);
  return response.data.data as TranslatorTranslation;
}

export async function translateImage(params: TranslateImageParams) {
  const response = await client.post('/translation/image', params);
  return response.data.data as TranslatorImageTranslation;
}

export async function translateDocument(params: TranslateDocumentParams) {
  const response = await client.post('/translation/document', params);
  return response.data.data as TranslatorDocumentTranslation;
}

export async function detectLanguage(text: string) {
  const response = await client.post('/translation/detect', { text });
  return response.data.data;
}

export async function fetchTranslatorLanguages() {
  const response = await client.get('/translation/languages');
  return response.data.data;
}

export async function checkTranslatorHealth() {
  const response = await client.get('/translation/health');
  return response.data.data;
}

// ── TTS ──────────────────────────────────────────────────────────────────────

export interface TTSResult {
  audioBase64: string;
  audioFormat: string;
  duration: number;
  engineUsed: string;
  language: string;
  processingTime: number;
}

export interface TTSParams {
  text: string;
  language: string;
  quality?: 'low' | 'medium' | 'high' | 'premium';
  speed?: number;
  pitch?: number;
  volume?: number;
  voiceId?: string;
}

export async function synthesizeSpeech(params: TTSParams): Promise<TTSResult> {
  const response = await client.post('/translation/tts', params);
  return response.data.data as TTSResult;
}

// ── STT ──────────────────────────────────────────────────────────────────────

export interface STTResult {
  text: string;
  confidence: number;
  language: string;
  engineUsed: string;
  processingTime: number;
  alternatives?: string[];
}

export interface STTParams {
  audioBase64: string;
  mimeType?: string;
  language?: string;
  quality?: 'low' | 'medium' | 'high' | 'premium';
}

export async function transcribeAudio(params: STTParams): Promise<STTResult> {
  const response = await client.post('/translation/stt', params);
  return response.data.data as STTResult;
}
