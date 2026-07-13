import { useCallback, useEffect, useRef, useState } from 'react';

// Same approach as the real-time translator pane: the browser's native Web
// Speech API transcribes locally with no network round-trip, so it's far
// faster than recording a blob and uploading it to a server-side STT model.
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}

const BCP47: Record<string, string> = { en: 'en-US', fr: 'fr-FR', rw: 'rw-RW' };
const toBCP47 = (code: string) => BCP47[code?.toLowerCase()] || 'en-US';

const getRecognitionCtor = () =>
  typeof window !== 'undefined' ? window.SpeechRecognition || window.webkitSpeechRecognition : undefined;

export function useSpeechRecognition(language: string) {
  const supported = Boolean(getRecognitionCtor());
  const [isListening, setIsListening] = useState(false);
  const [interimText, setInterimText] = useState('');
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const onFinalRef = useRef<((text: string) => void) | null>(null);

  useEffect(() => () => recognitionRef.current?.stop(), []);

  const start = useCallback(
    (onFinal: (text: string) => void) => {
      const Ctor = getRecognitionCtor();
      if (!Ctor) return;
      onFinalRef.current = onFinal;

      const recognition = new Ctor();
      recognition.lang = toBCP47(language);
      recognition.interimResults = true;
      recognition.continuous = false;
      recognition.maxAlternatives = 1;

      let finalTranscript = '';
      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let interim = '';
        for (let i = event.resultIndex; i < event.results.length; i += 1) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) finalTranscript += transcript;
          else interim += transcript;
        }
        setInterimText(finalTranscript + interim);
      };
      recognition.onerror = () => {
        setIsListening(false);
      };
      recognition.onend = () => {
        setIsListening(false);
        setInterimText('');
        if (finalTranscript.trim()) onFinalRef.current?.(finalTranscript.trim());
      };

      recognitionRef.current = recognition;
      setInterimText('');
      setIsListening(true);
      recognition.start();
    },
    [language],
  );

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
  }, []);

  return { supported, isListening, interimText, start, stop };
}
