import { useMemo, useState } from 'react';
import {
  Alert,
  AlertIcon,
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
} from '@chakra-ui/react';
import { FiBookOpen, FiClock, FiCheckCircle, FiAward, FiPlay, FiTarget, FiGlobe, FiMessageCircle } from 'react-icons/fi';
import {
  ink,
  inkSoft,
  rose,
  roseDeep,
  card,
  line,
  serif,
  sage,
  amber,
  roseTint,
  sageTint,
  amberTint,
  creamDeep,
} from '../../theme/brand';
import type { DashboardPayload, WeeklyActivityDay } from '../../hooks/useDashboard';

/* ---------- Stat tile ---------- */
const StatTile = ({
  icon,
  tile,
  label,
  value,
  helper,
}: {
  icon: React.ElementType;
  tile: string;
  label: string;
  value: string | number;
  helper?: string;
}) => (
  <Box bg={card} border="1px solid" borderColor={line} borderRadius="2xl" p={5}>
    <HStack spacing={3} mb={3}>
      <Flex w="38px" h="38px" align="center" justify="center" borderRadius="lg" bg={tile} color="white">
        <Icon as={icon} boxSize={4} />
      </Flex>
      <Text fontSize="sm" color={inkSoft} fontWeight="500">
        {label}
      </Text>
    </HStack>
    <Text fontFamily={serif} fontWeight="600" fontSize="3xl" color={ink} lineHeight="1">
      {value}
    </Text>
    {helper && (
      <Text fontSize="xs" color={inkSoft} mt={1}>
        {helper}
      </Text>
    )}
  </Box>
);

/* ---------- Weekly activity bar chart (single series: minutes/day) ---------- */
const WeeklyActivityChart = ({ days }: { days: WeeklyActivityDay[] }) => {
  const [hovered, setHovered] = useState<number | null>(null);
  const max = Math.max(...days.map((d) => d.minutes), 1);
  const maxIndex = days.findIndex((d) => d.minutes === max && max > 0);
  const dayName = (iso: string) => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][new Date(iso).getDay()];
  const chartH = 120;

  return (
    <Box>
      <Flex align="flex-end" gap={{ base: 1.5, md: 2 }} h={`${chartH + 24}px`}>
        {days.map((d, i) => {
          const h = d.minutes === 0 ? 3 : Math.max(6, (d.minutes / max) * chartH);
          const isHover = hovered === i;
          return (
            <Flex key={d.date} direction="column" align="center" flex={1} minW={0} position="relative"
              onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)}>
              {/* tooltip */}
              {isHover && d.minutes > 0 && (
                <Box position="absolute" bottom={`${h + 30}px`} bg={ink} color="white" fontSize="xs" px={2.5} py={1.5}
                  borderRadius="md" whiteSpace="nowrap" zIndex={5} pointerEvents="none">
                  {d.minutes} min · {d.lessons} lesson{d.lessons === 1 ? '' : 's'}
                </Box>
              )}
              {/* direct label on the max bar only */}
              {i === maxIndex && d.minutes > 0 && !isHover && (
                <Text position="absolute" bottom={`${h + 28}px`} fontSize="xs" fontWeight="700" color={ink}>
                  {d.minutes}m
                </Text>
              )}
              <Box
                w="full"
                maxW="34px"
                h={`${h}px`}
                bg={d.minutes === 0 ? creamDeep : isHover ? roseDeep : rose}
                borderTopRadius="4px"
                transition="background 0.15s ease"
                cursor={d.minutes > 0 ? 'pointer' : 'default'}
              />
              <Text fontSize="11px" color={inkSoft} mt={2}>
                {dayName(d.date)}
              </Text>
            </Flex>
          );
        })}
      </Flex>
    </Box>
  );
};

