import { keyframes } from '@emotion/react';
import {
  Box,
  Button,
  Center,
  Circle,
  Flex,
  Grid,
  HStack,
  Icon,
  IconButton,
  Spinner,
  Tag,
  Text,
  Tooltip,
  useColorModeValue,
  VStack,
  Badge,
  Alert,
  AlertIcon,
  AlertDescription,
} from '@chakra-ui/react';
import { useEffect, useRef, useState, useCallback } from 'react';
import {
  MdMic,
  MdMicOff,
  MdStop,
  MdContentCopy,
  MdVolumeUp,
  MdFiberManualRecord,
  MdDeleteOutline,
} from 'react-icons/md';

// ---------- Types ----------
interface RealtimeTranslationPaneProps {
  onTranslate: (text: string) => Promise<string>;
  sourceLanguage: string;
  targetLanguage: string;
  /** Optional backend TTS function (falls back to Web Speech Synthesis) */
  onSpeak?: (text: string, language: string) => void;
}

// Web Speech API typings (not in lib.dom.d.ts for all TS versions)
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}

// ---------- BCP-47 language tag map ----------
const BCP47: Record<string, string> = {
  af: 'af-ZA', sq: 'sq-AL', am: 'am-ET', ar: 'ar-SA', hy: 'hy-AM',
  az: 'az-AZ', eu: 'eu-ES', be: 'be-BY', bn: 'bn-BD', bs: 'bs-BA',
  bg: 'bg-BG', ca: 'ca-ES', zh: 'zh-CN', hr: 'hr-HR', cs: 'cs-CZ',
  da: 'da-DK', nl: 'nl-NL', en: 'en-US', et: 'et-EE', fil: 'fil-PH',
  fi: 'fi-FI', fr: 'fr-FR', gl: 'gl-ES', ka: 'ka-GE', de: 'de-DE',
  el: 'el-GR', gu: 'gu-IN', iw: 'iw-IL', hi: 'hi-IN', hu: 'hu-HU',
  is: 'is-IS', id: 'id-ID', it: 'it-IT', ja: 'ja-JP', jv: 'jv-ID',
  kn: 'kn-IN', km: 'km-KH', ko: 'ko-KR', lo: 'lo-LA', lv: 'lv-LV',
  lt: 'lt-LT', mk: 'mk-MK', ms: 'ms-MY', ml: 'ml-IN', mr: 'mr-IN',
  mn: 'mn-MN', my: 'my-MM', ne: 'ne-NP', no: 'no-NO', ps: 'ps-AF',
  fa: 'fa-IR', pl: 'pl-PL', pt: 'pt-BR', ro: 'ro-RO', ru: 'ru-RU',
  sr: 'sr-RS', si: 'si-LK', sk: 'sk-SK', sl: 'sl-SI', es: 'es-ES',
  su: 'su-ID', sw: 'sw-TZ', sv: 'sv-SE', ta: 'ta-IN', te: 'te-IN',
  th: 'th-TH', tr: 'tr-TR', uk: 'uk-UA', ur: 'ur-PK', uz: 'uz-UZ',
  vi: 'vi-VN', cy: 'cy-GB', xh: 'xh-ZA', yo: 'yo-NG', zu: 'zu-ZA',
  rw: 'rw-RW',
};

function toBCP47(code: string): string {
  if (!code || code === 'auto') return 'en-US';
  return BCP47[code.toLowerCase()] ?? code;
}

// ---------- Keyframes ----------
const pulseRing = keyframes`
  0%   { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(236,72,153,0.7); }
  70%  { transform: scale(1);    box-shadow: 0 0 0 16px rgba(236,72,153,0); }
  100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(236,72,153,0); }
`;

const TRANSLATE_DEBOUNCE_MS = 800;
const MAX_SILENCE_MS = 30000; // auto-stop if silent for 30s

