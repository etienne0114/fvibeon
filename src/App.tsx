import { useEffect, useState } from 'react';
import AuthPage, { AuthMode } from './features/auth/AuthPage';
import LandingPage from './features/landing/LandingPage';
import LearnHome from './features/learn/home/LearnHome';
import PrivacyPolicyPage from './features/legal/PrivacyPolicyPage';
import CertificateVerifyPage from './features/certificates/CertificateVerifyPage';
import { useAuth } from './hooks';

const getVerifyCode = () => {
  if (typeof window === 'undefined') return null;
  const [hashPath, hashQuery] = window.location.hash.slice(1).split('?');
  if (hashPath !== 'verify-certificate') return null;
  return new URLSearchParams(hashQuery || '').get('code');
};

const App = () => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [showAuth, setShowAuth] = useState(
    () => typeof window !== 'undefined' && window.location.hash === '#auth',
  );
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [verifyCode, setVerifyCode] = useState(getVerifyCode);

  // A same-tab navigation between two #verify-certificate links (or clicking
  // "Back" then a new link) is a same-document hash change, not a reload —
  // without this listener the state above would never update past the
  // first code it was mounted with.
  useEffect(() => {
    const onHashChange = () => setVerifyCode(getVerifyCode());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);
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

  // A direct "#auth" link (e.g. from a re-engagement email) means "sign in
  // as me" — if a *different* account is already signed in on this browser,
  // silently continuing as them instead of prompting the intended recipient
  // to log in is the wrong outcome. Force a fresh sign-in whenever this
  // specific link is followed, regardless of who was already logged in.
  //
  // This only fires once, right when the link is followed — the hash gets
  // cleared from the URL immediately after, so a later reload of the same
  // tab (a real, still-valid session) doesn't get bounced back to login too.
  useEffect(() => {
    if (window.location.hash === '#auth') {
      if (token) logout();
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (payload: { email: string; password: string }) => {
    try {
      await authenticate(payload, 'login');
    } catch (_error) {
      // swallow: hook already exposes error message
    }
  };

  const handleModeToggle = () => setMode((prev) => (prev === 'login' ? 'register' : 'login'));

  if (verifyCode) {
    return (
      <CertificateVerifyPage
        code={verifyCode}
        onBack={() => {
          window.location.hash = '';
          setVerifyCode(null);
        }}
      />
    );
  }

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
