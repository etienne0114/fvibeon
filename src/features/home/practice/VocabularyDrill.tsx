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
  Skeleton,
  SimpleGrid,
  Stack,
  Text,
  useToast,
} from '@chakra-ui/react';
import { CheckIcon, CloseIcon } from '@chakra-ui/icons';
import { FiVolume2, FiGlobe } from 'react-icons/fi';
import {
  fetchVocabularyQueue,
  markVocabularyResult,
  fetchVocabularyStats,
  VocabularyEntry,
  VocabularyStats,
} from '../../../api/practice';
import { ink, inkSoft, rose, roseDeep, card, line, serif, sage, sageDeep, roseTint, sageTint, amber } from '../../../theme/brand';

const LANGS = [
  { id: 'rw', label: 'Kinyarwanda' },
  { id: 'en', label: 'English' },
  { id: 'fr', label: 'Français' },
];

const speak = (text: string, lang: string) => {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = lang === 'fr' ? 'fr-FR' : lang === 'rw' ? 'en-US' : 'en-US';
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

const VocabularyDrill = () => {
  const toast = useToast();
  const [language, setLanguage] = useState('rw');
  const [queue, setQueue] = useState<VocabularyEntry[]>([]);
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [stats, setStats] = useState<VocabularyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async (lang: string) => {
    try {
      setLoading(true);
      setError(null);
      const [q, s] = await Promise.all([fetchVocabularyQueue(lang, 8), fetchVocabularyStats()]);
      setQueue(q);
      setIndex(0);
      setRevealed(false);
      setStats(s);
    } catch (err: any) {
      setError(err?.friendlyMessage || err?.response?.data?.error || 'Could not load vocabulary drill');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(language);
  }, [language, load]);

  const current = queue[index];

  const answer = async (correct: boolean) => {
    if (!current || submitting) return;
    try {
      setSubmitting(true);
      await markVocabularyResult(current.vocabularyItemId, correct);
      toast({
        title: correct ? 'Nice! Marked as known 🎉' : "No worries — you'll see this again soon",
        status: correct ? 'success' : 'info',
        duration: 1800,
        position: 'top',
      });
      if (index + 1 < queue.length) {
        setIndex(index + 1);
        setRevealed(false);
      } else {
        await load(language);
      }
      fetchVocabularyStats().then(setStats).catch(() => undefined);
    } catch (err: any) {
      toast({ title: err?.friendlyMessage || 'Could not save your answer', status: 'error', duration: 2500, position: 'top' });
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
          <StatPill label="Words" value={stats.totalWords} />
          <StatPill label="Mastered" value={stats.mastered} />
          <StatPill label="Accuracy" value={`${stats.accuracy}%`} />
          <StatPill label="Streak" value={stats.currentStreak} />
        </SimpleGrid>
      )}

      {loading ? (
        <Skeleton h="280px" borderRadius="2xl" />
      ) : !current ? (
        <Box bg={card} border="1px solid" borderColor={line} borderRadius="2xl" p={10} textAlign="center">
          <Text color={inkSoft}>No words queued right now — check back soon!</Text>
        </Box>
      ) : (
        <Box bg="white" border="1px solid" borderColor={line} borderRadius="2xl" p={{ base: 6, md: 10 }} textAlign="center">
          <HStack justify="center" spacing={2} mb={4}>
            <Badge bg={current.isNew ? roseTint : sageTint} color={current.isNew ? roseDeep : sageDeep} borderRadius="full" px={3} py={0.5} fontSize="10px">
              {current.isNew ? 'NEW WORD' : `MASTERY ${current.masteryLevel}/6`}
            </Badge>
            <Badge bg={card} color={inkSoft} borderRadius="full" px={3} py={0.5} fontSize="10px">
              <HStack spacing={1}>
                <Icon as={FiGlobe} boxSize={2.5} />
                <Text>{index + 1}/{queue.length}</Text>
              </HStack>
            </Badge>
          </HStack>

          <HStack justify="center" spacing={3} mb={3}>
            <Text fontFamily={serif} fontWeight="700" fontSize={{ base: '3xl', md: '4xl' }} color={ink}>
              {current.word}
            </Text>
            <Circle
              as="button"
              size="40px"
              bg={sageTint}
              color={sageDeep}
              onClick={() => speak(current.word, current.language)}
              _hover={{ bg: sage, color: 'white' }}
              transition="all 0.15s"
              aria-label="Listen"
            >
              <Icon as={FiVolume2} boxSize={4} />
            </Circle>
          </HStack>

          {revealed ? (
            <Stack spacing={3} maxW="480px" mx="auto">
              <Text color={ink} fontSize="lg">
                {current.definition}
              </Text>
              <Text fontSize="xs" color={inkSoft} textTransform="uppercase" letterSpacing="0.05em">
                {current.partOfSpeech}
              </Text>
              {current.examples?.length > 0 && (
                <Box bg={card} borderRadius="xl" p={4} textAlign="left">
                  <Text fontSize="xs" fontWeight="700" color={inkSoft} mb={1}>
                    EXAMPLE
                  </Text>
                  <Text fontSize="sm" color={ink} fontStyle="italic">
                    "{current.examples[0]}"
                  </Text>
                </Box>
              )}
              <Flex gap={3} justify="center" pt={2}>
                <Button
                  leftIcon={<CloseIcon boxSize={2.5} />}
                  onClick={() => answer(false)}
                  isLoading={submitting}
                  borderRadius="full"
                  variant="outline"
                  borderColor={line}
                  color={roseDeep}
                  _hover={{ bg: roseTint, borderColor: rose }}
                  px={6}
                >
                  Still learning
                </Button>
                <Button
                  leftIcon={<CheckIcon boxSize={3} />}
                  onClick={() => answer(true)}
                  isLoading={submitting}
                  borderRadius="full"
                  bg={ink}
                  color="white"
                  _hover={{ bg: '#463039' }}
                  px={6}
                >
                  I know this
                </Button>
              </Flex>
            </Stack>
          ) : (
            <Button onClick={() => setRevealed(true)} borderRadius="full" bg={amber} color="white" px={8} h="46px" _hover={{ opacity: 0.9 }}>
              Reveal definition
            </Button>
          )}
        </Box>
      )}
    </Stack>
  );
};

export default VocabularyDrill;
