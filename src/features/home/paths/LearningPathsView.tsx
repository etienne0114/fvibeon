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
  Progress,
  SimpleGrid,
  Skeleton,
  Stack,
  Text,
  useToast,
} from '@chakra-ui/react';
import { ArrowBackIcon, CheckIcon } from '@chakra-ui/icons';
import { FiMap, FiClock, FiBookOpen, FiCheckCircle } from 'react-icons/fi';
import { fetchPaths, fetchPath, enrollPath, PathSummary, PathDetail } from '../../../api/learn';
import { ink, inkSoft, rose, roseDeep, card, line, serif, sage, sageDeep, sageTint, roseTint } from '../../../theme/brand';

const levelColor = (level: string) => {
  const l = (level || '').toUpperCase();
  if (l === 'ADVANCED') return { bg: roseTint, color: roseDeep };
  if (l === 'INTERMEDIATE' || l === 'ELEMENTARY') return { bg: '#FBF0DC', color: '#B4823D' };
  return { bg: sageTint, color: sageDeep };
};

/* ---------------- Path detail ---------------- */
const PathDetailView = ({
  pathId,
  onBack,
  onOpenCourse,
}: {
  pathId: string;
  onBack: () => void;
  onOpenCourse: (courseId: string) => void;
}) => {
  const [path, setPath] = useState<PathDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const toast = useToast();

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchPath(pathId);
      setPath(data);
    } finally {
      setLoading(false);
    }
  }, [pathId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleEnroll = async () => {
    try {
      setEnrolling(true);
      await enrollPath(pathId);
      toast({ title: 'Enrolled in this path!', status: 'success', duration: 2000, position: 'top' });
      await load();
    } catch (err: any) {
      toast({ title: err?.response?.data?.error || 'Could not enroll', status: 'error', duration: 3000, position: 'top' });
    } finally {
      setEnrolling(false);
    }
  };

  if (loading && !path) {
    return (
      <Stack spacing={4}>
        <Skeleton h="120px" borderRadius="2xl" />
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} h="80px" borderRadius="xl" />
        ))}
      </Stack>
    );
  }
  if (!path) {
    return (
      <Alert status="error" borderRadius="xl">
        <AlertIcon />
        Learning path not found.
      </Alert>
    );
  }

  const enrolled = Boolean(path.enrollment);
  const lc = levelColor(path.difficulty);

  return (
    <Stack spacing={5}>
      <HStack>
        <Button size="sm" variant="ghost" leftIcon={<ArrowBackIcon />} color={inkSoft} onClick={onBack}>
          All paths
        </Button>
      </HStack>

      <Box bg={card} border="1px solid" borderColor={line} borderRadius="2xl" p={{ base: 5, md: 7 }}>
        <Flex justify="space-between" gap={4} wrap="wrap">
          <Box flex="1 1 320px">
            <Badge bg={lc.bg} color={lc.color} borderRadius="full" px={3} py={0.5} fontSize="10px" mb={2}>
              {path.difficulty}
            </Badge>
            <Text fontFamily={serif} fontWeight="600" fontSize={{ base: '2xl', md: '3xl' }} color={ink}>
              {path.title}
            </Text>
            <Text color={inkSoft} fontSize="sm" mt={2} maxW="560px" lineHeight="1.7">
              {path.description}
            </Text>
            <HStack spacing={4} mt={3} color={inkSoft} fontSize="xs">
              <HStack spacing={1}>
                <Icon as={FiBookOpen} boxSize={3} />
                <Text>{path.steps.length} courses</Text>
              </HStack>
              <HStack spacing={1}>
                <Icon as={FiClock} boxSize={3} />
                <Text>{path.estimatedDuration} min total</Text>
              </HStack>
            </HStack>
          </Box>
          <Stack justify="center" minW="180px">
            {enrolled ? (
              <Box>
                <Text fontSize="xs" color={inkSoft} mb={1}>
                  Your progress · {Math.round(path.enrollment?.progress ?? 0)}%
                </Text>
                <Progress
                  value={path.enrollment?.progress ?? 0}
                  size="sm"
                  borderRadius="full"
                  bg="rgba(194,69,96,0.15)"
                  sx={{ '& > div': { background: roseDeep } }}
                />
              </Box>
            ) : (
              <Button
                onClick={handleEnroll}
                isLoading={enrolling}
                borderRadius="full"
                bg={ink}
                color="white"
                h="46px"
                px={6}
                _hover={{ bg: '#463039' }}
              >
                Start this path
              </Button>
            )}
          </Stack>
        </Flex>
      </Box>

      <Stack spacing={3}>
        {path.steps.map((step, i) => (
          <Flex
            key={step.id}
            align="center"
            gap={4}
            bg="white"
            border="1px solid"
            borderColor={step.courseCompleted ? sage : line}
            borderRadius="xl"
            p={4}
          >
            <Circle size="36px" bg={step.courseCompleted ? sage : card} color={step.courseCompleted ? 'white' : inkSoft} flexShrink={0}>
              {step.courseCompleted ? <CheckIcon boxSize={3} /> : <Text fontWeight="700">{i + 1}</Text>}
            </Circle>
            <Box flex={1} minW={0}>
              <Text fontWeight="600" color={ink}>
                {step.title}
              </Text>
              <Text fontSize="sm" color={inkSoft} noOfLines={1}>
                {step.description}
              </Text>
              {enrolled && step.courseEnrolled && !step.courseCompleted && (
                <Progress
                  value={step.courseProgress}
                  size="xs"
                  borderRadius="full"
                  mt={2}
                  maxW="200px"
                  bg={card}
                  sx={{ '& > div': { bg: rose } }}
                />
              )}
            </Box>
            {step.courseId && (
              <Button
                size="sm"
                flexShrink={0}
                variant={step.courseCompleted ? 'outline' : 'solid'}
                borderColor={sage}
                color={step.courseCompleted ? sageDeep : 'white'}
                bg={step.courseCompleted ? 'transparent' : ink}
                _hover={{ bg: step.courseCompleted ? sageTint : '#463039' }}
                onClick={() => onOpenCourse(step.courseId!)}
              >
                {step.courseCompleted ? 'Review' : step.courseEnrolled ? 'Continue' : 'Start'}
              </Button>
            )}
          </Flex>
        ))}
      </Stack>
    </Stack>
  );
};