/* ---------- Card wrapper ---------- */
const Panel = ({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) => (
  <Box bg="white" border="1px solid" borderColor={line} borderRadius="2xl" p={{ base: 5, md: 6 }}>
    <Flex justify="space-between" align="center" mb={4}>
      <Text fontFamily={serif} fontWeight="600" fontSize="lg" color={ink}>
        {title}
      </Text>
      {action}
    </Flex>
    {children}
  </Box>
);

/* ---------- Dashboard ---------- */
interface DashboardProps {
  data: DashboardPayload | null;
  isLoading: boolean;
  error?: string | null;
  retryable?: boolean;
  onRetry?: () => void;
  username?: string;
  onOpenCourse: (courseId: string) => void;
  onBrowseCourses: () => void;
  onGoToSection: (id: string) => void;
}

const quickActions = [
  { id: 'practices', label: 'Daily drill', icon: FiTarget, tile: amber },
  { id: 'translator', label: 'Translate', icon: FiGlobe, tile: sage },
  { id: 'chat', label: 'Ask the tutor', icon: FiMessageCircle, tile: rose },
];

const Dashboard = ({ data, isLoading, error, retryable, onRetry, username, onOpenCourse, onBrowseCourses, onGoToSection }: DashboardProps) => {
  const summary = data?.summary;
  const cl = data?.continueLearning;
  const hours = useMemo(() => {
    const mins = summary?.totalTimeMinutes ?? 0;
    return mins >= 60 ? `${Math.floor(mins / 60)}h ${mins % 60}m` : `${mins}m`;
  }, [summary?.totalTimeMinutes]);

  if (isLoading && !data) {
    return (
      <Stack spacing={5}>
        <Skeleton h="40px" maxW="360px" borderRadius="lg" />
        <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} h="130px" borderRadius="2xl" />
          ))}
        </SimpleGrid>
        <Skeleton h="220px" borderRadius="2xl" />
      </Stack>
    );
  }

  return (
    <Stack spacing={{ base: 5, md: 7 }}>
      {error && (
        <Alert status="error" borderRadius="xl" fontSize="sm" justifyContent="space-between">
          <HStack>
            <AlertIcon />
            <Text>{error}</Text>
          </HStack>
          {retryable && onRetry && (
            <Button size="xs" variant="outline" colorScheme="red" onClick={onRetry} isLoading={isLoading}>
              Try again
            </Button>
          )}
        </Alert>
      )}

      {!error && data?.partial && (
        <Alert status="warning" borderRadius="xl" fontSize="sm" justifyContent="space-between">
          <HStack>
            <AlertIcon />
            <Text>Some numbers below may be out of date — reconnecting to refresh them.</Text>
          </HStack>
          {onRetry && (
            <Button size="xs" variant="outline" colorScheme="orange" onClick={onRetry} isLoading={isLoading}>
              Refresh
            </Button>
          )}
        </Alert>
      )}

      {/* Greeting */}
      <Box>
        <Text fontFamily={serif} fontWeight="600" fontSize={{ base: '2xl', md: '3xl' }} color={ink}>
          Muraho, {username || 'learner'} 👋
        </Text>
        <Text color={inkSoft} fontSize="sm" mt={1}>
          {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })} —{' '}
          {summary?.streakDays ? `you're on a ${summary.streakDays}-day streak. Keep it alive!` : 'a perfect day to start a streak.'}
        </Text>
      </Box>

      {/* Stats */}
      <SimpleGrid columns={{ base: 2, lg: 4 }} spacing={{ base: 3, md: 4 }}>
        <StatTile icon={FiPlay} tile={rose} label="Day streak" value={summary?.streakDays ?? 0} helper="Learn daily to grow it" />
        <StatTile icon={FiClock} tile={sage} label="Time learned" value={hours} helper="Across all lessons" />
        <StatTile icon={FiCheckCircle} tile={amber} label="Lessons done" value={summary?.lessonsCompleted ?? 0} helper="Completed lessons" />
        <StatTile icon={FiBookOpen} tile={ink} label="Courses" value={`${summary?.completedCourses ?? 0}/${summary?.enrolledCourses ?? 0}`} helper="Completed / enrolled" />
      </SimpleGrid>

      <Grid templateColumns={{ base: '1fr', lg: '1.2fr 1fr' }} gap={{ base: 5, md: 6 }}>
        {/* Continue learning */}
        <Panel
          title="Continue learning"
          action={
            <Button size="xs" variant="ghost" color={rose} fontWeight="700" onClick={onBrowseCourses}>
              All courses →
            </Button>
          }
        >
          {cl ? (
            <Box bg={roseTint} borderRadius="xl" p={5}>
              <HStack justify="space-between" mb={1} align="flex-start">
                <Box>
                  <Text fontSize="10px" fontWeight="700" letterSpacing="0.1em" color={roseDeep}>
                    {cl.level || 'COURSE'} · {cl.completedLessons}/{cl.totalLessons} LESSONS
                  </Text>
                  <Text fontFamily={serif} fontWeight="600" fontSize="xl" color={ink} mt={1}>
                    {cl.courseTitle}
                  </Text>
                </Box>
              </HStack>
              <Progress value={cl.progress} size="sm" borderRadius="full" mt={3} mb={4}
                sx={{ '& > div': { background: roseDeep } }} bg="rgba(194,69,96,0.15)" />
              {cl.nextLesson ? (
                <Flex justify="space-between" align="center" wrap="wrap" gap={3}>
                  <Box>
                    <Text fontSize="xs" color={inkSoft}>
                      Next lesson · {cl.nextLesson.duration} min
                    </Text>
                    <Text fontSize="sm" fontWeight="700" color={ink}>
                      {cl.nextLesson.order}. {cl.nextLesson.title}
                    </Text>
                  </Box>
                  <Button
                    size="sm"
                    borderRadius="full"
                    bg={ink}
                    color="white"
                    px={5}
                    _hover={{ bg: '#463039' }}
                    onClick={() => onOpenCourse(cl.courseId)}
                  >
                    Continue
                  </Button>
                </Flex>
              ) : (
                <Text fontSize="sm" color={inkSoft}>
                  All lessons complete — well done! 🎉
                </Text>
              )}
            </Box>
          ) : (
            <Stack align="flex-start" spacing={3} py={2}>
              <Text fontSize="sm" color={inkSoft}>
                You're not enrolled in any course yet. Pick one and your progress will live here.
              </Text>
              <Button size="sm" borderRadius="full" bg={ink} color="white" px={5} _hover={{ bg: '#463039' }} onClick={onBrowseCourses}>
                Browse courses
              </Button>
            </Stack>
          )}
        </Panel>

        {/* Weekly activity */}
        <Panel title="This week's activity">
          {data?.weeklyActivity?.length ? (
            <WeeklyActivityChart days={data.weeklyActivity} />
          ) : (
            <Text fontSize="sm" color={inkSoft}>
              Your daily minutes will show up here.
            </Text>
          )}
        </Panel>
      </Grid>

      <Grid templateColumns={{ base: '1fr', lg: '1fr 1fr' }} gap={{ base: 5, md: 6 }}>
        {/* Achievements */}
        <Panel
          title="Recent achievements"
          action={
            <Button size="xs" variant="ghost" color={rose} fontWeight="700" onClick={() => onGoToSection('achievements')}>
              View all →
            </Button>
          }
        >
          {data?.achievements?.length ? (
            <Stack spacing={3}>
              {data.achievements.map((a) => (
                <HStack key={a.id} spacing={3} bg={amberTint} borderRadius="xl" p={3}>
                  <Circle size="36px" bg={amber} color="white">
                    <Icon as={FiAward} boxSize={4} />
                  </Circle>
                  <Box flex={1} minW={0}>
                    <Text fontSize="sm" fontWeight="700" color={ink} noOfLines={1}>
                      {a.title}
                    </Text>
                    <Text fontSize="xs" color={inkSoft} noOfLines={1}>
                      {a.description}
                    </Text>
                  </Box>
                  <Text fontSize="xs" fontWeight="700" color={amber} whiteSpace="nowrap">
                    +{a.xpReward} XP
                  </Text>
                </HStack>
              ))}
            </Stack>
          ) : (
            <Text fontSize="sm" color={inkSoft}>
              Complete your first lesson to unlock achievements.
            </Text>
          )}
        </Panel>

        {/* Quick actions */}
        <Panel title="Quick practice">
          <Stack spacing={3}>
            {quickActions.map((qa) => (
              <HStack
                key={qa.id}
                as="button"
                onClick={() => onGoToSection(qa.id)}
                spacing={3}
                bg={sageTint}
                borderRadius="xl"
                p={3}
                _hover={{ transform: 'translateY(-1px)', boxShadow: '0 8px 16px rgba(46,31,38,0.08)' }}
                transition="all 0.15s ease"
                textAlign="left"
              >
                <Circle size="36px" bg={qa.tile} color="white">
                  <Icon as={qa.icon} boxSize={4} />
                </Circle>
                <Text fontSize="sm" fontWeight="700" color={ink}>
                  {qa.label}
                </Text>
              </HStack>
            ))}
          </Stack>
        </Panel>
      </Grid>
    </Stack>
  );
};

export default Dashboard;
