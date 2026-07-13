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

      // Even with continuous=false, a natural pause mid-sentence can split
      // recognition into multiple "final" segments in one session — joining
      // them with `+=` (no separator) is what produced runs like "andYeah".
      // Collecting each trimmed segment and `.join(' ')`-ing them keeps
      // spacing correct regardless of how the browser chunks it.
      const finalSegments: string[] = [];
      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let interim = '';
        for (let i = event.resultIndex; i < event.results.length; i += 1) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) finalSegments.push(transcript.trim());
          else interim += transcript;
        }
        setInterimText([...finalSegments, interim].filter(Boolean).join(' '));
      };
      recognition.onerror = () => {
        setIsListening(false);
      };
      recognition.onend = () => {
        setIsListening(false);
        setInterimText('');
        const finalTranscript = finalSegments.join(' ').trim();
        if (finalTranscript) onFinalRef.current?.(finalTranscript);
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
