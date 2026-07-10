import {
  Box,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
  useColorModeValue,
  useBreakpointValue,
} from '@chakra-ui/react';
import { SectionCard, SectionHeading } from '../../../components';
import VocabularyDrillPanel from './VocabularyDrillPanel';
import QuizDrillPanel from './QuizDrillPanel';
import RoleplayDrillPanel from './RoleplayDrillPanel';
import TechnologyPanel from './TechnologyPanel';
import AchievementsPanel from '../achievements/AchievementsPanel';

const tabLabels = [
  { label: 'Vocabulary', icon: '🧠' },
  { label: 'Quiz', icon: '📝' },
  { label: 'Roleplay', icon: '🎭' },
  { label: 'Technology', icon: '💻' },
  { label: 'Achievements', icon: '🏆' },
];

const PracticesPanel = () => {
  const orientation = useBreakpointValue<"horizontal" | "vertical">({ base: 'horizontal', md: 'horizontal' });
  const tabBg = useColorModeValue('gray.100', 'gray.800');

  return (
    <SectionCard borderRadius="2xl">
      <SectionHeading title="Practices" subtitle="Sharpen your skills with focused drills" />
      <Tabs variant="unstyled" colorScheme="learning" orientation={orientation}>
        <TabList
          bg={tabBg}
          p={1.5}
          borderRadius="xl"
          display="flex"
          flexWrap={{ base: 'wrap', md: 'nowrap' }}
          gap={1}
          mb={6}
        >
          {tabLabels.map(({ label, icon }) => (
            <Tab
              key={label}
              _selected={{
                bg: 'white',
                color: 'learning.600',
                boxShadow: 'premium',
                fontWeight: 'bold',
              }}
              borderRadius="lg"
              px={{ base: 3, md: 5 }}
              py={2.5}
              fontSize="sm"
              fontWeight="600"
              color="gray.500"
              transition="all 0.2s"
              _hover={{ color: 'gray.700' }}
              whiteSpace="nowrap"
            >
              <Text as="span" mr={2}>{icon}</Text>
              {label}
            </Tab>
          ))}
        </TabList>
        <TabPanels>
          <TabPanel p={0}>
            <VocabularyDrillPanel />
          </TabPanel>
          <TabPanel p={0}>
            <QuizDrillPanel />
          </TabPanel>
          <TabPanel p={0}>
            <RoleplayDrillPanel />
          </TabPanel>
          <TabPanel p={0}>
            <TechnologyPanel />
          </TabPanel>
          <TabPanel p={0}>
            <AchievementsPanel />
          </TabPanel>
        </TabPanels>
      </Tabs>
    </SectionCard>
  );
};

export default PracticesPanel;
