import { useState, useCallback, useRef } from 'react';
import { synthesizeSpeech } from '../api/translator';

/**
 * useTTS Hook
 * Provides Text-to-Speech capabilities by leveraging the backend synthesizer.
 */
export function useTTS() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  }, []);

  const speak = useCallback(async (text: string, language: string = 'en') => {
    if (!text || !text.trim()) return;
    
    // Stop any currently playing audio
    stop();

    setIsLoading(true);
    try {
      const result = await synthesizeSpeech({ 
        text: text.trim(), 
        language, 
        quality: 'medium' 
      });

      if (result?.audioBase64) {
        const mimeType = result.audioFormat === 'mp3' ? 'audio/mpeg' : `audio/${result.audioFormat || 'wav'}`;
        const blob = new Blob(
          [Uint8Array.from(atob(result.audioBase64), (c) => c.charCodeAt(0))],
          { type: mimeType }
        );
        
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        audioRef.current = audio;

        audio.onplay = () => setIsPlaying(true);
        audio.onended = () => {
          setIsPlaying(false);
          URL.revokeObjectURL(url);
        };
        audio.onerror = () => {
          setIsPlaying(false);
          URL.revokeObjectURL(url);
        };

        await audio.play();
      } else {
        // Fallback to browser SpeechSynthesis if backend fails or returns no audio
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = language;
        utterance.onstart = () => setIsPlaying(true);
        utterance.onend = () => setIsPlaying(false);
        window.speechSynthesis.speak(utterance);
      }
    } catch (err) {
      console.error('TTS synthesis failed, falling back to browser:', err);
      // Browser fallback
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = language;
      utterance.onstart = () => setIsPlaying(true);
      utterance.onend = () => setIsPlaying(false);
      window.speechSynthesis.speak(utterance);
    } finally {
      setIsLoading(false);
    }
  }, [stop]);

  return { speak, stop, isPlaying, isLoading };
}
