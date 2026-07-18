import { useState } from 'react';
import AuthPage, { AuthMode } from './features/auth/AuthPage';
import LandingPage from './features/landing/LandingPage';
import LearnHome from './features/learn/home/LearnHome';
import PrivacyPolicyPage from './features/legal/PrivacyPolicyPage';
import { useAuth } from './hooks';

const App = () => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [showAuth, setShowAuth] = useState(
    () => typeof window !== 'undefined' && window.location.hash === '#auth',
  );
  const [showPrivacy, setShowPrivacy] = useState(false);
  const {
    token,
    authenticate,
    startRegistration,
    checkRegistrationCode,
    completeRegistration,
    saveProfile,
    finishRegistration,
    verify,
    resend,
    requestReset,
    checkResetCode,
    completeReset,
    cancelVerification,
    pendingVerification,
    loginWithGoogle,
    isLoading,
    error,
    logout,
  } = useAuth();

  const handleSubmit = async (payload: { email: string; password: string }) => {
    try {
      await authenticate(payload, 'login');
    } catch (_error) {
      // swallow: hook already exposes error message
    }
  };

  const handleModeToggle = () => setMode((prev) => (prev === 'login' ? 'register' : 'login'));

  if (!token && showPrivacy) {
    return <PrivacyPolicyPage onBack={() => setShowPrivacy(false)} />;
  }

  if (!token && !showAuth) {
    return <LandingPage onOpenApp={() => setShowAuth(true)} onOpenPrivacy={() => setShowPrivacy(true)} />;
  }

  if (!token) {
    return (
      <AuthPage
        mode={mode}
        loading={isLoading}
        error={error}
        pendingVerification={pendingVerification}
        onSubmit={handleSubmit}
        onRegisterStart={startRegistration}
        onCheckRegisterCode={checkRegistrationCode}
        onCompleteRegistration={completeRegistration}
        onSaveProfile={saveProfile}
        onFinishRegistration={finishRegistration}
        onVerify={verify}
        onResend={resend}
        onRequestReset={requestReset}
        onCheckResetCode={checkResetCode}
        onCompleteReset={completeReset}
        onCancelVerification={cancelVerification}
        onSwitchMode={handleModeToggle}
        onGoogleCredential={loginWithGoogle}
        onBack={() => setShowAuth(false)}
      />
    );
  }

  return <LearnHome token={token} onLogout={logout} />;
};

export default App;
