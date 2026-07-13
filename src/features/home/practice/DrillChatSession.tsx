import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  AlertIcon,
  Badge,
  Box,
  Button,
  Circle,
  Flex,
  HStack,
  Icon,
  IconButton,
  Input,
  Spinner,
  Stack,
  Switch,
  Text,
} from '@chakra-ui/react';
import { ArrowBackIcon, ArrowUpIcon } from '@chakra-ui/icons';
import { FiMic, FiSquare, FiPlay, FiTrash2, FiVolume2, FiAward } from 'react-icons/fi';
import { useAudioRecorder } from '../../../hooks/useAudioRecorder';
import { useTTS } from '../../../hooks/useTTS';
import { useSpeechRecognition } from '../../../hooks/useSpeechRecognition';
import { ink, inkSoft, rose, card, line, serif, sage, sageDeep, sageTint } from '../../../theme/brand';
import GrammarHighlight, { GrammarError } from './GrammarHighlight';

export interface ChatTurn {
  role: 'USER' | 'ASSISTANT';
  content: string;
  confidence?: number | null;
  grammarErrors?: GrammarError[];
  nativeSpeakerVersion?: string | null;
}

export interface SendResult {
  reply: string;
  confidence?: number | null;
  transcribedText?: string | null;
  grammarErrors?: GrammarError[];
  nativeSpeakerVersion?: string | null;
}

interface DrillChatSessionProps {
  title: string;
  subtitle: string;
  turns: ChatTurn[];
  language?: string;
  onSend: (message: string, audioBase64?: string) => Promise<SendResult>;
  onComplete: () => Promise<{ feedback: string }>;
  onExit: () => void;
  accentTint: string;
  accentDeep: string;
  completeLabel: string;
  feedbackTitle: string;
}

const blobToBase64 = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1] || '');
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });

