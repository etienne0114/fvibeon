import { useCallback, useEffect, useState } from 'react';
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
  Skeleton,
  SimpleGrid,
  Stack,
  Text,
  Textarea,
  useToast,
} from '@chakra-ui/react';
import { FiVolume2, FiMic, FiChevronRight, FiChevronLeft, FiCheckCircle, FiXCircle } from 'react-icons/fi';
import { fetchSkillPassage, submitSkillSession, fetchSkillStats, SkillPassage, SkillStats } from '../../../api/reading';
import { useSpeechRecognition } from '../../../hooks/useSpeechRecognition';
import { useTranslator } from '../../../hooks/useTranslator';
import { diffWords, computeAccuracy, WordDiffToken } from '../../../utils/textDiff';
import WordDiffDisplay from '../reading/WordDiffDisplay';
import { ink, inkSoft, rose, roseDeep, card, line, serif, sage, sageDeep, roseTint, sageTint } from '../../../theme/brand';

const LANGS = [
  { id: 'en', label: 'English' },
  { id: 'rw', label: 'Kinyarwanda' },
  { id: 'fr', label: 'Français' },
];

const LEVEL_LABEL: Record<string, string> = { BEGINNER: 'Beginner', INTERMEDIATE: 'Intermediate', ADVANCED: 'Advanced' };

const speechLocale = (lang: string) => (lang === 'fr' ? 'fr-FR' : lang === 'rw' ? 'rw-RW' : 'en-US');

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

interface DictationResult {
  tokens: WordDiffToken[];
  accuracy: number;
}

interface WordDictation {
  typed: string;
  matched: boolean;
}

