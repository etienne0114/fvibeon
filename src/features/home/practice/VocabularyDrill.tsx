import { useCallback, useEffect, useRef, useState } from 'react';
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
  InputGroup,
  InputLeftElement,
  InputRightElement,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Progress,
  Skeleton,
  SimpleGrid,
  Spinner,
  Stack,
  Text,
  Tooltip,
  useToast,
} from '@chakra-ui/react';
import { CheckIcon, CloseIcon } from '@chakra-ui/icons';
import { FiVolume2, FiSearch, FiX, FiChevronLeft, FiChevronRight, FiGlobe } from 'react-icons/fi';
import {
  fetchVocabularyQueue,
  markVocabularyResult,
  fetchVocabularyStats,
  VocabularyEntry,
  VocabularyStats,
} from '../../../api/practice';
import { searchVocabulary, translateDictionaryText, DictionaryDefinition } from '../../../api/dictionary';
import { useTranslator } from '../../../hooks/useTranslator';
import { ink, inkSoft, rose, roseDeep, card, line, serif, sage, sageDeep, roseTint, sageTint, amber } from '../../../theme/brand';

// English is what most users study first — it should be the tab you land on,
// not something you have to switch to every time you open Vocabulary.
const LANGS = [
  { id: 'en', label: 'English' },
  { id: 'rw', label: 'Kinyarwanda' },
  { id: 'fr', label: 'Français' },
];

const speak = (text: string, lang: string) => {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = lang === 'fr' ? 'fr-FR' : 'en-US';
  window.speechSynthesis.speak(utter);
};

// A single shape the flashcard renders, whether the word came from the
// spaced-repetition queue or from a one-off dictionary search.
interface DisplayWord {
  word: string;
  definition: string;
  partOfSpeech: string;
  examples: string[];
  language: string;
  isNew?: boolean;
  masteryLevel?: number;
}

const fromQueueEntry = (e: VocabularyEntry): DisplayWord => ({
  word: e.word,
  definition: e.definition,
  partOfSpeech: e.partOfSpeech,
  examples: e.examples || [],
  language: e.language,
  isNew: e.isNew,
  masteryLevel: e.masteryLevel,
});

