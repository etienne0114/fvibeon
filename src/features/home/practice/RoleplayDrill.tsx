import { useEffect, useRef, useState } from 'react';
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
  SimpleGrid,
  Skeleton,
  Stack,
  Text,
} from '@chakra-ui/react';
import { ArrowBackIcon, ArrowUpIcon } from '@chakra-ui/icons';
import { FiMessageCircle, FiAward } from 'react-icons/fi';
import {
  fetchRoleplayScenarios,
  startRoleplaySession,
  sendRoleplayMessage,
  completeRoleplaySession,
  RoleplayScenario,
} from '../../../api/practice';
import { ink, inkSoft, rose, roseDeep, card, line, serif, sage, roseTint, sageTint, amber } from '../../../theme/brand';

interface ChatTurn {
  role: 'USER' | 'ASSISTANT';
  content: string;
}

const difficultyLabel = (d: number) => (d === 1 ? 'Beginner' : d === 2 ? 'Intermediate' : 'Advanced');

const RoleplayDrill = () => {
  const [scenarios, setScenarios] = useState<RoleplayScenario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [active, setActive] = useState<RoleplayScenario | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [starting, setStarting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [completing, setCompleting] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchRoleplayScenarios()
      .then(setScenarios)
      .catch((err) => setError(err?.friendlyMessage || 'Could not load scenarios'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [turns]);

  const start = async (scenario: RoleplayScenario) => {
    try {
      setStarting(true);
      setError(null);
      const session = await startRoleplaySession(scenario.id, 'en');
      setActive(scenario);
      setSessionId(session.sessionId);
      setTurns([{ role: 'ASSISTANT', content: session.greeting }]);
      setFeedback(null);
    } catch (err: any) {
      setError(err?.friendlyMessage || err?.response?.data?.error || 'Could not start roleplay');
    } finally {
      setStarting(false);
    }
  };

  const send = async () => {
    if (!sessionId || !message.trim() || sending) return;
    const text = message.trim();
    setMessage('');
    setTurns((prev) => [...prev, { role: 'USER', content: text }]);
    try {
      setSending(true);
      const reply = await sendRoleplayMessage(sessionId, text, 'en');
      setTurns((prev) => [...prev, { role: 'ASSISTANT', content: reply.reply }]);
    } catch (err: any) {
      setError(err?.friendlyMessage || err?.response?.data?.error || 'Could not send message');
    } finally {
      setSending(false);
    }
  };

  const complete = async () => {
    if (!sessionId) return;
    try {
      setCompleting(true);
      const res = await completeRoleplaySession(sessionId);
      setFeedback(res.feedback);
    } catch (err: any) {
      setError(err?.friendlyMessage || 'Could not complete session');
    } finally {
      setCompleting(false);
    }
  };

  const exit = () => {
    setActive(null);
    setSessionId(null);
    setTurns([]);
    setFeedback(null);
  };

  if (error && !active) {
    return (
      <Alert status="error" borderRadius="xl" fontSize="sm">
        <AlertIcon />
        {error}
      </Alert>
    );
  }

  if (loading) {
    return (
      <SimpleGrid columns={{ base: 1, sm: 2, lg: 3 }} spacing={4}>
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} h="150px" borderRadius="2xl" />
        ))}
      </SimpleGrid>
    );
  }

  if (!active) {
    return (
      <SimpleGrid columns={{ base: 1, sm: 2, lg: 3 }} spacing={4}>
        {scenarios.map((s) => (
          <Flex
            key={s.id}
            direction="column"
            bg={card}
            border="1px solid"
            borderColor={line}
            borderRadius="2xl"
            p={5}
            transition="all 0.2s ease"
            _hover={{ transform: 'translateY(-3px)', boxShadow: '0 12px 24px rgba(46,31,38,0.08)' }}
          >
            <HStack mb={2}>
              <Badge bg={roseTint} color={roseDeep} borderRadius="full" px={3} py={0.5} fontSize="10px">
                {s.category}
              </Badge>
              <Badge bg={sageTint} color={sage} borderRadius="full" px={3} py={0.5} fontSize="10px">
                {difficultyLabel(s.difficulty)}
              </Badge>
            </HStack>
            <Text fontFamily={serif} fontWeight="600" fontSize="lg" color={ink} mb={1}>
              {s.title}
            </Text>
            <Text fontSize="sm" color={inkSoft} mb={4} flex={1}>
              {s.description}
            </Text>
            <Button
              onClick={() => start(s)}
              isLoading={starting}
              borderRadius="full"
              bg={ink}
              color="white"
              _hover={{ bg: '#463039' }}
              size="sm"
              h="38px"
            >
              Start roleplay
            </Button>
          </Flex>
        ))}
      </SimpleGrid>
    );
  }

  return (
    <Stack spacing={4}>
      <HStack justify="space-between">
        <Button size="sm" variant="ghost" leftIcon={<ArrowBackIcon />} color={inkSoft} onClick={exit}>
          Back to scenarios
        </Button>
        {!feedback && (
          <Button size="sm" variant="outline" borderColor={line} color={inkSoft} onClick={complete} isLoading={completing}>
            Finish & get feedback
          </Button>
        )}
      </HStack>

      <Box bg={card} borderRadius="xl" p={4}>
        <Text fontFamily={serif} fontWeight="600" color={ink}>
          {active.title}
        </Text>
        <Text fontSize="xs" color={inkSoft}>
          {active.description}
        </Text>
      </Box>

      {error && (
        <Alert status="error" borderRadius="xl" fontSize="sm">
          <AlertIcon />
          {error}
        </Alert>
      )}

      {feedback ? (
        <Box bg={sageTint} borderRadius="2xl" p={6}>
          <HStack mb={3}>
            <Circle size="32px" bg={amber} color="white">
              <Icon as={FiAward} boxSize={4} />
            </Circle>
            <Text fontFamily={serif} fontWeight="600" fontSize="lg" color={ink}>
              Session feedback
            </Text>
          </HStack>
          <Text fontSize="sm" color={ink} lineHeight="1.8" whiteSpace="pre-wrap">
            {feedback}
          </Text>
        </Box>
      ) : (
        <Box bg="white" border="1px solid" borderColor={line} borderRadius="2xl" p={4}>
          <Stack spacing={3} maxH="420px" overflowY="auto" px={1}>
            {turns.map((t, i) => (
              <Flex key={i} justify={t.role === 'USER' ? 'flex-end' : 'flex-start'}>
                <Box
                  bg={t.role === 'USER' ? ink : roseTint}
                  color={t.role === 'USER' ? 'white' : ink}
                  borderRadius="xl"
                  px={4}
                  py={2.5}
                  maxW="80%"
                >
                  <Text fontSize="sm">{t.content}</Text>
                </Box>
              </Flex>
            ))}
            {sending && (
              <Flex justify="flex-start">
                <Box bg={roseTint} borderRadius="xl" px={4} py={2.5}>
                  <Icon as={FiMessageCircle} boxSize={3} color={roseDeep} />
                </Box>
              </Flex>
            )}
            <div ref={bottomRef} />
          </Stack>
          <HStack mt={3}>
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && send()}
              placeholder="Type your response..."
              bg={card}
              border="1px solid"
              borderColor={line}
              borderRadius="xl"
              _focus={{ borderColor: rose, boxShadow: `0 0 0 1px ${rose}` }}
            />
            <Button
              onClick={send}
              isLoading={sending}
              isDisabled={!message.trim()}
              borderRadius="full"
              bg={ink}
              color="white"
              _hover={{ bg: '#463039' }}
              flexShrink={0}
            >
              <ArrowUpIcon />
            </Button>
          </HStack>
        </Box>
      )}
    </Stack>
  );
};

export default RoleplayDrill;