// ---------- Component ----------
const RealtimeTranslationPane = ({
  onTranslate,
  sourceLanguage,
  targetLanguage,
  onSpeak,
}: RealtimeTranslationPaneProps) => {
  const [isListening, setIsListening] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [interimText, setInterimText] = useState('');
  const [finalText, setFinalText] = useState('');
  const [outputText, setOutputText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [supported, setSupported] = useState(true);
  const [wordCount, setWordCount] = useState(0);
  // Language detected by the Web Speech API (BCP-47 tag from browser)
  const [detectedLang, setDetectedLang] = useState<string | null>(null);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const shouldListenRef = useRef(false);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTranslatedRef = useRef('');
  const silenceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const bgColor = useColorModeValue('white', 'gray.900');
  const readOnlyBg = useColorModeValue('gray.50', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const textColor = useColorModeValue('gray.800', 'white');
  const interimColor = useColorModeValue('gray.400', 'gray.500');

  // ---------- Check support ----------
  useEffect(() => {
    const SR = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!SR) setSupported(false);
  }, []);

  // ---------- Translate helper (debounced) ----------
  const scheduleTranslation = useCallback((text: string) => {
    if (!text.trim() || !targetLanguage || targetLanguage === 'auto') return;
    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    debounceTimer.current = setTimeout(async () => {
      if (text === lastTranslatedRef.current) return;
      lastTranslatedRef.current = text;
      setIsTranslating(true);
      try {
        const result = await onTranslate(text);
        if (result) setOutputText(result);
      } finally {
        setIsTranslating(false);
      }
    }, TRANSLATE_DEBOUNCE_MS);
  }, [onTranslate, targetLanguage]);

  // ---------- Build recognition instance ----------
  const buildRecognition = useCallback(() => {
    const SR = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!SR) return null;

    const rec = new SR();
    rec.lang = toBCP47(sourceLanguage);
    rec.continuous = true;
    rec.interimResults = true;
    rec.maxAlternatives = 1;

    rec.onstart = () => {
      setIsListening(true);
      setError(null);
    };

    rec.onresult = (event: SpeechRecognitionEvent) => {
      // Capture browser-detected language if available
      const firstResult = event.results[event.resultIndex];
      if ((firstResult as any)?.lang) setDetectedLang((firstResult as any).lang);

      // Reset silence timer on every result
      if (silenceTimer.current) clearTimeout(silenceTimer.current);
      silenceTimer.current = setTimeout(() => {
        if (shouldListenRef.current) stopListening();
      }, MAX_SILENCE_MS);

      let interimBuffer = '';
      let newFinal = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          newFinal += transcript + ' ';
        } else {
          interimBuffer += transcript;
        }
      }

      if (newFinal) {
        setFinalText((prev) => {
          const updated = prev + newFinal;
          setWordCount(updated.trim().split(/\s+/).filter(Boolean).length);
          scheduleTranslation(updated.trim());
          return updated;
        });
        setInterimText('');
      } else {
        setInterimText(interimBuffer);
        // Also schedule translation on interim (with longer debounce)
        setFinalText((prev) => {
          scheduleTranslation((prev + interimBuffer).trim());
          return prev;
        });
      }
    };

    rec.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error === 'no-speech') return; // silent, just keep going
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        setError('Microphone access denied. Please allow microphone permissions and try again.');
        setIsListening(false);
        shouldListenRef.current = false;
        return;
      }
      if (event.error === 'network') {
        setError('Network error during speech recognition. Check your connection.');
        return;
      }
      // Other errors — log but don't stop
      console.warn('SpeechRecognition error:', event.error);
    };

    rec.onend = () => {
      setInterimText('');
      // Auto-restart if we still want to listen (continuous workaround for some browsers)
      if (shouldListenRef.current) {
        try {
          rec.start();
        } catch {
          setIsListening(false);
        }
      } else {
        setIsListening(false);
      }
    };

    return rec;
  }, [sourceLanguage, scheduleTranslation]);

  // ---------- Start ----------
  const startListening = useCallback(() => {
    setError(null);
    const rec = buildRecognition();
    if (!rec) {
      setError('Speech recognition is not supported in this browser. Use Chrome or Edge.');
      return;
    }
    recognitionRef.current = rec;
    shouldListenRef.current = true;
    try {
      rec.start();
    } catch (e: any) {
      setError(e?.message ?? 'Failed to start microphone');
    }
  }, [buildRecognition]);

  // ---------- Stop ----------
  const stopListening = useCallback(() => {
    shouldListenRef.current = false;
    if (silenceTimer.current) clearTimeout(silenceTimer.current);
    try {
      recognitionRef.current?.stop();
    } catch { /* ignore */ }
    setIsListening(false);
    setInterimText('');
  }, []);

  // ---------- Clear ----------
  const handleClear = () => {
    if (isListening) stopListening();
    setFinalText('');
    setInterimText('');
    setOutputText('');
    setWordCount(0);
    setDetectedLang(null);
    lastTranslatedRef.current = '';
  };

  // ---------- Rebuild recognition when language changes ----------
  useEffect(() => {
    if (isListening) {
      stopListening();
      // Short delay then restart with new language
      const t = setTimeout(() => startListening(), 300);
      return () => clearTimeout(t);
    }
  }, [sourceLanguage]);

  // ---------- Re-translate on target language change ----------
  useEffect(() => {
    lastTranslatedRef.current = '';
    const combined = (finalText + interimText).trim();
    if (combined) scheduleTranslation(combined);
  }, [targetLanguage]);

  // ---------- Cleanup on unmount ----------
  useEffect(() => {
    return () => {
      shouldListenRef.current = false;
      recognitionRef.current?.stop();
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      if (silenceTimer.current) clearTimeout(silenceTimer.current);
    };
  }, []);

  const speakText = useCallback((text: string, lang: string) => {
    if (!text.trim()) return;
    if (onSpeak) {
      // Use backend TTS (vibeon_translator) — best quality + Kinyarwanda support
      onSpeak(text, lang);
    } else {
      // Browser Web Speech Synthesis fallback
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = toBCP47(lang);
      window.speechSynthesis.speak(u);
    }
  }, [onSpeak]);

  const copyText = (text: string) => navigator.clipboard.writeText(text);

  const fullTranscript = (finalText + (interimText ? interimText : '')).trim();

  // ---------- Render ----------
  if (!supported) {
    return (
      <Box p={6}>
        <Alert status="warning" borderRadius="xl">
          <AlertIcon />
          <AlertDescription>
            Real-time voice translation requires Chrome or Edge browser with microphone access.
            Firefox does not support the Web Speech API.
          </AlertDescription>
        </Alert>
      </Box>
    );
  }

  return (
    <Box w="full">
      {/* Status bar */}
      <HStack px={4} py={2} spacing={3} justify="space-between">
        <HStack spacing={2}>
          <Icon
            as={MdFiberManualRecord}
            color={isListening ? 'red.500' : 'gray.400'}
            w={3}
            h={3}
            sx={isListening ? { animation: `${pulseRing} 1.5s ease-in-out infinite` } : {}}
          />
          <Text fontSize="xs" fontWeight="bold" color={isListening ? 'red.500' : 'gray.500'} textTransform="uppercase" letterSpacing="wider">
            {isListening ? 'Listening...' : isTranslating ? 'Translating...' : 'Voice Ready'}
          </Text>
          {isTranslating && <Spinner size="xs" color="learning.500" />}
        </HStack>
        <HStack spacing={2}>
          {wordCount > 0 && (
            <Tag size="sm" colorScheme="gray" variant="subtle">{wordCount} words</Tag>
          )}
          <Badge colorScheme={isListening ? 'red' : 'gray'} variant="subtle" fontSize="xs">
            {isListening ? 'LIVE' : 'IDLE'}
          </Badge>
        </HStack>
      </HStack>

      {/* Error */}
      {error && (
        <Box px={4} pb={2}>
          <Alert status="error" borderRadius="lg" py={2}>
            <AlertIcon />
            <AlertDescription fontSize="sm">{error}</AlertDescription>
          </Alert>
        </Box>
      )}

      {/* Panels */}
      <Grid templateColumns={{ base: '1fr', lg: 'repeat(2, 1fr)' }} gap={0}>
        {/* Left — Transcription */}
        <Flex
          direction="column"
          minH="280px"
          bg={bgColor}
          borderRadius="xl"
          borderWidth="1px"
          borderColor={isListening ? 'red.300' : borderColor}
          p={5}
          transition="border-color 0.3s"
          position="relative"
        >
          <HStack justify="space-between" mb={3}>
            <Text fontSize="xs" fontWeight="bold" color="gray.500" textTransform="uppercase">
              Transcription
            </Text>
            <HStack spacing={1}>
              {fullTranscript && (
                <>
                  <Tooltip label="Listen">
                    <IconButton
                      aria-label="Listen to transcript"
                      icon={<MdVolumeUp />}
                      size="xs"
                      variant="ghost"
                      onClick={() => speakText(fullTranscript, sourceLanguage)}
                      borderRadius="full"
                    />
                  </Tooltip>
                  <Tooltip label="Copy transcript">
                    <IconButton
                      aria-label="Copy transcript"
                      icon={<MdContentCopy />}
                      size="xs"
                      variant="ghost"
                      onClick={() => copyText(fullTranscript)}
                      borderRadius="full"
                    />
                  </Tooltip>
                </>
              )}
            </HStack>
          </HStack>

          <Box flex={1} overflowY="auto" minH="160px">
            {!fullTranscript && !isListening ? (
              <Text color="gray.400" fontSize="md">
                Press <b>Start</b> and speak — your words will appear here in real time.
              </Text>
            ) : (
              <Text fontSize="lg" fontWeight="medium" color={textColor} whiteSpace="pre-wrap" lineHeight="1.7">
                {finalText}
                {interimText && (
                  <Text as="span" color={interimColor} fontStyle="italic">
                    {interimText}
                  </Text>
                )}
                {isListening && !interimText && (
                  <Text as="span" color="red.400" ml={1}>
                    ▌
                  </Text>
                )}
              </Text>
            )}
          </Box>

          {fullTranscript && (
            <Text fontSize="xs" color="gray.400" pt={2}>
              {toBCP47(sourceLanguage)} · {fullTranscript.length} chars
            </Text>
          )}
        </Flex>

        {/* Right — Translation */}
        <Flex
          direction="column"
          minH="280px"
          bg={readOnlyBg}
          borderRadius="xl"
          borderWidth="1px"
          borderColor={isTranslating ? 'learning.300' : borderColor}
          p={5}
          transition="border-color 0.3s"
        >
          <HStack justify="space-between" mb={3}>
            <Text fontSize="xs" fontWeight="bold" color="gray.500" textTransform="uppercase">
              Translation
            </Text>
            <HStack spacing={1}>
              {outputText && (
                <>
                  <Tooltip label="Listen to translation">
                    <IconButton
                      aria-label="Listen to translation"
                      icon={<MdVolumeUp />}
                      size="xs"
                      variant="ghost"
                      onClick={() => speakText(outputText, targetLanguage)}
                      borderRadius="full"
                    />
                  </Tooltip>
                  <Tooltip label="Copy translation">
                    <IconButton
                      aria-label="Copy translation"
                      icon={<MdContentCopy />}
                      size="xs"
                      variant="ghost"
                      onClick={() => copyText(outputText)}
                      borderRadius="full"
                    />
                  </Tooltip>
                </>
              )}
            </HStack>
          </HStack>

          <Box flex={1} overflowY="auto" minH="160px">
            {isTranslating && !outputText ? (
              <HStack spacing={2} pt={4}>
                <Spinner size="sm" color="learning.500" />
                <Text color="gray.400" fontSize="md">Translating...</Text>
              </HStack>
            ) : (
              <Text
                fontSize="lg"
                fontWeight="medium"
                color={outputText ? textColor : 'gray.400'}
                whiteSpace="pre-wrap"
                lineHeight="1.7"
                opacity={isTranslating ? 0.5 : 1}
                transition="opacity 0.3s"
              >
                {outputText || 'Translation will appear here as you speak...'}
              </Text>
            )}
          </Box>

          {outputText && (
            <HStack pt={2} spacing={2} flexWrap="wrap">
              <Tag size="sm" colorScheme="green" variant="subtle">
                {sourceLanguage === 'auto' ? 'AUTO' : sourceLanguage.toUpperCase()} → {targetLanguage.toUpperCase()}
              </Tag>
              {detectedLang && detectedLang !== toBCP47(sourceLanguage) && (
                <Tag size="sm" colorScheme="purple" variant="subtle">
                  Detected: {detectedLang}
                </Tag>
              )}
              <Tag size="sm" colorScheme="blue" variant="subtle">
                vibeon_translator
              </Tag>
            </HStack>
          )}
        </Flex>
      </Grid>

      {/* Mic control */}
      <Center py={8}>
        <VStack spacing={4}>
          {/* Big mic button */}
          <Box position="relative">
            {isListening && (
              <Box
                position="absolute"
                inset="-12px"
                borderRadius="full"
                bg="red.500"
                opacity={0.15}
                sx={{ animation: `${pulseRing} 1.5s ease-in-out infinite` }}
                pointerEvents="none"
              />
            )}
            <Circle
              size="80px"
              bg={isListening ? 'red.500' : 'learning.500'}
              cursor="pointer"
              boxShadow={isListening ? '0 0 0 6px rgba(245,101,101,0.3)' : 'lg'}
              transition="all 0.3s"
              onClick={isListening ? stopListening : startListening}
              _hover={{ transform: 'scale(1.05)', boxShadow: 'xl' }}
            >
              <Icon
                as={isListening ? MdStop : MdMic}
                w={8}
                h={8}
                color="white"
              />
            </Circle>
          </Box>

          <Text fontSize="sm" fontWeight="semibold" color={isListening ? 'red.500' : 'gray.500'}>
            {isListening ? 'Tap to stop' : 'Tap to speak'}
          </Text>

          {/* Secondary controls */}
          {fullTranscript && !isListening && (
            <HStack spacing={3}>
              <Button
                size="sm"
                leftIcon={<MdMic />}
                colorScheme="learning"
                variant="outline"
                borderRadius="full"
                onClick={startListening}
              >
                Continue
              </Button>
              <Button
                size="sm"
                leftIcon={<MdDeleteOutline />}
                colorScheme="gray"
                variant="ghost"
                borderRadius="full"
                onClick={handleClear}
              >
                Clear
              </Button>
            </HStack>
          )}
        </VStack>
      </Center>
    </Box>
  );
};

export default RealtimeTranslationPane;
