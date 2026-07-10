import { Stack } from '@chakra-ui/react';
import { useState } from 'react';
import AppShell from './components/layout/AppShell';
import AuthPanel, { AuthMode } from './components/layout/AuthPanel';
import LandingPage from './features/landing/LandingPage';
import LearnHome from './features/learn/home/LearnHome';
import { useAuth } from './hooks';

const App = () => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [showAuth, setShowAuth] = useState(false);
  const { token, authenticate, isLoading, error, logout } = useAuth();

  const handleSubmit = async (payload: { email: string; password: string; username?: string }) => {
    try {
      await authenticate(payload, mode);
    } catch (_error) {
      // swallow: hook already exposes error message
    }
  };

  const handleModeToggle = () => setMode((prev) => (prev === 'login' ? 'register' : 'login'));

  if (!token && !showAuth) {
    return <LandingPage onOpenApp={() => setShowAuth(true)} />;
  }

  return (
    <AppShell>
      <Stack spacing={0} h="full" mx={!token ? "auto" : 0} maxW={!token ? "6xl" : "full"} w="full" flex={1} minH={0}>
        {!token ? (
          <AuthPanel mode={mode} loading={isLoading} error={error} onSubmit={handleSubmit} onSwitchMode={handleModeToggle} />
        ) : (
          <LearnHome token={token} onLogout={logout} />
        )}
      </Stack>
    </AppShell>
  );
};

export default App;
