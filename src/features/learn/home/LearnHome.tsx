import { Stack } from '@chakra-ui/react';
import { useState } from 'react';
import LearningDashboard from '../dashboard/LearningDashboard';
import CourseExplorer from '../courses/CourseExplorer';
import TutorChat from '../chat/TutorChat';
import TranslatorPanel from '../translator/TranslatorPanel';
import { WorkspaceShell } from '../../../components';
import { useDashboard } from '../../../hooks/useDashboard';
import { useTutorChat } from '../../../hooks/useTutorChat';
import PracticeShortcuts from './PracticeShortcuts';
import AchievementsPanel from '../achievements/AchievementsPanel';
import AnalyticsPanel from '../dashboard/AnalyticsPanel';
import PracticesPanel from '../practices/PracticesPanel';

const sections = [
  { id: 'dashboard', title: 'Dashboard', description: 'Track progress and analytics', icon: '📊' },
  { id: 'courses', title: 'Courses', description: 'New paths and learning tracks', icon: '📚' },
  { id: 'translator', title: 'Translator', description: 'Use vibeon_translator for any text', icon: '🌐' },
  { id: 'chat', title: 'AI chat', description: 'Ask the tutor anything', icon: '💬' },
  { id: 'practices', title: 'Practices', description: 'Roleplay, quiz, listening drills', icon: '🎯' },
  { id: 'achievements', title: 'Achievements', description: 'Celebrate milestones', icon: '🏆' },
];

interface LearnHomeProps {
  onLogout?: () => void;
}

interface LearnHomeProps {
  onLogout?: () => void;
  token?: string | null;
}

const LearnHome = ({ onLogout, token }: LearnHomeProps) => {
  const [activeSection, setActiveSection] = useState(sections[0].id);
  const { summary, generatedAt, isLoading: dashLoading, error: dashError } = useDashboard({ enabled: Boolean(token) });
  const { message, setMessage, helperText, sendMessage, isLoading: isChatting } = useTutorChat();

  const renderMainPanel = () => {
    switch (activeSection) {
      case 'courses':
        return <CourseExplorer enabled />;
      case 'translator':
        return <TranslatorPanel />;
      case 'chat':
        return <TutorChat message={message} onChange={setMessage} onSend={sendMessage} isSending={isChatting} helperText={helperText} />;
      case 'practices':
        return <PracticesPanel />;
      case 'achievements':
        return <AchievementsPanel />;
      case 'dashboard':
      default:
        return (
          <Stack spacing={6}>
            <LearningDashboard summary={summary} generatedAt={generatedAt} loading={dashLoading} error={dashError} />
            <AnalyticsPanel />
            <CourseExplorer enabled={false} limit={3} />
            <AchievementsPanel />
            <PracticeShortcuts
              shortcuts={[
                { id: 'vocabulary', title: 'Daily Vocab', description: 'Boost your vocabulary streak', icon: '🧠', action: 'Practice now' },
                { id: 'listening', title: 'Listening Drill', description: 'Match pronunciation', icon: '🎧', action: 'Start listening' },
                { id: 'roleplay', title: 'Roleplay', description: 'Simulate real conversations', icon: '🎭', action: 'Open roleplay' },
              ]}
              onAction={(section) => setActiveSection(section === 'vocabulary' ? 'translator' : section === 'listening' ? 'chat' : 'courses')}
            />
          </Stack>
        );
    }
  };

  return (
    <WorkspaceShell
      sections={sections}
      activeSection={activeSection}
      onSectionChange={setActiveSection}
      main={renderMainPanel()}
      onLogout={onLogout}
    />
  );
};

export default LearnHome;
