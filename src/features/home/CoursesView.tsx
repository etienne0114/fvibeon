import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  AlertIcon,
  Badge,
  Box,
  Button,
  Circle,
  Flex,
  Grid,
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
import { FiBookOpen, FiClock, FiUsers, FiCheckCircle, FiChevronRight, FiVolume2 } from 'react-icons/fi';
import { fetchCourses, fetchCourse, enrollCourse, trackProgress } from '../../api/learn';
import {
  ink,
  inkSoft,
  rose,
  roseDeep,
  card,
  line,
  serif,
  sage,
  sageDeep,
  amberTint,
  amberDeep,
  roseTint,
  sageTint,
} from '../../theme/brand';

/* ---------------- types ---------------- */
interface CourseSummary {
  id: string;
  title: string;
  description: string;
  level: string;
  estimatedDuration: number;
  imageUrl?: string | null;
  _count?: { lessons: number; enrollments: number };
}

interface PhraseItem {
  target: string;
  translation: string;
  pronunciation?: string;
}

interface LessonSection {
  type: 'phrases' | 'tip';
  title: string;
  items?: PhraseItem[];
  body?: string;
}

interface LessonDetail {
  id: string;
  title: string;
  description: string;
  order: number;
  duration: number;
  content?: { intro?: string; sections?: LessonSection[] } | null;
  userStatus: string;
  userCompletion: number;
}

interface CourseDetail extends CourseSummary {
  lessons: LessonDetail[];
  enrollment: { progress: number; isCompleted: boolean } | null;
  _count?: { lessons: number; enrollments: number };
}

const levelColor = (level?: string) =>
  level === 'BEGINNER' ? { bg: sageTint, color: sageDeep } : level === 'INTERMEDIATE' ? { bg: amberTint, color: amberDeep } : { bg: roseTint, color: roseDeep };