const DrillChatSession = ({
  title,
  subtitle,
  turns: initialTurns,
  language = 'en',
  onSend,
  onComplete,
  onExit,
  accentTint,
  accentDeep,
  completeLabel,
  feedbackTitle,
}: DrillChatSessionProps) => {
  const [turns, setTurns] = useState<ChatTurn[]>(initialTurns);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [completing, setCompleting] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);
  const [autoPlay, setAutoPlay] = useState(true);
  const [speakingIndex, setSpeakingIndex] = useState<number | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const lastSpokenCount = useRef(initialTurns.length);

  const { isRecording, startRecording, stopRecording, audioBlob, audioUrl, clearRecording, formattedTime } =
    useAudioRecorder();
  const { speak, isPlaying, isLoading: ttsLoading } = useTTS();
  const speechRecognition = useSpeechRecognition(language);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [turns, sending]);

  // Auto-play new AI replies — off by default would feel dead for a
  // conversation drill, but a toggle keeps it under the user's control.
  useEffect(() => {
    if (!autoPlay || turns.length <= lastSpokenCount.current) return;
    const last = turns[turns.length - 1];
    if (last.role === 'ASSISTANT') {
      const idx = turns.length - 1;
      setSpeakingIndex(idx);
      speak(last.content, language).finally(() => setSpeakingIndex((cur) => (cur === idx ? null : cur)));
    }
    lastSpokenCount.current = turns.length;
  }, [turns, autoPlay, speak, language]);

  const speakTurn = (index: number, text: string) => {
    setSpeakingIndex(index);
    speak(text, language).finally(() => setSpeakingIndex((cur) => (cur === index ? null : cur)));
  };

  const toggleMic = async () => {
    setMicError(null);
    // Fast path: browser-native recognition, same approach as the real-time
    // translator — transcribes locally with no upload, no server STT wait.
    if (speechRecognition.supported) {
      if (speechRecognition.isListening) {
        speechRecognition.stop();
      } else {
        // Send the moment recognition finishes — a live conversation
        // shouldn't need a second tap to confirm what you just said.
        speechRecognition.start((finalText) => {
          send(finalText);
        });
      }
      return;
    }
    // Fallback: record audio and let the server transcribe it.
    if (isRecording) {
      stopRecording();
      return;
    }
    try {
      await startRecording();
    } catch (err: any) {
      setMicError(err?.message || 'Could not access the microphone.');
    }
  };

  const send = async (textOverride?: string) => {
    const text = textOverride ?? message;
    if (!text.trim() && !audioBlob) return;
    if (sending) return;

    let audioBase64: string | undefined;
    if (audioBlob) {
      audioBase64 = await blobToBase64(audioBlob);
    }

    setTurns((prev) => [...prev, { role: 'USER', content: text.trim() || '🎤 Voice message' }]);
    setMessage('');
    clearRecording();
    try {
      setSending(true);
      setError(null);
      const res = await onSend(text.trim(), audioBase64);
      setTurns((prev) => {
        const next = [...prev];
        const lastUser = next[next.length - 1];
        if (audioBase64 && res.transcribedText) {
          next[next.length - 1] = { ...lastUser, content: res.transcribedText, confidence: res.confidence };
        } else if (res.grammarErrors?.length) {
          next[next.length - 1] = { ...lastUser, grammarErrors: res.grammarErrors };
        }
        return [
          ...next,
          { role: 'ASSISTANT', content: res.reply, nativeSpeakerVersion: res.nativeSpeakerVersion },
        ];
      });
    } catch (err: any) {
      // A failed send previously left a permanent, unexplained bubble in the
      // chat. Pull it back out and restore the text so retrying is just
      // pressing send again, not re-typing (or re-speaking) the message.
      setTurns((prev) => prev.slice(0, -1));
      if (!audioBase64) setMessage(text);
      setError(err?.friendlyMessage || err?.response?.data?.error || 'Could not send your message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const complete = async () => {
    try {
      setCompleting(true);
      const res = await onComplete();
      setFeedback(res.feedback);
    } catch (err: any) {
      setError(err?.friendlyMessage || 'Could not complete the session');
    } finally {
      setCompleting(false);
    }
  };

  return (
    <Stack spacing={4}>
      <HStack justify="space-between" wrap="wrap" rowGap={2}>
        <Button size="sm" variant="ghost" leftIcon={<ArrowBackIcon />} color={inkSoft} onClick={onExit}>
          Back
        </Button>
        <HStack spacing={4}>
          <HStack spacing={2}>
            <Text fontSize="xs" color={inkSoft} fontWeight="600">
              Auto-play voice
            </Text>
            <Switch size="sm" isChecked={autoPlay} onChange={(e) => setAutoPlay(e.target.checked)} colorScheme="pink" />
          </HStack>
          {!feedback && (
            <Button size="sm" variant="outline" borderColor={line} color={inkSoft} onClick={complete} isLoading={completing}>
              {completeLabel}
            </Button>
          )}
        </HStack>
      </HStack>

      <Box bg={card} borderRadius="xl" p={4}>
        <Text fontFamily={serif} fontWeight="600" color={ink}>
          {title}
        </Text>
        <Text fontSize="xs" color={inkSoft}>
          {subtitle}
        </Text>
      </Box>

      {(error || micError) && (
        <Alert status="error" borderRadius="xl" fontSize="sm">
          <AlertIcon />
          {error || micError}
        </Alert>
      )}

      {feedback ? (
        <Box bg={accentTint} borderRadius="2xl" p={6}>
          <HStack mb={3}>
            <Circle size="32px" bg={accentDeep} color="white">
              <Icon as={FiAward} boxSize={4} />
            </Circle>
            <Text fontFamily={serif} fontWeight="600" fontSize="lg" color={ink}>
              {feedbackTitle}
            </Text>
          </HStack>
          <Text fontSize="sm" color={ink} lineHeight="1.8" whiteSpace="pre-wrap">
            {feedback}
          </Text>
        </Box>
      ) : (
        <Box bg="white" border="1px solid" borderColor={line} borderRadius="2xl" p={4}>
          <Stack spacing={3} maxH="440px" overflowY="auto" px={1}>
            {turns.map((t, i) => (
              <Flex key={i} justify={t.role === 'USER' ? 'flex-end' : 'flex-start'}>
                <Box bg={t.role === 'USER' ? ink : accentTint} color={t.role === 'USER' ? 'white' : ink} borderRadius="xl" px={4} py={2.5} maxW="82%">
                  {t.role === 'USER' && t.grammarErrors?.length ? (
                    <GrammarHighlight text={t.content} errors={t.grammarErrors} color="white" />
                  ) : (
                    <Text fontSize="sm">{t.content}</Text>
                  )}

                  <HStack spacing={2} mt={t.confidence != null || t.role === 'ASSISTANT' ? 1.5 : 0}>
                    {t.confidence != null && (
                      <Badge bg="rgba(255,255,255,0.25)" color="white" fontSize="9px" borderRadius="full">
                        Speech clarity {t.confidence}%
                      </Badge>
                    )}
                    {t.role === 'ASSISTANT' && (
                      <IconButton
                        aria-label="Listen"
                        icon={<Icon as={FiVolume2} boxSize={3} />}
                        size="2xs"
                        minW="18px"
                        h="18px"
                        variant="ghost"
                        color={sageDeep}
                        isLoading={speakingIndex === i && (ttsLoading || isPlaying)}
                        onClick={() => speakTurn(i, t.content)}
                      />
                    )}
                  </HStack>

                  {t.role === 'ASSISTANT' && t.nativeSpeakerVersion && (
                    <Box mt={2} pt={2} borderTop="1px solid rgba(46,31,38,0.12)">
                      <Text fontSize="10px" fontWeight="700" color={sageDeep} letterSpacing="0.04em">
                        MORE NATURAL WAY TO SAY IT
                      </Text>
                      <Text fontSize="xs" fontStyle="italic" color={ink}>
                        "{t.nativeSpeakerVersion}"
                      </Text>
                    </Box>
                  )}
                </Box>
              </Flex>
            ))}
            {sending && (
              <Flex justify="flex-start">
                <Box bg={accentTint} borderRadius="xl" px={4} py={2.5}>
                  <Spinner size="xs" color={accentDeep} />
                </Box>
              </Flex>
            )}
            <div ref={bottomRef} />
          </Stack>

          {speechRecognition.isListening ? (
            <HStack mt={3} bg={sageTint} borderRadius="xl" px={4} py={3} spacing={3}>
              <IconButton
                aria-label="Stop listening"
                icon={<Icon as={FiSquare} />}
                size="sm"
                borderRadius="full"
                bg={rose}
                color="white"
                onClick={toggleMic}
              />
              <Circle size="8px" bg={sageDeep} sx={{ animation: 'pulse 1.2s ease-in-out infinite' }} />
              <Text fontSize="sm" color={ink} flex={1} noOfLines={1}>
                {speechRecognition.interimText || 'Listening...'}
              </Text>
              <style>{`@keyframes pulse { 0%,100%{opacity:1;transform:scale(1);} 50%{opacity:0.4;transform:scale(1.4);} }`}</style>
            </HStack>
          ) : audioBlob ? (
            <HStack mt={3} bg={card} borderRadius="xl" p={2.5} spacing={3}>
              <IconButton
                aria-label="Play recording"
                icon={<Icon as={FiPlay} />}
                size="sm"
                borderRadius="full"
                bg={sage}
                color="white"
                _hover={{ opacity: 0.9 }}
                onClick={() => audioUrl && new Audio(audioUrl).play()}
              />
              <Text fontSize="sm" color={ink} fontWeight="600" flex={1}>
                Voice message ready
              </Text>
              <IconButton aria-label="Discard" icon={<Icon as={FiTrash2} />} size="sm" variant="ghost" color={rose} onClick={clearRecording} />
              <Button size="sm" borderRadius="full" bg={ink} color="white" _hover={{ bg: '#463039' }} onClick={() => send()} isLoading={sending}>
                Send
              </Button>
            </HStack>
          ) : (
            <HStack mt={3}>
              <IconButton
                aria-label={isRecording ? 'Stop recording' : 'Record voice message'}
                icon={<Icon as={isRecording ? FiSquare : FiMic} />}
                onClick={toggleMic}
                borderRadius="full"
                bg={isRecording ? rose : card}
                color={isRecording ? 'white' : inkSoft}
                border="1px solid"
                borderColor={isRecording ? rose : line}
                _hover={{ borderColor: rose }}
                flexShrink={0}
              />
              {isRecording ? (
                <HStack flex={1} justify="center" bg={card} borderRadius="xl" py={3}>
                  <Circle size="8px" bg={rose} sx={{ animation: 'pulse 1.2s ease-in-out infinite' }} />
                  <Text fontSize="sm" fontWeight="700" color={rose}>
                    Recording {formattedTime}
                  </Text>
                  <style>{`@keyframes pulse { 0%,100%{opacity:1;transform:scale(1);} 50%{opacity:0.4;transform:scale(1.4);} }`}</style>
                </HStack>
              ) : (
                <Input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && send()}
                  placeholder="Type or tap the mic to speak..."
                  bg={card}
                  border="1px solid"
                  borderColor={line}
                  borderRadius="xl"
                  _focus={{ borderColor: rose, boxShadow: `0 0 0 1px ${rose}` }}
                />
              )}
              <Button
                onClick={() => send()}
                isLoading={sending}
                isDisabled={!message.trim() && !isRecording}
                borderRadius="full"
                bg={ink}
                color="white"
                _hover={{ bg: '#463039' }}
                flexShrink={0}
              >
                <ArrowUpIcon />
              </Button>
            </HStack>
          )}
        </Box>
      )}
    </Stack>
  );
};

export default DrillChatSession;
