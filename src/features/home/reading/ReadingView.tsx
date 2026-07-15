import { useCallback, useEffect, useState } from 'react';
import { Alert, AlertIcon, Badge, Box, Button, Circle, Flex, HStack, Icon, IconButton, Skeleton, SimpleGrid, Stack, Text, useToast } from '@chakra-ui/react';
import { FiMic, FiVolume2, FiChevronRight, FiChevronLeft, FiCheckCircle, FiXCircle } from 'react-icons/fi';
import { fetchSkillPassage, submitSkillSession, fetchSkillStats, SkillPassage, SkillStats } from '../../../api/reading';
import { useSpeechRecognition } from '../../../hooks/useSpeechRecognition';
import { diffWords, computeAccuracy, WordDiffToken } from '../../../utils/textDiff';
import WordDiffDisplay from './WordDiffDisplay';
import { ink, inkSoft, rose, roseDeep, card, line, serif, sage, sageDeep, roseTint, sageTint } from '../../../theme/brand';

const LANGS = [
  { id: 'en', label: 'English' },
  { id: 'rw', label: 'Kinyarwanda' },
  { id: 'fr', label: 'Français' },
];

const LEVEL_LABEL: Record<string, string> = { BEGINNER: 'Beginner', INTERMEDIATE: 'Intermediate', ADVANCED: 'Advanced' };

// Same instant browser TTS as Vocabulary's Listen button — reading
// benefits from hearing the correct pronunciation modeled before (or
// after) attempting it, and this needs no network round trip.
const speak = (text: string, lang: string) => {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = lang === 'fr' ? 'fr-FR' : lang === 'rw' ? 'rw-RW' : 'en-US';
  window.speechSynthesis.speak(utter);
};

const StatPill = ({ label, value }: { label: string; value: string | number }) => (
  <Box bg={card} border="1px solid" borderColor={line} borderRadius="xl" px={4} py={2.5} textAlign="center" flex={1}>
    <Text fontFamily={serif} fontWeight="600" fontSize="lg" color={ink}>
      {value}
    </Text>
    <Text fontSize="10px" color={inkSoft} fontWeight="600" textTransform="uppercase" letterSpacing="0.05em">
      {label}
    </Text>
  </Box>
);

interface ReadResult {
  tokens: WordDiffToken[];
  accuracy: number;
}

interface WordAttempt {
  matched: boolean;
  heard: string;
}

