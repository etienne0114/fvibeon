import { useEffect, useState } from 'react';
import { Alert, AlertIcon, Badge, Box, Button, Flex, HStack, SimpleGrid, Skeleton, Spinner, Stack, Text } from '@chakra-ui/react';
import {
  fetchRoleplayScenarios,
  startRoleplaySession,
  sendRoleplayMessage,
  completeRoleplaySession,
  RoleplayScenario,
} from '../../../api/practice';
import { ink, inkSoft, roseDeep, card, line, serif, sage, roseTint, sageTint } from '../../../theme/brand';
import DrillChatSession, { ChatTurn } from './DrillChatSession';

const difficultyLabel = (d: number) => (d === 1 ? 'Beginner' : d === 2 ? 'Intermediate' : 'Advanced');

const RoleplayDrill = () => {
  const [scenarios, setScenarios] = useState<RoleplayScenario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [startingId, setStartingId] = useState<string | null>(null);
  const [active, setActive] = useState<RoleplayScenario | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [initialTurns, setInitialTurns] = useState<ChatTurn[]>([]);

  useEffect(() => {
    fetchRoleplayScenarios()
      .then(setScenarios)
      .catch((err) => setError(err?.friendlyMessage || 'Could not load scenarios'))
      .finally(() => setLoading(false));
  }, []);

  const start = async (scenario: RoleplayScenario) => {
    try {
      setStartingId(scenario.id);
      setError(null);
      const session = await startRoleplaySession(scenario.id, 'en');
      setActive(scenario);
      setSessionId(session.sessionId);
      setInitialTurns([{ role: 'ASSISTANT', content: session.greeting }]);
    } catch (err: any) {
      setError(err?.friendlyMessage || err?.response?.data?.error || 'Could not start roleplay');
    } finally {
      setStartingId(null);
    }
  };

  const exit = () => {
    setActive(null);
    setSessionId(null);
    setInitialTurns([]);
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

  // Clear, unmistakable transitional state — a spinner-only button previously
  // left the rest of the grid interactive and looking "stuck" while the AI
  // greeting was being generated (a real several-second call).
  if (startingId && !active) {
    return (
      <Flex direction="column" align="center" justify="center" py={20} gap={4}>
        <Spinner size="lg" color={roseDeep} thickness="3px" />
        <Text color={inkSoft} fontWeight="600">
          Setting up your roleplay...
        </Text>
      </Flex>
    );
  }

  if (!active || !sessionId) {
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
              isDisabled={Boolean(startingId)}
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
    <DrillChatSession
      title={active.title}
      subtitle={active.description}
      turns={initialTurns}
      language="en"
      onSend={(message, audio) => sendRoleplayMessage(sessionId, message, 'en', audio)}
      onComplete={() => completeRoleplaySession(sessionId)}
      onExit={exit}
      accentTint={roseTint}
      accentDeep={roseDeep}
      completeLabel="Finish & get feedback"
      feedbackTitle="Session feedback"
    />
  );
};

export default RoleplayDrill;
