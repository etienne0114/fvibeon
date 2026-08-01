import { useEffect, useState } from 'react';
import {
  Alert,
  AlertIcon,
  Box,
  Button,
  HStack,
  Icon,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalOverlay,
  Progress,
  Skeleton,
  Stack,
  Text,
} from '@chakra-ui/react';
import { FiAward, FiArrowRight } from 'react-icons/fi';
import { fetchPlacementTest, submitPlacementTest, PlacementQuestion, PlacementResult } from '../../../api/learn';
import { ink, inkSoft, rose, roseDeep, card, line, serif, sage, sageDeep } from '../../../theme/brand';

const LEVEL_LABEL: Record<string, string> = {
  BEGINNER: 'Beginner',
  ELEMENTARY: 'Elementary',
  INTERMEDIATE: 'Intermediate',
  ADVANCED: 'Advanced',
};

const PlacementTestModal = ({
  isOpen,
  onClose,
  onComplete,
}: {
  isOpen: boolean;
  onClose: () => void;
  onComplete?: (level: string) => void;
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [questions, setQuestions] = useState<PlacementQuestion[]>([]);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string | number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<PlacementResult | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    setError(null);
    setStep(0);
    setAnswers({});
    setResult(null);
    fetchPlacementTest()
      .then(setQuestions)
      .catch((err) => setError(err?.response?.data?.error || 'Could not load the placement test'))
      .finally(() => setLoading(false));
  }, [isOpen]);

  const current = questions[step];
  const isLast = step === questions.length - 1;
  const answered = current ? answers[current.index] !== undefined && answers[current.index] !== '' : false;

  const submit = async () => {
    try {
      setSubmitting(true);
      setError(null);
      const ordered = questions.map((q) => answers[q.index] ?? '');
      const res = await submitPlacementTest(ordered);
      setResult(res);
      onComplete?.(res.recommendedLevel);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Could not submit the test');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" isCentered closeOnOverlayClick={!submitting}>
      <ModalOverlay />
      <ModalContent borderRadius="xl">
        <ModalCloseButton />
        <ModalBody py={10} px={{ base: 5, md: 8 }}>
          {loading && <Skeleton h="220px" borderRadius="lg" />}

          {!loading && error && !result && (
            <Alert status="error" borderRadius="lg">
              <AlertIcon />
              {error}
            </Alert>
          )}

          {!loading && !error && !result && current && (
            <Stack spacing={5}>
              <Box>
                <Text fontSize="xs" color={inkSoft} fontWeight="600" mb={2}>
                  Question {step + 1} of {questions.length}
                </Text>
                <Progress value={((step + 1) / questions.length) * 100} size="xs" borderRadius="full" bg={card} sx={{ '& > div': { bg: rose } }} />
              </Box>

              <Text fontFamily={serif} fontWeight="600" fontSize="lg" color={ink}>
                {current.question}
              </Text>

              {current.type === 'mc' ? (
                <Stack spacing={2}>
                  {current.options?.map((opt, i) => (
                    <Button
                      key={i}
                      justifyContent="flex-start"
                      variant="outline"
                      borderColor={answers[current.index] === i ? rose : line}
                      bg={answers[current.index] === i ? 'rgba(217,83,111,0.08)' : 'white'}
                      color={ink}
                      fontWeight="500"
                      onClick={() => setAnswers((prev) => ({ ...prev, [current.index]: i }))}
                      h="auto"
                      py={3}
                      whiteSpace="normal"
                      textAlign="left"
                    >
                      {opt}
                    </Button>
                  ))}
                </Stack>
              ) : (
                <Input
                  placeholder="Type your answer..."
                  value={(answers[current.index] as string) || ''}
                  onChange={(e) => setAnswers((prev) => ({ ...prev, [current.index]: e.target.value }))}
                  borderColor={line}
                  _focus={{ borderColor: ink, boxShadow: 'none' }}
                />
              )}

              {error && (
                <Text fontSize="sm" color={roseDeep}>
                  {error}
                </Text>
              )}

              <HStack justify="space-between">
                <Button
                  variant="ghost"
                  color={inkSoft}
                  isDisabled={step === 0}
                  onClick={() => setStep((s) => Math.max(0, s - 1))}
                >
                  Back
                </Button>
                {isLast ? (
                  <Button
                    bg={ink}
                    color="white"
                    _hover={{ bg: '#463039' }}
                    borderRadius="full"
                    px={6}
                    isDisabled={!answered}
                    isLoading={submitting}
                    onClick={submit}
                  >
                    See my level
                  </Button>
                ) : (
                  <Button
                    bg={ink}
                    color="white"
                    _hover={{ bg: '#463039' }}
                    borderRadius="full"
                    px={6}
                    rightIcon={<FiArrowRight />}
                    isDisabled={!answered}
                    onClick={() => setStep((s) => s + 1)}
                  >
                    Next
                  </Button>
                )}
              </HStack>
            </Stack>
          )}

          {result && (
            <Stack spacing={4} align="center" textAlign="center">
              <Icon as={FiAward} boxSize={10} color={sage} />
              <Text fontFamily={serif} fontWeight="700" fontSize="2xl" color={ink}>
                {result.score}/{result.total} correct
              </Text>
              <Box bg="rgba(127,169,155,0.12)" border="1px solid" borderColor={sage} borderRadius="xl" px={6} py={4}>
                <Text fontSize="xs" color={sageDeep} fontWeight="600" textTransform="uppercase" letterSpacing="0.05em">
                  Your level
                </Text>
                <Text fontFamily={serif} fontWeight="700" fontSize="xl" color={sageDeep}>
                  {LEVEL_LABEL[result.recommendedLevel] || result.recommendedLevel}
                </Text>
              </Box>
              <Text fontSize="sm" color={inkSoft}>
                Your proficiency level has been updated. Course recommendations will reflect it going forward.
              </Text>
              <Button bg={ink} color="white" _hover={{ bg: '#463039' }} borderRadius="full" px={8} onClick={onClose}>
                Done
              </Button>
            </Stack>
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default PlacementTestModal;