/* ---------------- Lesson reader ---------------- */
const LessonReader = ({
  courseId,
  lesson,
  onBack,
  onCompleted,
}: {
  courseId: string;
  lesson: LessonDetail;
  onBack: () => void;
  onCompleted: () => void;
}) => {
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  const isDone = lesson.userStatus === 'COMPLETED';

  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(new SpeechSynthesisUtterance(text));
    }
  };

  const markComplete = async () => {
    try {
      setSaving(true);
      await trackProgress({
        courseId,
        lessonId: lesson.id,
        status: 'COMPLETED',
        completionPercentage: 100,
        timeSpentMinutes: lesson.duration,
      });
      toast({ title: 'Lesson completed! 🎉', status: 'success', duration: 2500, position: 'top' });
      onCompleted();
    } catch (err: any) {
      toast({ title: err?.response?.data?.error || 'Could not save progress', status: 'error', duration: 3000, position: 'top' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Stack spacing={5}>
      <HStack>
        <Button size="sm" variant="ghost" leftIcon={<ArrowBackIcon />} color={inkSoft} onClick={onBack}>
          Back to lessons
        </Button>
      </HStack>
      <Box>
        <Text fontSize="xs" fontWeight="700" letterSpacing="0.1em" color={rose}>
          LESSON {lesson.order} · {lesson.duration} MIN
        </Text>
        <Text fontFamily={serif} fontWeight="600" fontSize={{ base: '2xl', md: '3xl' }} color={ink} mt={1}>
          {lesson.title}
        </Text>
        {lesson.content?.intro && (
          <Text color={inkSoft} mt={2} lineHeight="1.8" maxW="640px">
            {lesson.content.intro}
          </Text>
        )}
      </Box>

      {(lesson.content?.sections || []).map((section, idx) => (
        <Box key={idx} bg="white" border="1px solid" borderColor={line} borderRadius="2xl" p={{ base: 4, md: 6 }}>
          <Text fontFamily={serif} fontWeight="600" fontSize="lg" color={ink} mb={4}>
            {section.title}
          </Text>
          {section.type === 'phrases' && section.items && (
            <Stack spacing={0} divider={<Box borderBottom="1px solid" borderColor={line} />}>
              {section.items.map((item, i) => (
                <Flex key={i} py={3} align="center" gap={3} wrap="wrap">
                  <Box flex="1 1 180px" minW="140px">
                    <Text fontWeight="700" color={ink}>
                      {item.target}
                    </Text>
                    {item.pronunciation && (
                      <Text fontSize="xs" color={inkSoft} fontStyle="italic">
                        {item.pronunciation}
                      </Text>
                    )}
                  </Box>
                  <Text flex="1 1 160px" fontSize="sm" color={inkSoft}>
                    {item.translation}
                  </Text>
                  <Circle
                    as="button"
                    size="32px"
                    bg={sageTint}
                    color={sageDeep}
                    onClick={() => speak(item.target)}
                    _hover={{ bg: sage, color: 'white' }}
                    transition="all 0.15s"
                    aria-label={`Listen to ${item.target}`}
                  >
                    <Icon as={FiVolume2} boxSize={3.5} />
                  </Circle>
                </Flex>
              ))}
            </Stack>
          )}
          {section.type === 'tip' && (
            <HStack bg={amberTint} borderRadius="xl" p={4} align="flex-start" spacing={3}>
              <Text fontSize="lg">💡</Text>
              <Text fontSize="sm" color={ink} lineHeight="1.7">
                {section.body}
              </Text>
            </HStack>
          )}
        </Box>
      ))}

      <Flex justify="flex-end" pt={2}>
        {isDone ? (
          <HStack color={sageDeep} fontWeight="700">
            <Icon as={FiCheckCircle} />
            <Text fontSize="sm">Completed</Text>
          </HStack>
        ) : (
          <Button
            onClick={markComplete}
            isLoading={saving}
            borderRadius="full"
            bg={ink}
            color="white"
            px={7}
            h="46px"
            _hover={{ bg: '#463039' }}
            leftIcon={<CheckIcon boxSize={3} />}
          >
            Mark lesson complete
          </Button>
        )}
      </Flex>
    </Stack>
  );
};

/* ---------------- Course detail ---------------- */
const CourseDetailView = ({
  courseId,
  onBack,
  onDataChanged,
}: {
  courseId: string;
  onBack: () => void;
  onDataChanged: () => void;
}) => {
  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [activeLesson, setActiveLesson] = useState<LessonDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const toast = useToast();

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetchCourse(courseId);
      setCourse(response.data);
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleEnroll = async () => {
    try {
      setEnrolling(true);
      await enrollCourse(courseId);
      toast({ title: 'Enrolled! Your progress starts now.', status: 'success', duration: 2500, position: 'top' });
      await load();
      onDataChanged();
    } catch (err: any) {
      toast({ title: err?.response?.data?.error || 'Could not enroll', status: 'error', duration: 3000, position: 'top' });
    } finally {
      setEnrolling(false);
    }
  };

  if (loading && !course) {
    return (
      <Stack spacing={4}>
        <Skeleton h="120px" borderRadius="2xl" />
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} h="64px" borderRadius="xl" />
        ))}
      </Stack>
    );
  }
  if (!course) {
    return (
      <Alert status="error" borderRadius="xl">
        <AlertIcon />
        Course not found.
      </Alert>
    );
  }

  if (activeLesson) {
    return (
      <LessonReader
        courseId={course.id}
        lesson={activeLesson}
        onBack={() => setActiveLesson(null)}
        onCompleted={async () => {
          await load();
          onDataChanged();
          setActiveLesson(null);
        }}
      />
    );
  }

  const enrolled = Boolean(course.enrollment);
  const lc = levelColor(course.level);

  return (
    <Stack spacing={5}>
      <HStack>
        <Button size="sm" variant="ghost" leftIcon={<ArrowBackIcon />} color={inkSoft} onClick={onBack}>
          All courses
        </Button>
      </HStack>

      {/* Header */}
      <Box bg={card} border="1px solid" borderColor={line} borderRadius="2xl" p={{ base: 5, md: 7 }}>
        <Flex justify="space-between" gap={4} wrap="wrap">
          <Box flex="1 1 320px">
            <HStack spacing={2} mb={2}>
              <Badge bg={lc.bg} color={lc.color} borderRadius="full" px={3} py={0.5} fontSize="10px">
                {course.level}
              </Badge>
              <HStack spacing={1} color={inkSoft} fontSize="xs">
                <Icon as={FiUsers} boxSize={3} />
                <Text>{course._count?.enrollments ?? 0} learners</Text>
              </HStack>
            </HStack>
            <Text fontFamily={serif} fontWeight="600" fontSize={{ base: '2xl', md: '3xl' }} color={ink}>
              {course.title}
            </Text>
            <Text color={inkSoft} fontSize="sm" mt={2} maxW="560px" lineHeight="1.7">
              {course.description}
            </Text>
            <HStack spacing={4} mt={3} color={inkSoft} fontSize="xs">
              <HStack spacing={1}>
                <Icon as={FiBookOpen} boxSize={3} />
                <Text>{course.lessons.length} lessons</Text>
              </HStack>
              <HStack spacing={1}>
                <Icon as={FiClock} boxSize={3} />
                <Text>{course.estimatedDuration} min total</Text>
              </HStack>
            </HStack>
          </Box>
          <Stack justify="center" minW="180px">
            {enrolled ? (
              <Box>
                <Text fontSize="xs" color={inkSoft} mb={1}>
                  Your progress · {Math.round(course.enrollment?.progress ?? 0)}%
                </Text>
                <Progress
                  value={course.enrollment?.progress ?? 0}
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
                Enroll — it's free
              </Button>
            )}
          </Stack>
        </Flex>
      </Box>

      {/* Lessons */}
      <Stack spacing={3}>
        {course.lessons.map((lesson) => {
          const done = lesson.userStatus === 'COMPLETED';
          return (
            <Flex
              key={lesson.id}
              as="button"
              onClick={() => enrolled && setActiveLesson(lesson)}
              textAlign="left"
              align="center"
              gap={4}
              bg="white"
              border="1px solid"
              borderColor={line}
              borderRadius="xl"
              p={4}
              opacity={enrolled ? 1 : 0.6}
              cursor={enrolled ? 'pointer' : 'not-allowed'}
              _hover={enrolled ? { transform: 'translateY(-1px)', boxShadow: '0 8px 16px rgba(46,31,38,0.07)' } : {}}
              transition="all 0.15s ease"
            >
              <Circle size="38px" bg={done ? sage : roseTint} color={done ? 'white' : rose} fontWeight="700" fontSize="sm">
                {done ? <CheckIcon boxSize={3} /> : lesson.order}
              </Circle>
              <Box flex={1} minW={0}>
                <Text fontSize="sm" fontWeight="700" color={ink} noOfLines={1}>
                  {lesson.title}
                </Text>
                <Text fontSize="xs" color={inkSoft} noOfLines={1}>
                  {lesson.description}
                </Text>
              </Box>
              <HStack spacing={3} flexShrink={0}>
                <Text fontSize="xs" color={inkSoft} display={{ base: 'none', sm: 'block' }}>
                  {lesson.duration} min
                </Text>
                {enrolled && <Icon as={FiChevronRight} color={inkSoft} />}
              </HStack>
            </Flex>
          );
        })}
      </Stack>
      {!enrolled && (
        <Text fontSize="xs" color={inkSoft} textAlign="center">
          Enroll to unlock the lessons.
        </Text>
      )}
    </Stack>
  );
};