const fromSearchResult = (d: DictionaryDefinition, language: string): DisplayWord => {
  const meaning = d.meanings?.[0];
  const def = meaning?.definitions?.[0];
  return {
    word: d.word,
    definition: def?.definition || '',
    partOfSpeech: meaning?.partOfSpeech || '',
    examples: [def?.example, ...(d.examples || [])].filter(Boolean) as string[],
    language,
  };
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
  const { languages: translatorLanguages } = useTranslator();

  const [language, setLanguage] = useState('en');
  const [queue, setQueue] = useState<VocabularyEntry[]>([]);
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [stats, setStats] = useState<VocabularyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Tracks WHICH answer is in flight (true/false), not just whether one is —
  // that's what lets the sibling button be disabled instead of silently
  // staying clickable and allowing a double-submit while the request is out.
  const [submittingCorrect, setSubmittingCorrect] = useState<boolean | null>(null);

  // Search — a look-up is a separate mode from the graded review queue, so
  // grading controls and progress make no sense while browsing a search hit.
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResult, setSearchResult] = useState<DictionaryDefinition | null>(null);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Translate — a lightweight on-demand popover, not a persistent language
  // switch, so it never fights with the study-language tabs above it.
  const [translateTarget, setTranslateTarget] = useState<string | null>(null);
  const [translated, setTranslated] = useState<string | null>(null);
  const [translating, setTranslating] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);

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
  const display: DisplayWord | null = searchResult
    ? fromSearchResult(searchResult, language)
    : current
      ? fromQueueEntry(current)
      : null;

  // Any time the word on screen changes, last word's translation is stale.
  useEffect(() => {
    setTranslateTarget(null);
    setTranslated(null);
  }, [display?.word, searchResult]);

  const exitSearch = () => {
    setSearchResult(null);
    setSearchError(null);
    setSearchQuery('');
  };

  const runSearch = async () => {
    const q = searchQuery.trim();
    if (!q) return;
    try {
      setSearching(true);
      setSearchError(null);
      const results = await searchVocabulary(q, language, 1);
      if (!results.length) {
        setSearchError(`No definition found for "${q}"`);
        setSearchResult(null);
        return;
      }
      setSearchResult(results[0]);
      setRevealed(true);
    } catch (err: any) {
      setSearchError(err?.friendlyMessage || err?.response?.data?.error || 'Search failed. Please try again.');
    } finally {
      setSearching(false);
    }
  };

  const goPrev = () => {
    if (searchResult || index === 0) return;
    setIndex((i) => i - 1);
    setRevealed(false);
  };

  const goNext = async () => {
    if (searchResult) return;
    if (index + 1 < queue.length) {
      setIndex((i) => i + 1);
      setRevealed(false);
    } else {
      await load(language);
    }
  };

  const answer = async (correct: boolean) => {
    if (!current || submittingCorrect !== null) return;
    try {
      setSubmittingCorrect(correct);
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
      setSubmittingCorrect(null);
    }
  };

  const runTranslate = async (targetLanguage: string) => {
    if (!display) return;
    try {
      setTranslateTarget(targetLanguage);
      setTranslating(true);
      setTranslated(null);
      const result = await translateDictionaryText({
        text: display.definition || display.word,
        targetLanguage,
        sourceLanguage: display.language,
      });
      setTranslated(result?.translatedText || null);
    } catch {
      setTranslated(null);
      toast({ title: 'Translation failed. Please try again.', status: 'error', duration: 2200, position: 'top' });
    } finally {
      setTranslating(false);
    }
  };

  const translateOptions = (translatorLanguages || []).filter((l) => l.code !== 'auto' && l.code !== display?.language);

  const progressPct = queue.length ? ((index + 1) / queue.length) * 100 : 0;

  return (
    <Stack spacing={5}>
      {error && (
        <Alert status="error" borderRadius="xl" fontSize="sm">
          <AlertIcon />
          {error}
        </Alert>
      )}

      <Flex justify="space-between" align="center" wrap="wrap" gap={3}>
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
              onClick={() => {
                exitSearch();
                setLanguage(l.id);
              }}
            >
              {l.label}
            </Button>
          ))}
        </HStack>

        <InputGroup maxW="260px" size="sm">
          <InputLeftElement pointerEvents="none">
            <Icon as={FiSearch} color={inkSoft} boxSize={3.5} />
          </InputLeftElement>
          <Input
            ref={searchInputRef}
            placeholder="Search any word..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && runSearch()}
            bg="white"
            borderRadius="full"
            borderColor={line}
            _focus={{ borderColor: ink, boxShadow: 'none' }}
          />
          <InputRightElement>
            {searching ? (
              <Spinner size="xs" color={inkSoft} />
            ) : searchResult || searchQuery ? (
              <IconButton
                aria-label="Clear search"
                icon={<Icon as={FiX} />}
                size="xs"
                variant="ghost"
                borderRadius="full"
                onClick={exitSearch}
              />
            ) : null}
          </InputRightElement>
        </InputGroup>
      </Flex>

      {searchError && (
        <Alert status="warning" borderRadius="xl" fontSize="sm">
          <AlertIcon />
          {searchError}
        </Alert>
      )}

      {!searchResult && stats && (
        <SimpleGrid columns={{ base: 2, md: 4 }} spacing={3}>
          <StatPill label="Words" value={stats.totalWords} />
          <StatPill label="Mastered" value={stats.mastered} />
          <StatPill label="Accuracy" value={`${stats.accuracy}%`} />
          <StatPill label="Streak" value={stats.currentStreak} />
        </SimpleGrid>
      )}

      {loading && !searchResult ? (
        <Skeleton h="280px" borderRadius="2xl" />
      ) : !display ? (
        <Box bg={card} border="1px solid" borderColor={line} borderRadius="2xl" p={10} textAlign="center">
          <Text color={inkSoft}>No words queued right now — check back soon!</Text>
        </Box>
      ) : (
        <Box bg="white" border="1px solid" borderColor={line} borderRadius="2xl" overflow="hidden">
          {!searchResult && queue.length > 0 && (
            <Progress value={progressPct} size="xs" bg={card} sx={{ '& > div': { bg: amber } }} />
          )}

          <Flex align="center" justify="center" gap={{ base: 2, md: 5 }} px={{ base: 4, md: 6 }} py={{ base: 6, md: 10 }}>
            <IconButton
              aria-label="Previous word"
              icon={<Icon as={FiChevronLeft} boxSize={5} />}
              onClick={goPrev}
              isDisabled={Boolean(searchResult) || index === 0}
              variant="ghost"
              borderRadius="full"
              color={inkSoft}
              display={{ base: 'none', sm: 'inline-flex' }}
            />

            <Box textAlign="center" flex={1} maxW="560px">
              <HStack justify="center" spacing={2} mb={4}>
                {searchResult ? (
                  <Badge bg={sageTint} color={sageDeep} borderRadius="full" px={3} py={0.5} fontSize="10px">
                    SEARCH RESULT
                  </Badge>
                ) : (
                  <>
                    <Badge
                      bg={display.isNew ? roseTint : sageTint}
                      color={display.isNew ? roseDeep : sageDeep}
                      borderRadius="full"
                      px={3}
                      py={0.5}
                      fontSize="10px"
                    >
                      {display.isNew ? 'NEW WORD' : `MASTERY ${display.masteryLevel}/6`}
                    </Badge>
                    <Badge bg={card} color={inkSoft} borderRadius="full" px={3} py={0.5} fontSize="10px">
                      {index + 1}/{queue.length}
                    </Badge>
                  </>
                )}
              </HStack>

              <HStack justify="center" spacing={3} mb={3}>
                <Text fontFamily={serif} fontWeight="700" fontSize={{ base: '3xl', md: '4xl' }} color={ink} wordBreak="break-word">
                  {display.word}
                </Text>
                <Circle
                  as="button"
                  size="40px"
                  bg={sageTint}
                  color={sageDeep}
                  onClick={() => speak(display.word, display.language)}
                  _hover={{ bg: sage, color: 'white' }}
                  transition="all 0.15s"
                  aria-label="Listen"
                  flexShrink={0}
                >
                  <Icon as={FiVolume2} boxSize={4} />
                </Circle>
              </HStack>

              {revealed ? (
                <Stack spacing={3} maxW="480px" mx="auto">
                  <Text color={ink} fontSize="lg">
                    {display.definition || 'No definition available.'}
                  </Text>
                  {display.partOfSpeech && (
                    <Text fontSize="xs" color={inkSoft} textTransform="uppercase" letterSpacing="0.05em">
                      {display.partOfSpeech}
                    </Text>
                  )}
                  {display.examples?.length > 0 && (
                    <Box bg={card} borderRadius="xl" p={4} textAlign="left">
                      <Text fontSize="xs" fontWeight="700" color={inkSoft} mb={1}>
                        EXAMPLE
                      </Text>
                      <Text fontSize="sm" color={ink} fontStyle="italic">
                        "{display.examples[0]}"
                      </Text>
                    </Box>
                  )}

                  <Menu placement="bottom">
                    <Tooltip label="Translate this definition" placement="top" openDelay={200}>
                      <MenuButton
                        as={Button}
                        leftIcon={<Icon as={FiGlobe} boxSize={3.5} />}
                        size="sm"
                        variant="outline"
                        borderRadius="full"
                        borderColor={line}
                        color={inkSoft}
                        alignSelf="center"
                        _hover={{ borderColor: ink, color: ink }}
                      >
                        Translate
                      </MenuButton>
                    </Tooltip>
                    <MenuList maxH="240px" overflowY="auto">
                      {translateOptions.length === 0 ? (
                        <MenuItem isDisabled>No languages available</MenuItem>
                      ) : (
                        translateOptions.map((l) => (
                          <MenuItem key={l.code} onClick={() => runTranslate(l.code)}>
                            {l.name}
                          </MenuItem>
                        ))
                      )}
                    </MenuList>
                  </Menu>

                  {translateTarget && (
                    <Box bg={sageTint} borderRadius="xl" p={4} textAlign="left">
                      <Text fontSize="xs" fontWeight="700" color={sageDeep} mb={1} textTransform="uppercase" letterSpacing="0.05em">
                        {translatorLanguages.find((l) => l.code === translateTarget)?.name || translateTarget}
                      </Text>
                      {translating ? (
                        <HStack spacing={2}>
                          <Spinner size="xs" color={sageDeep} />
                          <Text fontSize="sm" color={inkSoft}>
                            Translating...
                          </Text>
                        </HStack>
                      ) : (
                        <Text fontSize="sm" color={ink}>
                          {translated || 'Translation unavailable right now.'}
                        </Text>
                      )}
                    </Box>
                  )}

                  {searchResult ? (
                    <Button
                      onClick={exitSearch}
                      borderRadius="full"
                      bg={ink}
                      color="white"
                      _hover={{ bg: '#463039' }}
                      px={6}
                      alignSelf="center"
                    >
                      Back to practice
                    </Button>
                  ) : (
                    <Flex gap={3} justify="center" pt={2}>
                      <Button
                        leftIcon={<CloseIcon boxSize={2.5} />}
                        onClick={() => answer(false)}
                        isLoading={submittingCorrect === false}
                        isDisabled={submittingCorrect !== null && submittingCorrect !== false}
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
                        isLoading={submittingCorrect === true}
                        isDisabled={submittingCorrect !== null && submittingCorrect !== true}
                        borderRadius="full"
                        bg={ink}
                        color="white"
                        _hover={{ bg: '#463039' }}
                        px={6}
                      >
                        I know this
                      </Button>
                    </Flex>
                  )}
                </Stack>
              ) : (
                <Button onClick={() => setRevealed(true)} borderRadius="full" bg={amber} color="white" px={8} h="46px" _hover={{ opacity: 0.9 }}>
                  Reveal definition
                </Button>
              )}
            </Box>

            <IconButton
              aria-label="Next word"
              icon={<Icon as={FiChevronRight} boxSize={5} />}
              onClick={goNext}
              isDisabled={Boolean(searchResult)}
              variant="ghost"
              borderRadius="full"
              color={inkSoft}
              display={{ base: 'none', sm: 'inline-flex' }}
            />
          </Flex>

          {!searchResult && (
            <HStack justify="center" spacing={4} pb={4} display={{ base: 'flex', sm: 'none' }}>
              <Button size="sm" variant="ghost" leftIcon={<Icon as={FiChevronLeft} />} onClick={goPrev} isDisabled={index === 0}>
                Back
              </Button>
              <Button size="sm" variant="ghost" rightIcon={<Icon as={FiChevronRight} />} onClick={goNext}>
                Skip
              </Button>
            </HStack>
          )}
        </Box>
      )}
    </Stack>
  );
};

export default VocabularyDrill;
