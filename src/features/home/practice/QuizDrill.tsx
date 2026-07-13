import { useEffect, useState } from 'react';
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
  Input,
  Skeleton,
  Stack,
  Text,
  Wrap,
  WrapItem,
} from '@chakra-ui/react';
import { CheckIcon, CloseIcon } from '@chakra-ui/icons';
import { FiClock } from 'react-icons/fi';
import {
  generateQuiz,
  submitQuizAnswer,
  fetchQuizHistory,
  QuizPayload,
  QuizResult,
  QuizHistoryItem,
} from '../../../api/practice';
import { ink, inkSoft, rose, roseDeep, card, line, serif, sage, sageDeep, roseTint, sageTint, amberTint, amberDeep } from '../../../theme/brand';

const SUGGESTED_TOPICS = ['Kinyarwanda greetings', 'English past tense', 'French numbers', 'Everyday travel phrases'];

const QuizDrill = () => {
  const [topic, setTopic] = useState('');
  const [quiz, setQuiz] = useState<QuizPayload | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<QuizResult | null>(null);
  const [history, setHistory] = useState<QuizHistoryItem[]>([]);
  const [generating, setGenerating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchQuizHistory(5)
      .then(setHistory)
      .catch(() => undefined);
  }, []);

  const handleGenerate = async (chosenTopic?: string) => {
    const t = chosenTopic ?? topic;
    if (!t.trim()) return;
    try {
      setGenerating(true);
      setError(null);
      setResult(null);
      setAnswers({});
      const payload = await generateQuiz(t.trim(), 'en', 5);
      setQuiz(payload);
      setTopic(t);
    } catch (err: any) {
      setError(err?.friendlyMessage || err?.response?.data?.error || 'Could not generate quiz');
    } finally {
      setGenerating(false);
    }
  };

  const handleSubmit = async () => {
    if (!quiz) return;
    try {
      setSubmitting(true);
      const payload = Object.entries(answers).map(([questionId, selectedAnswer]) => ({ questionId, selectedAnswer }));
      const res = await submitQuizAnswer(quiz.quizId, payload);
      setResult(res);
      fetchQuizHistory(5).then(setHistory).catch(() => undefined);
    } catch (err: any) {
      setError(err?.friendlyMessage || err?.response?.data?.error || 'Could not submit quiz');
    } finally {
      setSubmitting(false);
    }
  };

  const allAnswered = quiz ? quiz.questions.every((q) => answers[q.id]) : false;

  return (
    <Stack spacing={5}>
      {error && (
        <Alert status="error" borderRadius="xl" fontSize="sm">
          <AlertIcon />
          {error}
        </Alert>
      )}

      {!quiz && (
        <Box bg={card} border="1px solid" borderColor={line} borderRadius="2xl" p={{ base: 5, md: 7 }}>
          <Text fontFamily={serif} fontWeight="600" fontSize="xl" color={ink} mb={1}>
            What do you want to be quizzed on?
          </Text>
          <Text fontSize="sm" color={inkSoft} mb={4}>
            Your AI tutor will build 5 fresh questions on any topic.
          </Text>
          <HStack mb={4}>
            <Input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Kinyarwanda greetings"
              bg="white"
              border="1px solid"
              borderColor={line}
              borderRadius="xl"
              h="46px"
              _focus={{ borderColor: rose, boxShadow: `0 0 0 1px ${rose}` }}
              onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
            />
            <Button
              onClick={() => handleGenerate()}
              isLoading={generating}
              isDisabled={!topic.trim()}
              borderRadius="full"
              bg={ink}
              color="white"
              _hover={{ bg: '#463039' }}
              px={6}
              h="46px"
              flexShrink={0}
            >
              Generate
            </Button>
          </HStack>
          <Wrap spacing={2}>
            {SUGGESTED_TOPICS.map((t) => (
              <WrapItem key={t}>
                <Button
                  size="sm"
                  variant="outline"
                  borderColor={line}
                  color={inkSoft}
                  borderRadius="full"
                  isLoading={generating && topic === t}
                  onClick={() => handleGenerate(t)}
                >
                  {t}
                </Button>
              </WrapItem>
            ))}
          </Wrap>
        </Box>
      )}

      {generating && <Skeleton h="320px" borderRadius="2xl" />}

      {quiz && !result && !generating && (
        <Stack spacing={4}>
          <Flex justify="space-between" align="center">
            <Text fontFamily={serif} fontWeight="600" fontSize="lg" color={ink}>
              {quiz.title}
            </Text>
            <Button size="xs" variant="ghost" color={inkSoft} onClick={() => setQuiz(null)}>
              New topic
            </Button>
          </Flex>
          {quiz.questions.map((q, i) => (
            <Box key={q.id} bg="white" border="1px solid" borderColor={line} borderRadius="xl" p={5}>
              <Text fontWeight="700" color={ink} mb={3}>
                {i + 1}. {q.text}
              </Text>
              <Stack spacing={2}>
                {q.options.map((opt) => {
                  const selected = answers[q.id] === opt;
                  return (
                    <HStack
                      key={opt}
                      as="button"
                      onClick={() => setAnswers((prev) => ({ ...prev, [q.id]: opt }))}
                      bg={selected ? roseTint : card}
                      border="1px solid"
                      borderColor={selected ? rose : line}
                      borderRadius="lg"
                      px={4}
                      py={2.5}
                      textAlign="left"
                      transition="all 0.15s"
                    >
                      <Circle size="18px" border="2px solid" borderColor={selected ? rose : line} bg={selected ? rose : 'transparent'} flexShrink={0} />
                      <Text fontSize="sm" color={ink}>
                        {opt}
                      </Text>
                    </HStack>
                  );
                })}
              </Stack>
            </Box>
          ))}
          <Button
            onClick={handleSubmit}
            isLoading={submitting}
            isDisabled={!allAnswered}
            borderRadius="full"
            bg={ink}
            color="white"
            _hover={{ bg: '#463039' }}
            h="48px"
          >
            Submit answers
          </Button>
        </Stack>
      )}

      {result && (
        <Stack spacing={4}>
          <Box bg={result.passed ? sageTint : amberTint} borderRadius="2xl" p={6} textAlign="center">
            <Text fontFamily={serif} fontWeight="700" fontSize="3xl" color={ink}>
              {result.percentage}%
            </Text>
            <Text fontSize="sm" color={inkSoft} mt={1}>
              {result.score}/{result.maxScore} correct · {result.passed ? 'Passed!' : `Needs ${result.passingScore}% to pass`}
            </Text>
          </Box>
          {result.results.map((r, i) => (
            <Box key={r.questionId} bg="white" border="1px solid" borderColor={line} borderRadius="xl" p={5}>
              <HStack align="flex-start" spacing={3}>
                <Circle size="24px" bg={r.correct ? sage : rose} color="white" flexShrink={0} mt={0.5}>
                  <Icon as={r.correct ? CheckIcon : CloseIcon} boxSize={2.5} />
                </Circle>
                <Box flex={1}>
                  <Text fontWeight="700" color={ink} mb={1}>
                    {i + 1}. {r.question}
                  </Text>
                  <Text fontSize="sm" color={r.correct ? sageDeep : roseDeep}>
                    Your answer: {r.selectedAnswer || '—'}
                  </Text>
                  {!r.correct && (
                    <Text fontSize="sm" color={sageDeep}>
                      Correct: {r.correctAnswer}
                    </Text>
                  )}
                  {r.explanation && (
                    <Text fontSize="xs" color={inkSoft} mt={1}>
                      {r.explanation}
                    </Text>
                  )}
                </Box>
              </HStack>
            </Box>
          ))}
          <Button onClick={() => { setQuiz(null); setResult(null); setTopic(''); }} borderRadius="full" bg={ink} color="white" _hover={{ bg: '#463039' }} h="46px">
            Try another topic
          </Button>
        </Stack>
      )}

      {history.length > 0 && !quiz && (
        <Box>
          <Text fontFamily={serif} fontWeight="600" fontSize="md" color={ink} mb={3}>
            Recent quizzes
          </Text>
          <Stack spacing={2}>
            {history.map((h) => (
              <HStack key={h.id} justify="space-between" bg={card} borderRadius="lg" px={4} py={3}>
                <Text fontSize="sm" color={ink} fontWeight="600" noOfLines={1}>
                  {h.quizTitle}
                </Text>
                <HStack spacing={3} flexShrink={0}>
                  <HStack spacing={1} color={inkSoft} fontSize="xs">
                    <Icon as={FiClock} boxSize={3} />
                    <Text>{new Date(h.completedAt).toLocaleDateString()}</Text>
                  </HStack>
                  <Badge bg={h.passed ? sageTint : amberTint} color={h.passed ? sageDeep : amberDeep} borderRadius="full" px={2.5}>
                    {h.score}%
                  </Badge>
                </HStack>
              </HStack>
            ))}
          </Stack>
        </Box>
      )}
    </Stack>
  );
};

export default QuizDrill;
