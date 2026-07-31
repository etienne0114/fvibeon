import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
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
  Input,
  Progress,
  SimpleGrid,
  Skeleton,
  Stack,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  useToast,
} from '@chakra-ui/react';
import { ArrowBackIcon, CheckIcon, CloseIcon } from '@chakra-ui/icons';
import { FiBookOpen, FiClock, FiUsers, FiCheckCircle, FiChevronRight, FiVolume2, FiAlertTriangle, FiAward } from 'react-icons/fi';
import { fetchCourses, fetchCourse, enrollCourse, trackProgress } from '../../api/learn';
import { useMe } from '../../hooks/useMe';
import CertificateModal from '../certificates/CertificateModal';
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

interface StructureItem {
  label: string;
  pattern: string;
  example: string;
}

interface PracticeQuestion {
  // Omitted type defaults to 'mc' — every question written before this
  // field existed is still valid multiple-choice content.
  type?: 'mc' | 'fill';
  question: string;
  // mc
  options?: string[];
  correctIndex?: number;
  // fill
  answer?: string;
  acceptableAnswers?: string[];
  explanation?: string;
}

interface LessonSection {
  type: 'phrases' | 'tip' | 'rule' | 'structure' | 'table' | 'practice';
  title: string;
  // phrases
  items?: PhraseItem[];
  // tip
  body?: string;
  variant?: 'info' | 'warning';
  // rule
  points?: string[];
  // structure
  structureItems?: StructureItem[];
  // table
  headers?: string[];
  rows?: string[][];
  // practice
  questions?: PracticeQuestion[];
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

interface LessonGroup {
  key: string;
  label: string;
  lessons: LessonDetail[];
}

// Lessons are grouped by the part of the title before " — " (e.g. "Present
// Simple Tense — Beginner" / "— Elementary" / ...), so a course with many
// leveled lessons per tense reads as tidy sections instead of one long
// flat numbered list. A lesson with no " — " (like a comparison capstone)
// becomes its own single-lesson group.
const groupLessonsByTense = (lessons: LessonDetail[]): LessonGroup[] => {
  const groups: LessonGroup[] = [];
  for (const lesson of lessons) {
    const [base] = lesson.title.split(' — ');
    let group = groups.find((g) => g.key === base);
    if (!group) {
      group = { key: base, label: base, lessons: [] };
      groups.push(group);
    }
    group.lessons.push(lesson);
  }
  return groups;
};

const LessonRow = ({ lesson, enrolled, onOpen }: { lesson: LessonDetail; enrolled: boolean; onOpen: () => void }) => {
  const done = lesson.userStatus === 'COMPLETED';
  return (
    <Flex
      as="button"
      onClick={() => enrolled && onOpen()}
      textAlign="left"
      align="center"
      gap={4}
      bg="white"
      border="1px solid"
      borderColor={line}
      borderRadius="xl"
      p={4}
      w="full"
      opacity={enrolled ? 1 : 0.6}
      cursor={enrolled ? 'pointer' : 'not-allowed'}
      _hover={enrolled ? { transform: 'translateY(-1px)', boxShadow: '0 8px 16px rgba(46,31,38,0.07)' } : {}}
      transition="all 0.15s ease"
    >
      <Circle size="38px" bg={done ? sage : roseTint} color={done ? 'white' : rose} fontWeight="700" fontSize="sm" flexShrink={0}>
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
};

/* ---------------- Interactive practice block ---------------- */
// Immediate, per-question feedback (not a delayed batch report) — this is
// embedded IN a lesson to reinforce what was just read, not a formal
// graded assessment like the Practice section's Quiz mode.
interface PracticeAnswer {
  value: string | number;
  correct: boolean;
}

const normalizeFillAnswer = (s: string) =>
  s
    .trim()
    .toLowerCase()
    .replace(/[.!?]+$/, '');

const PracticeBlock = ({ questions }: { questions: PracticeQuestion[] }) => {
  const [answers, setAnswers] = useState<Record<number, PracticeAnswer>>({});
  const [drafts, setDrafts] = useState<Record<number, string>>({});

  const answeredCount = Object.keys(answers).length;
  const correctCount = Object.values(answers).filter((a) => a.correct).length;
  const allAnswered = questions.length > 0 && answeredCount === questions.length;

  const selectOption = (qIdx: number, optIdx: number, q: PracticeQuestion) => {
    if (answers[qIdx]) return;
    setAnswers((prev) => ({ ...prev, [qIdx]: { value: optIdx, correct: optIdx === q.correctIndex } }));
  };

  const submitFill = (qIdx: number, q: PracticeQuestion) => {
    const typed = drafts[qIdx] || '';
    if (!typed.trim()) return;
    const accepted = [q.answer, ...(q.acceptableAnswers || [])].filter(Boolean).map((a) => normalizeFillAnswer(a as string));
    const correct = accepted.includes(normalizeFillAnswer(typed));
    setAnswers((prev) => ({ ...prev, [qIdx]: { value: typed, correct } }));
  };

  const retryQuestion = (qIdx: number) => {
    setAnswers((prev) => {
      const next = { ...prev };
      delete next[qIdx];
      return next;
    });
    setDrafts((prev) => ({ ...prev, [qIdx]: '' }));
  };

  const resetAll = () => {
    setAnswers({});
    setDrafts({});
  };

  return (
    <Stack spacing={4}>
      {questions.length > 1 && (
        <Flex justify="space-between" align="center" fontSize="xs" color={inkSoft} fontWeight="600">
          <Text>{answeredCount}/{questions.length} answered</Text>
          {answeredCount > 0 && <Text>{correctCount}/{answeredCount} correct so far</Text>}
        </Flex>
      )}
      {questions.map((q, qIdx) => {
        const type = q.type || 'mc';
        const result = answers[qIdx];
        const answered = Boolean(result);
        return (
          <Box key={qIdx} bg={card} border="1px solid" borderColor={line} borderRadius="xl" p={4}>
            <Text fontWeight="600" color={ink} mb={3} fontSize="sm">
              {qIdx + 1}. {q.question}
            </Text>
            {type === 'fill' ? (
              <Stack spacing={2}>
                <HStack>
                  <Input
                    size="sm"
                    bg="white"
                    isDisabled={answered}
                    value={answered ? String(result.value) : drafts[qIdx] || ''}
                    onChange={(e) => setDrafts((prev) => ({ ...prev, [qIdx]: e.target.value }))}
                    onKeyDown={(e) => e.key === 'Enter' && !answered && submitFill(qIdx, q)}
                    placeholder="Type your answer..."
                    borderColor={answered ? (result.correct ? sage : rose) : line}
                    _focus={{ borderColor: ink, boxShadow: 'none' }}
                  />
                  {!answered && (
                    <Button size="sm" flexShrink={0} bg={ink} color="white" _hover={{ bg: '#463039' }} onClick={() => submitFill(qIdx, q)}>
                      Check
                    </Button>
                  )}
                </HStack>
                {answered && !result.correct && (
                  <Text fontSize="xs" color={roseDeep}>
                    Correct answer: <Text as="span" fontWeight="700">{q.answer}</Text>
                  </Text>
                )}
              </Stack>
            ) : (
              <Stack spacing={2}>
                {(q.options || []).map((opt, optIdx) => {
                  const isSelected = answered && result.value === optIdx;
                  const revealCorrect = answered && optIdx === q.correctIndex;
                  const revealWrong = answered && isSelected && !result.correct;
                  return (
                    <HStack
                      key={optIdx}
                      as="button"
                      type="button"
                      disabled={answered}
                      onClick={() => selectOption(qIdx, optIdx, q)}
                      px={4}
                      py={2.5}
                      borderRadius="lg"
                      border="1px solid"
                      borderColor={revealCorrect ? sage : revealWrong ? rose : line}
                      bg={revealCorrect ? sageTint : revealWrong ? roseTint : 'white'}
                      cursor={answered ? 'default' : 'pointer'}
                      textAlign="left"
                      w="full"
                      _hover={!answered ? { borderColor: ink } : undefined}
                    >
                      {answered && (revealCorrect || revealWrong) && (
                        <Icon as={revealCorrect ? CheckIcon : CloseIcon} boxSize={2.5} color={revealCorrect ? sageDeep : roseDeep} />
                      )}
                      <Text fontSize="sm" color={revealCorrect ? sageDeep : revealWrong ? roseDeep : ink} fontWeight={revealCorrect ? '700' : '500'}>
                        {opt}
                      </Text>
                    </HStack>
                  );
                })}
              </Stack>
            )}
            {answered && q.explanation && (
              <HStack mt={3} spacing={2} align="flex-start" bg="white" borderRadius="lg" p={3}>
                <Text fontSize="sm">{result.correct ? '✅' : '💡'}</Text>
                <Text fontSize="xs" color={inkSoft} lineHeight="1.7">
                  {q.explanation}
                </Text>
              </HStack>
            )}
            {answered && (
              <Button size="xs" variant="ghost" mt={2} color={inkSoft} onClick={() => retryQuestion(qIdx)}>
                Try again
              </Button>
            )}
          </Box>
        );
      })}
      {allAnswered && questions.length > 1 && (
        <Box bg={correctCount === questions.length ? sageTint : amberTint} borderRadius="xl" p={4} textAlign="center">
          <Text fontWeight="700" color={ink}>
            {correctCount}/{questions.length} correct{correctCount === questions.length ? ' 🎉' : ''}
          </Text>
          <Button size="sm" mt={2} variant="outline" borderColor={line} color={inkSoft} _hover={{ borderColor: ink, color: ink }} onClick={resetAll}>
            Reset practice
          </Button>
        </Box>
      )}
    </Stack>
  );
};

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
            <HStack bg={section.variant === 'warning' ? roseTint : amberTint} borderRadius="xl" p={4} align="flex-start" spacing={3}>
              {section.variant === 'warning' ? (
                <Icon as={FiAlertTriangle} boxSize={4} color={roseDeep} mt={0.5} flexShrink={0} />
              ) : (
                <Text fontSize="lg">💡</Text>
              )}
              <Text fontSize="sm" color={ink} lineHeight="1.7">
                {section.body}
              </Text>
            </HStack>
          )}
          {section.type === 'rule' && section.points && (
            <Stack spacing={2.5}>
              {section.points.map((p, i) => (
                <HStack key={i} align="flex-start" spacing={3}>
                  <Circle size="6px" bg={rose} mt="7px" flexShrink={0} />
                  <Text fontSize="sm" color={ink} lineHeight="1.7">
                    {p}
                  </Text>
                </HStack>
              ))}
            </Stack>
          )}
          {section.type === 'structure' && section.structureItems && (
            <Stack spacing={3}>
              {section.structureItems.map((s, i) => (
                <Box key={i} bg={card} borderRadius="xl" p={4}>
                  <Badge bg={roseTint} color={roseDeep} borderRadius="full" px={2.5} py={0.5} fontSize="10px" mb={2}>
                    {s.label}
                  </Badge>
                  <Text fontSize="sm" fontWeight="700" color={ink} fontFamily="mono" mb={1}>
                    {s.pattern}
                  </Text>
                  <Text fontSize="sm" color={inkSoft} fontStyle="italic">
                    {s.example}
                  </Text>
                </Box>
              ))}
            </Stack>
          )}
          {section.type === 'table' && section.headers && section.rows && (
            <Box overflowX="auto">
              <Table size="sm">
                <Thead>
                  <Tr>
                    {section.headers.map((h, i) => (
                      <Th key={i} color={inkSoft} borderColor={line} fontSize="10px">
                        {h}
                      </Th>
                    ))}
                  </Tr>
                </Thead>
                <Tbody>
                  {section.rows.map((row, i) => (
                    <Tr key={i}>
                      {row.map((cell, j) => (
                        <Td key={j} color={ink} borderColor={line} fontSize="sm">
                          {cell}
                        </Td>
                      ))}
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </Box>
          )}
          {section.type === 'practice' && section.questions && <PracticeBlock questions={section.questions} />}
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
  const [showCertificate, setShowCertificate] = useState(false);
  const toast = useToast();
  const { user } = useMe();
  const recipientName = user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : user?.username || 'Learner';
  // Computed unconditionally (before any early return below) — hooks can't
  // be called only on some renders, so this can't wait until after the
  // "!course" / "activeLesson" guards.
  const lessonGroups = useMemo(() => groupLessonsByTense(course?.lessons || []), [course]);

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
        key={activeLesson.id}
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
                {course.enrollment?.isCompleted && (
                  <Button
                    mt={3}
                    size="sm"
                    w="full"
                    borderRadius="full"
                    bg={ink}
                    color="white"
                    leftIcon={<FiAward />}
                    _hover={{ bg: '#463039' }}
                    onClick={() => setShowCertificate(true)}
                  >
                    Get certificate
                  </Button>
                )}
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

      {/* Lessons — grouped by tense into collapsible sections instead of
          one long flat numbered list */}
      <Stack spacing={3}>
        {lessonGroups.map((group) => {
          if (group.lessons.length === 1) {
            return <LessonRow key={group.key} lesson={group.lessons[0]} enrolled={enrolled} onOpen={() => setActiveLesson(group.lessons[0])} />;
          }
          const completedInGroup = group.lessons.filter((l) => l.userStatus === 'COMPLETED').length;
          return (
            <Accordion key={group.key} allowToggle defaultIndex={0}>
              <AccordionItem border="none">
                <AccordionButton bg={card} borderRadius="lg" px={4} py={3} _hover={{ bg: card }}>
                  <HStack flex={1} justify="space-between" pr={2}>
                    <Text fontFamily={serif} fontWeight="600" color={ink} fontSize="sm" textAlign="left">
                      {group.label}
                    </Text>
                    <Badge
                      bg={completedInGroup === group.lessons.length ? sageTint : 'white'}
                      color={completedInGroup === group.lessons.length ? sageDeep : inkSoft}
                      border="1px solid"
                      borderColor={line}
                      borderRadius="full"
                      px={2}
                      fontSize="10px"
                    >
                      {completedInGroup}/{group.lessons.length}
                    </Badge>
                  </HStack>
                  <AccordionIcon color={inkSoft} />
                </AccordionButton>
                <AccordionPanel pt={3} pb={0} px={0}>
                  <Stack spacing={2}>
                    {group.lessons.map((lesson) => (
                      <LessonRow key={lesson.id} lesson={lesson} enrolled={enrolled} onOpen={() => setActiveLesson(lesson)} />
                    ))}
                  </Stack>
                </AccordionPanel>
              </AccordionItem>
            </Accordion>
          );
        })}
      </Stack>
      {!enrolled && (
        <Text fontSize="xs" color={inkSoft} textAlign="center">
          Enroll to unlock the lessons.
        </Text>
      )}
      <CertificateModal isOpen={showCertificate} onClose={() => setShowCertificate(false)} courseId={course.id} recipient={recipientName} />
    </Stack>
  );
};

/* ---------------- Courses grid ---------------- */
interface CoursesViewProps {
  openCourseId?: string | null;
  onOpenCourse: (id: string | null) => void;
  onDataChanged: () => void;
}

// Course catalog rarely changes — keep the last copy for instant back-navigation
let coursesCache: CourseSummary[] | null = null;

const CoursesView = ({ openCourseId, onOpenCourse, onDataChanged }: CoursesViewProps) => {
  const [courses, setCourses] = useState<CourseSummary[]>(coursesCache ?? []);
  const [loading, setLoading] = useState(!coursesCache);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const response = await fetchCourses({ limit: 30 });
        const list: CourseSummary[] = response.courses ?? [];
        coursesCache = list;
        if (!cancelled) {
          setCourses(list);
        }
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