/* ---------------- Courses grid ---------------- */
interface CoursesViewProps {
  openCourseId?: string | null;
  onOpenCourse: (id: string | null) => void;
  onDataChanged: () => void;
}

const CoursesView = ({ openCourseId, onOpenCourse, onDataChanged }: CoursesViewProps) => {
  const [courses, setCourses] = useState<CourseSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const response = await fetchCourses({ limit: 30 });
        if (!cancelled) setCourses(response.courses ?? []);
      } catch (err: any) {
        if (!cancelled) setError(err?.response?.data?.error || 'Failed to load courses');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (openCourseId) {
    return <CourseDetailView courseId={openCourseId} onBack={() => onOpenCourse(null)} onDataChanged={onDataChanged} />;
  }

  if (loading) {
    return (
      <SimpleGrid columns={{ base: 1, sm: 2, xl: 3 }} spacing={5}>
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} h="240px" borderRadius="2xl" />
        ))}
      </SimpleGrid>
    );
  }

  return (
    <Stack spacing={5}>
      {error && (
        <Alert status="error" borderRadius="xl" fontSize="sm">
          <AlertIcon />
          {error}
        </Alert>
      )}
      <SimpleGrid columns={{ base: 1, sm: 2, xl: 3 }} spacing={5}>
        {courses.map((course) => {
          const lc = levelColor(course.level);
          return (
            <Flex
              key={course.id}
              direction="column"
              bg={card}
              border="1px solid"
              borderColor={line}
              borderRadius="2xl"
              overflow="hidden"
              transition="all 0.2s ease"
              _hover={{ transform: 'translateY(-4px)', boxShadow: '0 16px 32px rgba(46,31,38,0.1)' }}
            >
              {course.imageUrl && (
                <Box h="120px" bgImage={`url(${course.imageUrl})`} bgSize="cover" bgPosition="center" />
              )}
              <Stack p={5} spacing={3} flex={1}>
                <HStack>
                  <Badge bg={lc.bg} color={lc.color} borderRadius="full" px={3} py={0.5} fontSize="10px">
                    {course.level}
                  </Badge>
                </HStack>
                <Text fontFamily={serif} fontWeight="600" fontSize="xl" color={ink}>
                  {course.title}
                </Text>
                <Text fontSize="sm" color={inkSoft} noOfLines={2} lineHeight="1.6" flex={1}>
                  {course.description}
                </Text>
                <HStack spacing={4} color={inkSoft} fontSize="xs">
                  <HStack spacing={1}>
                    <Icon as={FiBookOpen} boxSize={3} />
                    <Text>{course._count?.lessons ?? 0} lessons</Text>
                  </HStack>
                  <HStack spacing={1}>
                    <Icon as={FiClock} boxSize={3} />
                    <Text>{course.estimatedDuration} min</Text>
                  </HStack>
                  <HStack spacing={1}>
                    <Icon as={FiUsers} boxSize={3} />
                    <Text>{course._count?.enrollments ?? 0}</Text>
                  </HStack>
                </HStack>
                <Button
                  onClick={() => onOpenCourse(course.id)}
                  borderRadius="full"
                  bg={ink}
                  color="white"
                  size="sm"
                  h="40px"
                  _hover={{ bg: '#463039' }}
                >
                  View course
                </Button>
              </Stack>
            </Flex>
          );
        })}
      </SimpleGrid>
    </Stack>
  );
};

export default CoursesView;