const ListeningView = () => {
  const toast = useToast();
  const { speakText } = useTranslator();

  const [language, setLanguage] = useState('en');
  const [passage, setPassage] = useState<SkillPassage | null>(null);
  const [stats, setStats] = useState<SkillStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // PARAGRAPH mode
  const [hasPlayed, setHasPlayed] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [result, setResult] = useState<DictationResult | null>(null);
  // The mic "repeat it back" step is ungraded practice, separate from the
  // typed dictation that's actually submitted for accuracy/level tracking.
  const [spokenResult, setSpokenResult] = useState<WordDiffToken[] | null>(null);

  // WORDS mode (beginner) — one word at a time, Prev/Next, results
  // accumulated until the last word is checked.
  const [wordIndex, setWordIndex] = useState(0);
  const [wordPlayed, setWordPlayed] = useState<boolean[]>([]);
  const [wordInput, setWordInput] = useState('');
  const [wordDictation, setWordDictation] = useState<(WordDictation | null)[]>([]);
  const [wordSpoken, setWordSpoken] = useState<(WordDiffToken[] | null)[]>([]);

  const speechRecognition = useSpeechRecognition(language);

  const isWords = passage?.contentType === 'WORDS';
  const words = passage?.words || [];
  const currentWord = words[wordIndex] || '';
  const referenceText = isWords ? currentWord : passage?.text || '';

  const load = useCallback(async (lang: string) => {
    try {
      setLoading(true);
      setError(null);
      setHasPlayed(false);
      setTranscript('');
      setResult(null);
      setSpokenResult(null);
      setWordIndex(0);
      setWordInput('');
      const [p, s] = await Promise.all([fetchSkillPassage('LISTENING', lang), fetchSkillStats('LISTENING', lang)]);
      setPassage(p);
      const count = (p.words || []).length;
      setWordPlayed(new Array(count).fill(false));
      setWordDictation(new Array(count).fill(null));
      setWordSpoken(new Array(count).fill(null));
      setStats(s);
    } catch (err: any) {
      setError(err?.friendlyMessage || err?.response?.data?.error || 'Could not load a listening passage');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(language);
  }, [language, load]);

  useEffect(() => {
    setWordInput(wordDictation[wordIndex]?.typed || '');
  }, [wordIndex, wordDictation]);

  const play = () => {
    if (!referenceText) return;
    speakText(referenceText, speechLocale(language));
    if (isWords) {
      setWordPlayed((prev) => {
        const next = [...prev];
        next[wordIndex] = true;
        return next;
      });
    } else {
      setHasPlayed(true);
    }
  };

  const checkDictation = () => {
    if (isWords) {
      if (!wordInput.trim()) return;
      const tokens = diffWords(currentWord, wordInput);
      const matched = tokens.some((t) => t.matched);
      setWordDictation((prev) => {
        const next = [...prev];
        next[wordIndex] = { typed: wordInput, matched };
        return next;
      });
    } else {
      if (!transcript.trim()) return;
      const tokens = diffWords(referenceText, transcript);
      setResult({ tokens, accuracy: computeAccuracy(tokens) });
    }
  };

  const repeatAloud = () => {
    if (!speechRecognition.supported) return;
    if (speechRecognition.isListening) {
      speechRecognition.stop();
      return;
    }
    if (isWords) {
      speechRecognition.start((heard) => {
        setWordSpoken((prev) => {
          const next = [...prev];
          next[wordIndex] = diffWords(currentWord, heard);
          return next;
        });
      });
    } else {
      setSpokenResult(null);
      speechRecognition.start((heard) => {
        setSpokenResult(diffWords(referenceText, heard));
      });
    }
  };

  const goPrevWord = () => setWordIndex((i) => Math.max(0, i - 1));
  const goNextWord = () => setWordIndex((i) => Math.min(words.length - 1, i + 1));

  const attemptedCount = wordDictation.filter(Boolean).length;
  const allWordsAttempted = words.length > 0 && attemptedCount === words.length;
  const currentDictation = wordDictation[wordIndex];

  const submit = async () => {
    if (!passage || submitting) return;
    let accuracy: number;
    let mistakes: { expected: string; heard: string }[];

    if (isWords) {
      const tokens: WordDiffToken[] = words.map((w, i) => ({ word: w, matched: wordDictation[i]?.matched ?? false }));
      accuracy = computeAccuracy(tokens);
      mistakes = words
        .map((w, i) => ({ expected: w, heard: wordDictation[i]?.typed || '', matched: wordDictation[i]?.matched ?? false }))
        .filter((m) => !m.matched)
        .map(({ expected, heard }) => ({ expected, heard }));
    } else {
      if (!result) return;
      accuracy = result.accuracy;
      mistakes = result.tokens.filter((t) => !t.matched).map((t) => ({ expected: t.word, heard: '' }));
    }

    try {
      setSubmitting(true);
      const res = await submitSkillSession('LISTENING', { passageId: passage.passageId, accuracy, mistakes });
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
          <Text color={inkSoft}>Nothing to listen to right now — check back soon!</Text>
        </Box>
      ) : (
        <Box bg="white" border="1px solid" borderColor={line} borderRadius="2xl" p={{ base: 6, md: 10 }}>
          <HStack justify="center" spacing={2} mb={6}>
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

          {isWords && (
            <Flex align="center" justify="center" gap={{ base: 2, md: 5 }} mb={4}>
              <IconButton
                aria-label="Previous word"
                icon={<Icon as={FiChevronLeft} boxSize={5} />}
                onClick={goPrevWord}
                isDisabled={wordIndex === 0}
                variant="ghost"
                borderRadius="full"
                color={inkSoft}
              />
              <Text fontSize="xs" color={inkSoft} fontWeight="600" minW="90px" textAlign="center">
                Word {wordIndex + 1} of {words.length}
              </Text>
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
          )}

          <Flex direction="column" align="center" gap={3} mb={7}>
            <Circle
              as="button"
              size="64px"
              bg={sageTint}
              color={sageDeep}
              onClick={play}
              _hover={{ bg: sage, color: 'white' }}
              transition="all 0.15s"
              aria-label="Play audio"
            >
              <Icon as={FiVolume2} boxSize={6} />
            </Circle>
            <Text fontSize="xs" color={inkSoft} fontWeight="600">
              {(isWords ? wordPlayed[wordIndex] : hasPlayed) ? 'Tap to play it again' : 'Tap to play the audio'}
            </Text>
          </Flex>

          {isWords ? (
            <Stack spacing={4} maxW="480px" mx="auto">
              {wordPlayed[wordIndex] && !currentDictation && (
                <Stack spacing={3}>
                  <Input
                    value={wordInput}
                    onChange={(e) => setWordInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && checkDictation()}
                    placeholder="Type the word you heard..."
                    bg="white"
                    borderColor={line}
                    textAlign="center"
                    _focus={{ borderColor: ink, boxShadow: 'none' }}
                  />
                  <Button
                    onClick={checkDictation}
                    isDisabled={!wordInput.trim()}
                    alignSelf="center"
                    borderRadius="full"
                    bg={ink}
                    color="white"
                    _hover={{ bg: '#463039' }}
                    px={6}
                  >
                    Check my answer
                  </Button>
                </Stack>
              )}

              {currentDictation && (
                <Stack spacing={4}>
                  <HStack justify="center" spacing={2}>
                    <Icon
                      as={currentDictation.matched ? FiCheckCircle : FiXCircle}
                      color={currentDictation.matched ? sageDeep : roseDeep}
                      boxSize={5}
                    />
                    <Text fontWeight="700" color={currentDictation.matched ? sageDeep : roseDeep}>
                      {currentDictation.matched ? 'Correct!' : `You typed "${currentDictation.typed}" — it was "${currentWord}"`}
                    </Text>
                  </HStack>

                  <Box borderTop="1px solid" borderColor={line} pt={4}>
                    <Flex direction="column" align="center" gap={2}>
                      {speechRecognition.supported && (
                        <Circle
                          as="button"
                          size="48px"
                          bg={speechRecognition.isListening ? rose : sageTint}
                          color={speechRecognition.isListening ? 'white' : sageDeep}
                          onClick={repeatAloud}
                          _hover={{ bg: speechRecognition.isListening ? roseDeep : sage, color: 'white' }}
                          transition="all 0.15s"
                          aria-label={speechRecognition.isListening ? 'Stop repeating' : 'Repeat it aloud'}
                        >
                          <Icon as={FiMic} boxSize={4} />
                        </Circle>
                      )}
                      <Text fontSize="xs" color={inkSoft} fontWeight="600">
                        {speechRecognition.isListening ? 'Listening...' : 'Now try saying it out loud'}
                      </Text>
                    </Flex>
                    {wordSpoken[wordIndex] && !speechRecognition.isListening && (
                      <Box bg={sageTint} borderRadius="xl" p={3} mt={3} textAlign="center">
                        <WordDiffDisplay tokens={wordSpoken[wordIndex] as WordDiffToken[]} />
                      </Box>
                    )}
                  </Box>
                </Stack>
              )}
            </Stack>
          ) : (
            <>
              {hasPlayed && !result && (
                <Stack spacing={3} maxW="560px" mx="auto">
                  <Textarea
                    value={transcript}
                    onChange={(e) => setTranscript(e.target.value)}
                    placeholder="Type what you heard..."
                    bg="white"
                    borderColor={line}
                    _focus={{ borderColor: ink, boxShadow: 'none' }}
                    rows={4}
                  />
                  <Button
                    onClick={checkDictation}
                    isDisabled={!transcript.trim()}
                    alignSelf="center"
                    borderRadius="full"
                    bg={ink}
                    color="white"
                    _hover={{ bg: '#463039' }}
                    px={6}
                  >
                    Check my answer
                  </Button>
                </Stack>
              )}

              {result && (
                <Stack spacing={5} mt={2} maxW="560px" mx="auto">
                  <Box bg={card} borderRadius="xl" p={4}>
                    <Text fontSize="xs" fontWeight="700" color={inkSoft} mb={2} textTransform="uppercase" letterSpacing="0.05em">
                      What was actually said — {result.accuracy}% accuracy
                    </Text>
                    <WordDiffDisplay tokens={result.tokens} />
                  </Box>

                  <Box borderTop="1px solid" borderColor={line} pt={5}>
                    <Flex direction="column" align="center" gap={3}>
                      {speechRecognition.supported ? (
                        <Circle
                          as="button"
                          size="52px"
                          bg={speechRecognition.isListening ? rose : sageTint}
                          color={speechRecognition.isListening ? 'white' : sageDeep}
                          onClick={repeatAloud}
                          _hover={{ bg: speechRecognition.isListening ? roseDeep : sage, color: 'white' }}
                          transition="all 0.15s"
                          aria-label={speechRecognition.isListening ? 'Stop repeating' : 'Repeat it aloud'}
                        >
                          <Icon as={FiMic} boxSize={5} />
                        </Circle>
                      ) : null}
                      <Text fontSize="xs" color={inkSoft} fontWeight="600">
                        {speechRecognition.isListening ? 'Listening — say it back...' : 'Now try saying it back out loud'}
                      </Text>
                    </Flex>
                    {spokenResult && !speechRecognition.isListening && (
                      <Box bg={sageTint} borderRadius="xl" p={4} mt={4}>
                        <Text fontSize="xs" fontWeight="700" color={sageDeep} mb={2} textTransform="uppercase" letterSpacing="0.05em">
                          Your speaking practice
                        </Text>
                        <WordDiffDisplay tokens={spokenResult} />
                      </Box>
                    )}
                  </Box>

                  <Flex gap={3} justify="center">
                    <Button
                      onClick={() => {
                        setResult(null);
                        setTranscript('');
                        setSpokenResult(null);
                      }}
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
              )}
            </>
          )}

          {isWords && allWordsAttempted && (
            <Flex justify="center" mt={7}>
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
          )}
        </Box>
      )}
    </Stack>
  );
};

export default ListeningView;
