import { useState } from 'react';
import { Box, Text } from '@chakra-ui/react';
import HomeShell from '../../home/HomeShell';
import Dashboard from '../../home/Dashboard';
import CoursesView from '../../home/CoursesView';
import TutorChat from '../chat/TutorChat';
import TranslatorPanel from '../translator/TranslatorPanel';
import PracticesPanel from '../practices/PracticesPanel';
import AchievementsPanel from '../achievements/AchievementsPanel';
import { useDashboard } from '../../../hooks/useDashboard';
import { useMe } from '../../../hooks/useMe';
import { useTutorChat } from '../../../hooks/useTutorChat';
import { ink, line, serif } from '../../../theme/brand';

interface LearnHomeProps {
  onLogout?: () => void;
  token?: string | null;
}

// White panel wrapper so legacy panels sit well on the cream background
const PanelSurface = ({ title, children }: { title?: string; children: React.ReactNode }) => (
  <Box bg="white" border="1px solid" borderColor={line} borderRadius="2xl" p={{ base: 4, md: 6 }}>
    {title && (
      <Text fontFamily={serif} fontWeight="600" fontSize="xl" color={ink} mb={4}>
        {title}
      </Text>
    )}
    {children}
  </Box>
);

const LearnHome = ({ onLogout, token }: LearnHomeProps) => {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [openCourseId, setOpenCourseId] = useState<string | null>(null);
  const user = useMe(Boolean(token));
  const { data, isLoading, error, refetch } = useDashboard({ enabled: Boolean(token) });
  const { message, setMessage, helperText, sendMessage, isLoading: isChatting } = useTutorChat();

  const openCourse = (courseId: string | null) => {
    setOpenCourseId(courseId);
    setActiveSection('courses');
  };

  const renderSection = () => {
    switch (activeSection) {
      case 'courses':
        return <CoursesView openCourseId={openCourseId} onOpenCourse={setOpenCourseId} onDataChanged={refetch} />;
      case 'translator':
        return (
          <PanelSurface>
            <TranslatorPanel />
          </PanelSurface>
        );
      case 'chat':
        return (
          <PanelSurface>
            <TutorChat
              message={message}
              onChange={setMessage}
              onSend={sendMessage}
              isSending={isChatting}
              helperText={helperText}
            />
          </PanelSurface>
        );
      case 'practices':
        return (
          <PanelSurface>
            <PracticesPanel />
          </PanelSurface>
        );
      case 'achievements':
        return (
          <PanelSurface>
            <AchievementsPanel />
          </PanelSurface>
        );
      case 'dashboard':
      default:
        return (
          <Dashboard
            data={data}
            isLoading={isLoading}
            error={error}
            username={user?.firstName || user?.username}
            onOpenCourse={openCourse}
            onBrowseCourses={() => openCourse(null)}
            onGoToSection={setActiveSection}
          />
        );
    }
  };

  return (
    <HomeShell
      activeSection={activeSection}
      onSectionChange={(id) => {
        setActiveSection(id);
        if (id !== 'courses') setOpenCourseId(null);
      }}
      username={user?.firstName || user?.username}
      streakDays={data?.summary?.streakDays ?? 0}
      onLogout={onLogout}
    >
      {renderSection()}
    </HomeShell>
  );
};

export default LearnHome;
