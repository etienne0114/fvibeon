import { useCallback, useEffect, useState } from 'react';
import { Alert, AlertIcon, Badge, Box, Button, Circle, Flex, HStack, Icon, Skeleton, SimpleGrid, Stack, Text, Wrap, WrapItem, useToast } from '@chakra-ui/react';
import { FiMic, FiChevronRight } from 'react-icons/fi';
import { fetchSkillPassage, submitSkillSession, fetchSkillStats, SkillPassage, SkillStats } from '../../../api/reading';
import { useSpeechRecognition } from '../../../hooks/useSpeechRecognition';
import { diffWords, computeAccuracy, WordDiffToken } from '../../../utils/textDiff';
import WordDiffDisplay from './WordDiffDisplay';
import { ink, inkSoft, rose, roseDeep, card, line, serif, sage, sageDeep, roseTint, sageTint, amber } from '../../../theme/brand';

const LANGS = [
  { id: 'en', label: 'English' },
  { id: 'rw', label: 'Kinyarwanda' },
  { id: 'fr', label: 'Français' },
];

const LEVEL_LABEL: Record<string, string> = { BEGINNER: 'Beginner', INTERMEDIATE: 'Intermediate', ADVANCED: 'Advanced' };

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
  heard: string;
}

const ReadingView = () => {
  const toast = useToast();
  const [language, setLanguage] = useState('en');
  const [passage, setPassage] = useState<SkillPassage | null>(null);
  const [stats, setStats] = useState<SkillStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ReadResult | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const speechRecognition = useSpeechRecognition(language);

  const referenceText = passage?.contentType === 'WORDS' ? (passage.words || []).join(' ') : passage?.text || '';

  const load = useCallback(async (lang: string) => {
    try {
      setLoading(true);
      setError(null);
      setResult(null);
      const [p, s] = await Promise.all([fetchSkillPassage('READING', lang), fetchSkillStats('READING', lang)]);
      setPassage(p);
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
    setResult(null);
    speechRecognition.start((heard) => {
      const tokens = diffWords(referenceText, heard);
      setResult({ tokens, accuracy: computeAccuracy(tokens), heard });
    });
  };

  const submit = async () => {
    if (!passage || !result || submitting) return;
    try {
      setSubmitting(true);
      const mistakes = result.tokens.filter((t) => !t.matched).map((t) => ({ expected: t.word, heard: '' }));
      const res = await submitSkillSession('READING', { passageId: passage.passageId, accuracy: result.accuracy, mistakes });
      const leveledUp = Boolean(stats && res.level !== stats.level);
      toast({
        title: leveledUp ? `Level up! You're now at ${LEVEL_LABEL[res.level]} 🎉` : `Saved — ${result.accuracy}% accuracy`,
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
          <Text color={inkSoft}>Nothing to read right now — check back soon!</Text>
        </Box>
      ) : (
        <Box bg="white" border="1px solid" borderColor={line} borderRadius="2xl" p={{ base: 6, md: 10 }}>
          <HStack justify="center" spacing={2} mb={5}>
            <Badge bg={roseTint} color={roseDeep} borderRadius="full" px={3} py={0.5} fontSize="10px">
              {LEVEL_LABEL[passage.level]}
            </Badge>
            {passage.topic && (
              <Badge bg={card} color={inkSoft} borderRadius="full" px={3} py={0.5} fontSize="10px">
                {passage.topic}
              </Badge>
            )}
          </HStack>

          {passage.contentType === 'WORDS' ? (
            <Wrap justify="center" spacing={3} mb={6}>
              {(passage.words || []).map((w) => (
                <WrapItem key={w}>
                  <Text fontFamily={serif} fontWeight="700" fontSize={{ base: 'xl', md: '2xl' }} color={ink} px={3} py={1}>
                    {w}
                  </Text>
                </WrapItem>
              ))}
            </Wrap>
          ) : (
            <Text fontFamily={serif} fontSize={{ base: 'lg', md: 'xl' }} color={ink} lineHeight="1.8" mb={6} textAlign="left" maxW="620px" mx="auto">
              {passage.text}
            </Text>
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
                : 'Tap the mic and read it aloud'}
            </Text>
          </Flex>

          {result && !speechRecognition.isListening && (
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
          )}
        </Box>
      )}
    </Stack>
  );
};

export default ReadingView;
