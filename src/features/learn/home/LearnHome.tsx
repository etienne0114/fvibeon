import { lazy, Suspense, useState } from 'react';
import { Box, Skeleton, Stack, Text } from '@chakra-ui/react';
import HomeShell from '../../home/HomeShell';
import Dashboard from '../../home/Dashboard';
import CoursesView from '../../home/CoursesView';

// Heavy, rarely-first-visited panels load on demand to keep the initial
// bundle (and first paint) small.
const TutorChat = lazy(() => import('../chat/TutorChat'));
const TranslatorPanel = lazy(() => import('../translator/TranslatorPanel'));
const PracticeView = lazy(() => import('../../home/practice/PracticeView'));

const PanelFallback = () => (
  <Stack spacing={4}>
    <Skeleton h="36px" maxW="280px" borderRadius="lg" />
    <Skeleton h="180px" borderRadius="2xl" />
  </Stack>
);
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
  const { data, isLoading, error, retryable, refetch } = useDashboard({ enabled: Boolean(token) });
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
        // key forces a remount when switching from the "achievements" nav
        // entry — otherwise React reuses the mounted PracticeView and its
        // internal tab state ignores the new initialMode prop.
        return (
          <PanelSurface>
            <PracticeView key="practices" />
          </PanelSurface>
        );
      case 'achievements':
        return (
          <PanelSurface>
            <PracticeView key="achievements" initialMode="achievements" />
          </PanelSurface>
        );
      case 'dashboard':
      default:
        return (
          <Dashboard
            data={data}
            isLoading={isLoading}
            error={error}
            retryable={retryable}
            onRetry={refetch}
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
      <Suspense fallback={<PanelFallback />}>{renderSection()}</Suspense>
    </HomeShell>
  );
};

export default LearnHome;