const ReadingView = () => {
  const toast = useToast();
  const [language, setLanguage] = useState('en');
  const [passage, setPassage] = useState<SkillPassage | null>(null);
  const [stats, setStats] = useState<SkillStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // PARAGRAPH mode (whole text read in one go)
  const [result, setResult] = useState<ReadResult | null>(null);

  // WORDS mode (beginner) — one word on screen at a time, Prev/Next
  // between them, results accumulated until the last word is finished.
  const [wordIndex, setWordIndex] = useState(0);
  const [wordAttempts, setWordAttempts] = useState<(WordAttempt | null)[]>([]);

  const speechRecognition = useSpeechRecognition(language);

  const isWords = passage?.contentType === 'WORDS';
  const words = passage?.words || [];
  const currentWord = words[wordIndex] || '';
  const referenceText = isWords ? currentWord : passage?.text || '';

  const load = useCallback(async (lang: string) => {
    try {
      setLoading(true);
      setError(null);
      setResult(null);
      setWordIndex(0);
      setWordAttempts([]);
      const [p, s] = await Promise.all([fetchSkillPassage('READING', lang), fetchSkillStats('READING', lang)]);
      setPassage(p);
      setWordAttempts(new Array((p.words || []).length).fill(null));
      setStats(s);
    } catch (err: any) {
      setError(err?.friendlyMessage || err?.response?.data?.error || 'Could not load a reading passage');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(language);
  }, [language, load]);

  const startReading = () => {
    if (!speechRecognition.supported || !passage) return;
    if (speechRecognition.isListening) {
      speechRecognition.stop();
      return;
    }
    if (isWords) {
      speechRecognition.start((heard) => {
        const tokens = diffWords(currentWord, heard);
        const matched = tokens.some((t) => t.matched);
        setWordAttempts((prev) => {
          const next = [...prev];
          next[wordIndex] = { matched, heard };
          return next;
        });
      });
    } else {
      setResult(null);
      speechRecognition.start((heard) => {
        const tokens = diffWords(referenceText, heard);
        setResult({ tokens, accuracy: computeAccuracy(tokens) });
      });
    }
  };

  const goPrevWord = () => setWordIndex((i) => Math.max(0, i - 1));
  const goNextWord = () => setWordIndex((i) => Math.min(words.length - 1, i + 1));

  const attemptedCount = wordAttempts.filter(Boolean).length;
  const allWordsAttempted = words.length > 0 && attemptedCount === words.length;

  const submit = async () => {
    if (!passage || submitting) return;
    let accuracy: number;
    let mistakes: { expected: string; heard: string }[];

    if (isWords) {
      const tokens: WordDiffToken[] = words.map((w, i) => ({ word: w, matched: wordAttempts[i]?.matched ?? false }));
      accuracy = computeAccuracy(tokens);
      mistakes = words
        .map((w, i) => ({ expected: w, heard: wordAttempts[i]?.heard || '', matched: wordAttempts[i]?.matched ?? false }))
        .filter((m) => !m.matched)
        .map(({ expected, heard }) => ({ expected, heard }));
    } else {
      if (!result) return;
      accuracy = result.accuracy;
      mistakes = result.tokens.filter((t) => !t.matched).map((t) => ({ expected: t.word, heard: '' }));
    }

    try {
      setSubmitting(true);
      const res = await submitSkillSession('READING', { passageId: passage.passageId, accuracy, mistakes });
      const leveledUp = Boolean(stats && res.level !== stats.level);
      toast({
        title: leveledUp ? `Level up! You're now at ${LEVEL_LABEL[res.level]} 🎉` : `Saved — ${accuracy}% accuracy`,
        status: 'success',
        duration: 2400,
        position: 'top',
      });
      await load(language);
    } catch (err: any) {
      toast({ title: err?.friendlyMessage || 'Could not save your session', status: 'error', duration: 2500, position: 'top' });
    } finally {
      setSubmitting(false);
    }
  };

  const currentAttempt = wordAttempts[wordIndex];

  return (
    <Stack spacing={5}>
      {error && (
        <Alert status="error" borderRadius="xl" fontSize="sm">
          <AlertIcon />
          {error}
        </Alert>
      )}

      <HStack spacing={2}>
        {LANGS.map((l) => (
          <Button
            key={l.id}
            size="sm"
            borderRadius="full"
            variant={language === l.id ? 'solid' : 'outline'}
            bg={language === l.id ? ink : 'transparent'}
            color={language === l.id ? 'white' : inkSoft}
            borderColor={line}
            _hover={{ borderColor: ink }}
            onClick={() => setLanguage(l.id)}
          >
            {l.label}
          </Button>
        ))}
      </HStack>

      {stats && (
        <SimpleGrid columns={{ base: 2, md: 4 }} spacing={3}>
          <StatPill label="Level" value={LEVEL_LABEL[stats.level]} />
          <StatPill label="Sessions" value={stats.totalSessions} />
          <StatPill label="Accuracy" value={`${stats.avgAccuracy}%`} />
          <StatPill label="Streak" value={stats.streak} />
        </SimpleGrid>
      )}

      {loading ? (
        <Skeleton h="280px" borderRadius="2xl" />
      ) : !passage ? (
        <Box bg={card} border="1px solid" borderColor={line} borderRadius="2xl" p={10} textAlign="center">
          <Text color={inkSoft}>Nothing to read right now — check back soon!</Text>
        </Box>
      ) : (
        <Box bg="white" border="1px solid" borderColor={line} borderRadius="2xl" p={{ base: 6, md: 10 }}>
          <HStack justify="center" spacing={2} mb={5}>
            <Badge bg={roseTint} color={roseDeep} borderRadius="full" px={3} py={0.5} fontSize="10px">
              {LEVEL_LABEL[passage.level]}
            </Badge>
            {isWords && (
              <Badge bg={card} color={inkSoft} borderRadius="full" px={3} py={0.5} fontSize="10px">
                {wordIndex + 1}/{words.length}
              </Badge>
            )}
            {passage.topic && !isWords && (
              <Badge bg={card} color={inkSoft} borderRadius="full" px={3} py={0.5} fontSize="10px">
                {passage.topic}
              </Badge>
            )}
          </HStack>

          {isWords ? (
            <Flex align="center" justify="center" gap={{ base: 2, md: 5 }} mb={6}>
              <IconButton
                aria-label="Previous word"
                icon={<Icon as={FiChevronLeft} boxSize={5} />}
                onClick={goPrevWord}
                isDisabled={wordIndex === 0}
                variant="ghost"
                borderRadius="full"
                color={inkSoft}
              />
              <HStack spacing={3}>
                <Text fontFamily={serif} fontWeight="700" fontSize={{ base: '3xl', md: '4xl' }} color={ink} wordBreak="break-word">
                  {currentWord}
                </Text>
                <Circle
                  as="button"
                  size="40px"
                  bg={sageTint}
                  color={sageDeep}
                  onClick={() => speak(currentWord, language)}
                  _hover={{ bg: sage, color: 'white' }}
                  transition="all 0.15s"
                  aria-label="Listen"
                  flexShrink={0}
                >
                  <Icon as={FiVolume2} boxSize={4} />
                </Circle>
                {currentAttempt && (
                  <Icon
                    as={currentAttempt.matched ? FiCheckCircle : FiXCircle}
                    color={currentAttempt.matched ? sageDeep : roseDeep}
                    boxSize={6}
                  />
                )}
              </HStack>
              <IconButton
                aria-label="Next word"
                icon={<Icon as={FiChevronRight} boxSize={5} />}
                onClick={goNextWord}
                isDisabled={wordIndex === words.length - 1}
                variant="ghost"
                borderRadius="full"
                color={inkSoft}
              />
            </Flex>
          ) : (
            <Box maxW="620px" mx="auto" mb={6}>
              <Flex justify="flex-end" mb={2}>
                <Circle
                  as="button"
                  size="36px"
                  bg={sageTint}
                  color={sageDeep}
                  onClick={() => speak(referenceText, language)}
                  _hover={{ bg: sage, color: 'white' }}
                  transition="all 0.15s"
                  aria-label="Listen"
                >
                  <Icon as={FiVolume2} boxSize={4} />
                </Circle>
              </Flex>
              <Text fontFamily={serif} fontSize={{ base: 'lg', md: 'xl' }} color={ink} lineHeight="1.8" textAlign="left">
                {passage.text}
              </Text>
            </Box>
          )}

          <Flex direction="column" align="center" gap={3}>
            {speechRecognition.supported ? (
              <Circle
                as="button"
                size="64px"
                bg={speechRecognition.isListening ? rose : sageTint}
                color={speechRecognition.isListening ? 'white' : sageDeep}
                onClick={startReading}
                _hover={{ bg: speechRecognition.isListening ? roseDeep : sage, color: 'white' }}
                transition="all 0.15s"
                aria-label={speechRecognition.isListening ? 'Stop reading' : 'Read aloud'}
              >
                <Icon as={FiMic} boxSize={6} />
              </Circle>
            ) : (
              <Text fontSize="sm" color={inkSoft}>
                Your browser doesn't support voice input for this feature.
              </Text>
            )}
            <Text fontSize="xs" color={inkSoft} fontWeight="600">
              {speechRecognition.isListening
                ? `Listening — read it aloud${speechRecognition.interimText ? `: "${speechRecognition.interimText}"` : '...'}`
                : isWords
                  ? currentAttempt
                    ? currentAttempt.matched
                      ? 'Nicely read! Tap next to continue'
                      : `Heard "${currentAttempt.heard}" — tap the mic to try again`
                    : 'Tap the mic and read this word aloud'
                  : 'Tap the mic and read it aloud'}
            </Text>
          </Flex>

          {isWords ? (
            allWordsAttempted && (
              <Flex justify="center" mt={6}>
                <Button
                  onClick={submit}
                  isLoading={submitting}
                  rightIcon={<Icon as={FiChevronRight} />}
                  borderRadius="full"
                  bg={ink}
                  color="white"
                  _hover={{ bg: '#463039' }}
                  px={6}
                >
                  Finish & save session
                </Button>
              </Flex>
            )
          ) : (
            result &&
            !speechRecognition.isListening && (
              <Stack spacing={4} mt={7} maxW="620px" mx="auto">
                <Box bg={card} borderRadius="xl" p={4}>
                  <Text fontSize="xs" fontWeight="700" color={inkSoft} mb={2} textTransform="uppercase" letterSpacing="0.05em">
                    Your reading — {result.accuracy}% accuracy
                  </Text>
                  <WordDiffDisplay tokens={result.tokens} />
                </Box>
                <Flex gap={3} justify="center">
                  <Button
                    onClick={() => setResult(null)}
                    variant="outline"
                    borderColor={line}
                    color={inkSoft}
                    borderRadius="full"
                    _hover={{ borderColor: ink, color: ink }}
                    px={6}
                  >
                    Try again
                  </Button>
                  <Button
                    onClick={submit}
                    isLoading={submitting}
                    rightIcon={<Icon as={FiChevronRight} />}
                    borderRadius="full"
                    bg={ink}
                    color="white"
                    _hover={{ bg: '#463039' }}
                    px={6}
                  >
                    Save & continue
                  </Button>
                </Flex>
              </Stack>
            )
          )}
        </Box>
      )}
    </Stack>
  );
};

export default ReadingView;
