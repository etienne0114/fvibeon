import { useState } from 'react';
import { Box, Flex, HStack, Icon, Text } from '@chakra-ui/react';
import { FiTarget, FiHelpCircle, FiMessageCircle, FiCpu, FiAward } from 'react-icons/fi';
import { ink, inkSoft, rose, card, line, serif } from '../../../theme/brand';
import VocabularyDrill from './VocabularyDrill';
import QuizDrill from './QuizDrill';
import RoleplayDrill from './RoleplayDrill';
import TechnologyDrill from './TechnologyDrill';
import AchievementsGrid from './AchievementsGrid';

const MODES = [
  { id: 'vocabulary', label: 'Vocabulary', icon: FiTarget },
  { id: 'quiz', label: 'Quiz', icon: FiHelpCircle },
  { id: 'roleplay', label: 'Roleplay', icon: FiMessageCircle },
  { id: 'technology', label: 'Technology', icon: FiCpu },
  { id: 'achievements', label: 'Achievements', icon: FiAward },
] as const;

type ModeId = (typeof MODES)[number]['id'];

interface PracticeViewProps {
  initialMode?: ModeId;
}

const PracticeView = ({ initialMode = 'vocabulary' }: PracticeViewProps) => {
  const [mode, setMode] = useState<ModeId>(initialMode);

  return (
    <Box>
      <Flex
        gap={2}
        mb={{ base: 5, md: 6 }}
        overflowX="auto"
        pb={1}
        sx={{ '&::-webkit-scrollbar': { display: 'none' }, scrollbarWidth: 'none' }}
      >
        {MODES.map((m) => {
          const active = m.id === mode;
          return (
            <HStack
              key={m.id}
              as="button"
              onClick={() => setMode(m.id)}
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
              <Icon as={m.icon} boxSize={3.5} />
              <Text>{m.label}</Text>
            </HStack>
          );
        })}
      </Flex>

      {mode === 'vocabulary' && <VocabularyDrill />}
      {mode === 'quiz' && <QuizDrill />}
      {mode === 'roleplay' && <RoleplayDrill />}
      {mode === 'technology' && <TechnologyDrill />}
      {mode === 'achievements' && <AchievementsGrid />}
    </Box>
  );
};

export default PracticeView;
