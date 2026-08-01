import { lazy, Suspense, useState } from 'react';
import { Box, Skeleton, Stack, Text, useDisclosure } from '@chakra-ui/react';
import HomeShell from '../../home/HomeShell';
import Dashboard from '../../home/Dashboard';
import ProfileModal from '../../home/profile/ProfileModal';

// Heavy, rarely-first-visited panels load on demand to keep the initial
// bundle (and first paint) small. CoursesView now pulls in Table/Accordion
// and the full interactive practice renderer (rule/structure/table/
// fill-blank sections) to render content-heavy courses — it was still
// bundled eagerly even though Dashboard, not Courses, is the default
// landing view.
const TranslatorPanel = lazy(() => import('../translator/TranslatorPanel'));
const PracticeView = lazy(() => import('../../home/practice/PracticeView'));
const ReadingView = lazy(() => import('../../home/reading/ReadingView'));
const ListeningView = lazy(() => import('../../home/listening/ListeningView'));
const CoursesView = lazy(() => import('../../home/CoursesView'));
const LearningPathsView = lazy(() => import('../../home/paths/LearningPathsView'));
const CommunityView = lazy(() => import('../../community/CommunityView'));

const PanelFallback = () => (
  <Stack spacing={4}>
    <Skeleton h="36px" maxW="280px" borderRadius="lg" />
    <Skeleton h="180px" borderRadius="2xl" />
  </Stack>
);
import { useDashboard } from '../../../hooks/useDashboard';
import { useMe } from '../../../hooks/useMe';
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
  const [openPathId, setOpenPathId] = useState<string | null>(null);
  const { user, refetchUser } = useMe(Boolean(token));
  const { data, isLoading, error, retryable, refetch } = useDashboard({ enabled: Boolean(token) });
  const { isOpen: isProfileOpen, onOpen: onOpenProfile, onClose: onCloseProfile } = useDisclosure();

  const openCourse = (courseId: string | null) => {
    setOpenCourseId(courseId);
    setActiveSection('courses');
  };

  const renderSection = () => {
    switch (activeSection) {
      case 'courses':
        return <CoursesView openCourseId={openCourseId} onOpenCourse={setOpenCourseId} onDataChanged={refetch} />;
      case 'paths':
        return <LearningPathsView openPathId={openPathId} onOpenPath={setOpenPathId} onOpenCourse={openCourse} />;
      case 'community':
        return (
          <PanelSurface>
            <CommunityView />
          </PanelSurface>
        );
      case 'translator':
        return (
          <PanelSurface>
            <TranslatorPanel />
          </PanelSurface>
        );
      case 'reading':
        return (
          <PanelSurface>
            <ReadingView />
          </PanelSurface>
        );
      case 'listening':
        return (
          <PanelSurface>
            <ListeningView />
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
            dailyGoalMinutes={user?.dailyGoalMinutes}
            onOpenCourse={openCourse}
            onBrowseCourses={() => openCourse(null)}
            onGoToSection={setActiveSection}
          />
        );
    }
  };

  return (
    <>
      <HomeShell
        activeSection={activeSection}
        contentMaxW={activeSection === 'community' ? '1600px' : '1200px'}
        onSectionChange={(id) => {
          setActiveSection(id);
          if (id !== 'courses') setOpenCourseId(null);
          if (id !== 'paths') setOpenPathId(null);
        }}
        username={user?.firstName || user?.username}
        streakDays={data?.summary?.streakDays ?? 0}
        onLogout={onLogout}
        onOpenProfile={onOpenProfile}
      >
        <Suspense fallback={<PanelFallback />}>{renderSection()}</Suspense>
      </HomeShell>
      <ProfileModal
        isOpen={isProfileOpen}
        onClose={onCloseProfile}
        user={user}
        token={token}
        dashboardSummary={data?.summary}
        achievementsUnlocked={data?.achievements?.length ?? 0}
        onLogout={onLogout}
        onUserUpdated={refetchUser}
      />
    </>
  );
};

export default LearnHome;
