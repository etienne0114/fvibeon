import { useEffect, useState } from 'react';
import { Alert, AlertIcon, Badge, Box, Button, Flex, HStack, SimpleGrid, Skeleton, Spinner, Stack, Text } from '@chakra-ui/react';
import {
  fetchTechnologyTopics,
  startTechnologySession,
  sendTechnologyMessage,
  completeTechnologySession,
  TechnologyTopic,
} from '../../../api/practice';
import { ink, inkSoft, card, line, serif, sage, sageTint, amberDeep, amberTint } from '../../../theme/brand';
import DrillChatSession, { ChatTurn } from './DrillChatSession';

const difficultyLabel = (d: number) => (d === 1 ? 'Beginner' : d === 2 ? 'Intermediate' : 'Advanced');

const TechnologyDrill = () => {
  const [topics, setTopics] = useState<TechnologyTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [startingId, setStartingId] = useState<string | null>(null);
  const [active, setActive] = useState<TechnologyTopic | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [initialTurns, setInitialTurns] = useState<ChatTurn[]>([]);

  useEffect(() => {
    fetchTechnologyTopics()
      .then(setTopics)
      .catch((err) => setError(err?.friendlyMessage || 'Could not load topics'))
      .finally(() => setLoading(false));
  }, []);

  const start = async (topic: TechnologyTopic) => {
    try {
      setStartingId(topic.id);
      setError(null);
      const session = await startTechnologySession(topic.id, 'en');
      setActive(topic);
      setSessionId(session.sessionId);
      setInitialTurns([{ role: 'ASSISTANT', content: session.intro }]);
    } catch (err: any) {
      setError(err?.friendlyMessage || err?.response?.data?.error || 'Could not start session');
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

  if (startingId && !active) {
    return (
      <Flex direction="column" align="center" justify="center" py={20} gap={4}>
        <Spinner size="lg" color={amberDeep} thickness="3px" />
        <Text color={inkSoft} fontWeight="600">
          Setting up your session...
        </Text>
      </Flex>
    );
  }

  if (!active || !sessionId) {
    return (
      <SimpleGrid columns={{ base: 1, sm: 2, lg: 3 }} spacing={4}>
        {topics.map((t) => (
          <Flex
            key={t.id}
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
              <Badge bg={amberTint} color={amberDeep} borderRadius="full" px={3} py={0.5} fontSize="10px">
                {t.category.replace(/_/g, ' ')}
              </Badge>
              <Badge bg={sageTint} color={sage} borderRadius="full" px={3} py={0.5} fontSize="10px">
                {difficultyLabel(t.difficulty)}
              </Badge>
            </HStack>
            <Text fontFamily={serif} fontWeight="600" fontSize="lg" color={ink} mb={1}>
              {t.title}
            </Text>
            <Text fontSize="sm" color={inkSoft} mb={4} flex={1}>
              {t.description}
            </Text>
            <Button
              onClick={() => start(t)}
              isDisabled={Boolean(startingId)}
              borderRadius="full"
              bg={ink}
              color="white"
              _hover={{ bg: '#463039' }}
              size="sm"
              h="38px"
            >
              Start learning
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
      onSend={(message, audio) => sendTechnologyMessage(sessionId, message, 'en', audio)}
      onComplete={() => completeTechnologySession(sessionId)}
      onExit={exit}
      accentTint={amberTint}
      accentDeep={amberDeep}
      completeLabel="Finish & get summary"
      feedbackTitle="Session summary"
    />
  );
};

export default TechnologyDrill;