/* ---------------- Paths list ---------------- */
interface LearningPathsViewProps {
  openPathId?: string | null;
  onOpenPath: (id: string | null) => void;
  onOpenCourse: (courseId: string) => void;
}

const LearningPathsView = ({ openPathId, onOpenPath, onOpenCourse }: LearningPathsViewProps) => {
  const [paths, setPaths] = useState<PathSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (openPathId) return;
    fetchPaths()
      .then(setPaths)
      .catch((err) => setError(err?.response?.data?.error || 'Could not load learning paths'))
      .finally(() => setLoading(false));
  }, [openPathId]);

  if (openPathId) {
    return <PathDetailView pathId={openPathId} onBack={() => onOpenPath(null)} onOpenCourse={onOpenCourse} />;
  }

  return (
    <Stack spacing={5}>
      <Box>
        <Text fontFamily={serif} fontWeight="600" fontSize="2xl" color={ink}>
          Learning paths
        </Text>
        <Text color={inkSoft} fontSize="sm" mt={1}>
          Curated sequences of courses — the fastest route through a subject, in order.
        </Text>
      </Box>

      {error && (
        <Alert status="error" borderRadius="xl">
          <AlertIcon />
          {error}
        </Alert>
      )}

      {loading ? (
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
          {[1, 2].map((i) => (
            <Skeleton key={i} h="180px" borderRadius="2xl" />
          ))}
        </SimpleGrid>
      ) : paths.length === 0 ? (
        <Box bg={card} border="1px solid" borderColor={line} borderRadius="2xl" p={10} textAlign="center">
          <Icon as={FiMap} boxSize={8} color={inkSoft} mb={2} />
          <Text color={inkSoft}>No learning paths available yet.</Text>
        </Box>
      ) : (
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
          {paths.map((p) => {
            const lc = levelColor(p.difficulty);
            return (
              <Flex
                key={p.id}
                as="button"
                onClick={() => onOpenPath(p.id)}
                direction="column"
                textAlign="left"
                bg="white"
                border="1px solid"
                borderColor={line}
                borderRadius="2xl"
                p={5}
                _hover={{ transform: 'translateY(-2px)', boxShadow: '0 12px 24px rgba(46,31,38,0.08)' }}
                transition="all 0.15s ease"
              >
                <HStack spacing={2} mb={2}>
                  <Badge bg={lc.bg} color={lc.color} borderRadius="full" px={3} py={0.5} fontSize="10px">
                    {p.difficulty}
                  </Badge>
                  {p.enrollment?.status === 'COMPLETED' && (
                    <HStack spacing={1} color={sageDeep} fontSize="10px" fontWeight="700">
                      <Icon as={FiCheckCircle} boxSize={3} />
                      <Text>COMPLETED</Text>
                    </HStack>
                  )}
                </HStack>
                <Text fontFamily={serif} fontWeight="600" fontSize="lg" color={ink}>
                  {p.title}
                </Text>
                <Text fontSize="sm" color={inkSoft} noOfLines={2} mt={1} flex={1}>
                  {p.description}
                </Text>
                <HStack spacing={4} mt={3} color={inkSoft} fontSize="xs">
                  <HStack spacing={1}>
                    <Icon as={FiBookOpen} boxSize={3} />
                    <Text>{p._count.steps} courses</Text>
                  </HStack>
                  <HStack spacing={1}>
                    <Icon as={FiClock} boxSize={3} />
                    <Text>{p.estimatedDuration} min</Text>
                  </HStack>
                </HStack>
                {p.enrollment && (
                  <Progress
                    value={p.enrollment.progress}
                    size="xs"
                    borderRadius="full"
                    mt={3}
                    bg={card}
                    sx={{ '& > div': { bg: roseDeep } }}
                  />
                )}
              </Flex>
            );
          })}
        </SimpleGrid>
      )}
    </Stack>
  );
};

export default LearningPathsView;
