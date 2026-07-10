import { Stack } from '@chakra-ui/react';
import { useState } from 'react';
import AppShell from './components/layout/AppShell';
import AuthPage, { AuthMode } from './features/auth/AuthPage';
import LandingPage from './features/landing/LandingPage';
import LearnHome from './features/learn/home/LearnHome';
import { useAuth } from './hooks';

const App = () => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [showAuth, setShowAuth] = useState(
    () => typeof window !== 'undefined' && window.location.hash === '#auth',
  );
  const {
    token,
    authenticate,
    verify,
    resend,
    requestReset,
    completeReset,
    cancelVerification,
    pendingVerification,
    loginWithGoogle,
    isLoading,
    error,
    logout,
  } = useAuth();

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

  if (!token) {
    return (
      <AuthPage
        mode={mode}
        loading={isLoading}
        error={error}
        pendingVerification={pendingVerification}
        onSubmit={handleSubmit}
        onVerify={verify}
        onResend={resend}
        onRequestReset={requestReset}
        onCompleteReset={completeReset}
        onCancelVerification={cancelVerification}
        onSwitchMode={handleModeToggle}
        onGoogleCredential={loginWithGoogle}
        onBack={() => setShowAuth(false)}
      />
    );
  }

  return (
    <AppShell>
      <Stack spacing={0} h="full" w="full" flex={1} minH={0}>
        <LearnHome token={token} onLogout={logout} />
      </Stack>
    </AppShell>
  );
};

export default App;
