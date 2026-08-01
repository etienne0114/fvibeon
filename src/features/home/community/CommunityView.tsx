import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  AlertIcon,
  Badge,
  Box,
  Button,
  Flex,
  HStack,
  Icon,
  SimpleGrid,
  Skeleton,
  Stack,
  Text,
  Textarea,
  useToast,
} from '@chakra-ui/react';
import { FiUsers, FiEdit3, FiCheckCircle, FiClock, FiSend } from 'react-icons/fi';
import {
  submitSentence,
  fetchSentenceToCorrect,
  submitCorrection,
  fetchMySubmissions,
  fetchCommunityStats,
  SentenceToCorrect,
  MySubmission,
  CommunityStats,
} from '../../../api/community';
import { ink, inkSoft, roseDeep, card, line, serif, sage, sageDeep, sageTint, roseTint } from '../../../theme/brand';

const LANGS = [
  { id: 'en', label: 'English' },
  { id: 'rw', label: 'Kinyarwanda' },
  { id: 'fr', label: 'Français' },
];

const TABS = [
  { id: 'correct', label: 'Correct a sentence', icon: FiEdit3 },
  { id: 'mine', label: 'My sentences', icon: FiUsers },
] as const;

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

/* ---------------- Correct a sentence ---------------- */
const CorrectTab = ({ onCorrected }: { onCorrected: () => void }) => {
  const [language, setLanguage] = useState('en');
  const [sentence, setSentence] = useState<SentenceToCorrect | null>(null);
  const [loading, setLoading] = useState(true);
  const [correctedText, setCorrectedText] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();

  const load = useCallback(async (lang: string) => {
    try {
      setLoading(true);
      setError(null);
      const s = await fetchSentenceToCorrect(lang);
      setSentence(s);
      setCorrectedText('');
      setNote('');
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Could not load a sentence to correct');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(language);
  }, [language, load]);

  const submit = async () => {
    if (!sentence) return;
    try {
      setSubmitting(true);
      await submitCorrection(sentence.id, correctedText, note);
      toast({ title: 'Correction sent — thank you!', status: 'success', duration: 2500, position: 'top' });
      onCorrected();
      await load(language);
    } catch (err: any) {
      toast({ title: err?.response?.data?.error || 'Could not submit correction', status: 'error', duration: 3000, position: 'top' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Stack spacing={5}>
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

      {error && (
        <Alert status="error" borderRadius="xl">
          <AlertIcon />
          {error}
        </Alert>
      )}

      {loading ? (
        <Skeleton h="220px" borderRadius="2xl" />
      ) : !sentence ? (
        <Box bg={card} border="1px solid" borderColor={line} borderRadius="2xl" p={10} textAlign="center">
          <Icon as={FiCheckCircle} boxSize={8} color={sage} mb={2} />
          <Text color={inkSoft}>No sentences waiting for correction right now — check back soon!</Text>
        </Box>
      ) : (
        <Box bg="white" border="1px solid" borderColor={line} borderRadius="2xl" p={{ base: 5, md: 6 }}>
          <Text fontSize="xs" color={inkSoft} fontWeight="600" mb={2}>
            From @{sentence.user.username}
          </Text>
          <Text fontFamily={serif} fontSize="lg" color={ink} mb={4}>
            "{sentence.text}"
          </Text>
          <Stack spacing={3}>
            <Textarea
              placeholder="Write the corrected version..."
              value={correctedText}
              onChange={(e) => setCorrectedText(e.target.value)}
              borderColor={line}
              _focus={{ borderColor: ink, boxShadow: 'none' }}
              rows={2}
            />
            <Textarea
              placeholder="Optional note — what was off, and why (optional)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              borderColor={line}
              _focus={{ borderColor: ink, boxShadow: 'none' }}
              rows={2}
              fontSize="sm"
            />
            <Button
              alignSelf="flex-start"
              borderRadius="full"
              bg={ink}
              color="white"
              _hover={{ bg: '#463039' }}
              px={6}
              leftIcon={<FiSend />}
              isDisabled={!correctedText.trim()}
              isLoading={submitting}
              onClick={submit}
            >
              Send correction
            </Button>
          </Stack>
        </Box>
      )}
    </Stack>
  );
};

/* ---------------- My sentences ---------------- */
const MineTab = ({ refreshKey }: { refreshKey: number }) => {
  const [language, setLanguage] = useState('en');
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submissions, setSubmissions] = useState<MySubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setSubmissions(await fetchMySubmissions());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  const alreadySubmittedToday = submissions.some((s) => {
    const submittedDate = new Date(s.createdAt);
    const today = new Date();
    return submittedDate.toDateString() === today.toDateString();
  });

  const submit = async () => {
    try {
      setSubmitting(true);
      await submitSentence(language, text);
      setText('');
      toast({ title: 'Sentence submitted — someone will correct it soon.', status: 'success', duration: 2500, position: 'top' });
      await load();
    } catch (err: any) {
      toast({ title: err?.response?.data?.error || 'Could not submit sentence', status: 'error', duration: 3000, position: 'top' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Stack spacing={5}>
      <Box bg="white" border="1px solid" borderColor={line} borderRadius="2xl" p={{ base: 5, md: 6 }}>
        <Text fontFamily={serif} fontWeight="600" fontSize="lg" color={ink} mb={3}>
          Write a sentence in the language you're learning
        </Text>
        <HStack spacing={2} mb={3}>
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
              isDisabled={alreadySubmittedToday}
            >
              {l.label}
            </Button>
          ))}
        </HStack>
        {alreadySubmittedToday ? (
          <Text fontSize="sm" color={inkSoft}>
            You've already submitted a sentence today — come back tomorrow for another.
          </Text>
        ) : (
          <Stack spacing={3}>
            <Textarea
              placeholder="e.g. Yesterday I go to the market and I buy some fruits."
              value={text}
              onChange={(e) => setText(e.target.value)}
              borderColor={line}
              _focus={{ borderColor: ink, boxShadow: 'none' }}
              rows={2}
              maxLength={400}
            />
            <Button
              alignSelf="flex-start"
              borderRadius="full"
              bg={ink}
              color="white"
              _hover={{ bg: '#463039' }}
              px={6}
              leftIcon={<FiSend />}
              isDisabled={!text.trim()}
              isLoading={submitting}
              onClick={submit}
            >
              Submit for correction
            </Button>
          </Stack>
        )}
      </Box>

      {loading ? (
        <Skeleton h="120px" borderRadius="2xl" />
      ) : submissions.length === 0 ? (
        <Text fontSize="sm" color={inkSoft} textAlign="center">
          No submissions yet.
        </Text>
      ) : (
        <Stack spacing={3}>
          {submissions.map((s) => (
            <Box key={s.id} bg="white" border="1px solid" borderColor={line} borderRadius="xl" p={4}>
              <HStack justify="space-between" mb={2}>
                <Badge
                  bg={s.status === 'CORRECTED' ? sageTint : roseTint}
                  color={s.status === 'CORRECTED' ? sageDeep : roseDeep}
                  borderRadius="full"
                  px={3}
                  py={0.5}
                  fontSize="10px"
                >
                  <HStack spacing={1}>
                    <Icon as={s.status === 'CORRECTED' ? FiCheckCircle : FiClock} boxSize={2.5} />
                    <Text>{s.status === 'CORRECTED' ? 'CORRECTED' : 'PENDING'}</Text>
                  </HStack>
                </Badge>
                <Text fontSize="xs" color={inkSoft}>
                  {new Date(s.createdAt).toLocaleDateString()}
                </Text>
              </HStack>
              <Text color={ink} mb={s.correction ? 2 : 0}>
                "{s.text}"
              </Text>
              {s.correction && (
                <Box bg={sageTint} borderRadius="lg" p={3} mt={2}>
                  <Text fontSize="xs" color={sageDeep} fontWeight="600" mb={1}>
                    Corrected by @{s.correction.corrector.username}
                  </Text>
                  <Text color={ink} fontWeight="600">
                    "{s.correction.correctedText}"
                  </Text>
                  {s.correction.note && (
                    <Text fontSize="sm" color={inkSoft} mt={1}>
                      {s.correction.note}
                    </Text>
                  )}
                </Box>
              )}
            </Box>
          ))}
        </Stack>
      )}
    </Stack>
  );
};

/* ---------------- Community view ---------------- */
const CommunityView = () => {
  const [tab, setTab] = useState<(typeof TABS)[number]['id']>('correct');
  const [stats, setStats] = useState<CommunityStats | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const loadStats = useCallback(() => {
    fetchCommunityStats().then(setStats).catch(() => undefined);
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats, refreshKey]);

  return (
    <Stack spacing={5}>
      <Box>
        <Text fontFamily={serif} fontWeight="600" fontSize="2xl" color={ink}>
          Community
        </Text>
        <Text color={inkSoft} fontSize="sm" mt={1}>
          Submit one sentence a day, correct one from another learner — real feedback, no marketplace.
        </Text>
      </Box>

      {stats && (
        <SimpleGrid columns={3} spacing={3}>
          <StatPill label="Submitted" value={stats.submitted} />
          <StatPill label="Corrected by you" value={stats.corrected} />
          <StatPill label="Awaiting reply" value={stats.pendingReceived} />
        </SimpleGrid>
      )}

      <Flex gap={2} overflowX="auto" pb={1} sx={{ '&::-webkit-scrollbar': { display: 'none' }, scrollbarWidth: 'none' }}>
        {TABS.map((t) => {
          const active = t.id === tab;
          return (
            <HStack
              key={t.id}
              as="button"
              onClick={() => setTab(t.id)}
              spacing={2}
              px={4}
              py={2.5}
              borderRadius="full"
              flexShrink={0}
              bg={active ? ink : card}
              color={active ? 'white' : inkSoft}
              border="1px solid"
              borderColor={active ? ink : line}
              fontWeight="700"
              fontSize="sm"
              transition="all 0.15s ease"
              _hover={{ borderColor: ink }}
            >
              <Icon as={t.icon} boxSize={3.5} />
              <Text>{t.label}</Text>
            </HStack>
          );
        })}
      </Flex>

      {tab === 'correct' && <CorrectTab onCorrected={() => setRefreshKey((k) => k + 1)} />}
      {tab === 'mine' && <MineTab refreshKey={refreshKey} />}
    </Stack>
  );
};

export default CommunityView;
