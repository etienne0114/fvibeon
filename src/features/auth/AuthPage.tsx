import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  AlertIcon,
  Box,
  Button,
  Circle,
  Divider,
  Flex,
  FormControl,
  FormLabel,
  Grid,
  HStack,
  Icon,
  Input,
  InputGroup,
  InputRightElement,
  Link,
  PinInput,
  PinInputField,
  Select,
  SimpleGrid,
  Stack,
  Text,
} from '@chakra-ui/react';
import { ViewIcon, ViewOffIcon, ArrowBackIcon, CheckIcon } from '@chakra-ui/icons';
import { FiMessageCircle, FiGlobe, FiTarget } from 'react-icons/fi';
import type { ProfilePayload } from '../../api/auth';

export type AuthMode = 'login' | 'register';

const ink = '#2E1F26';
const inkSoft = '#5C4A52';
const rose = '#D9536F';
const roseDeep = '#C24560';
const cream = '#FBF3E9';
const line = '#E9D9C5';
const sage = '#7FA99B';
const amber = '#E9B36B';
const serif = '"Fraunces", Georgia, serif';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: { client_id: string; callback: (r: { credential: string }) => void }) => void;
          renderButton: (el: HTMLElement, options: Record<string, unknown>) => void;
        };
      };
    };
  }
}

export interface PendingVerification {
  email: string;
  message: string;
}

interface AuthPageProps {
  mode: AuthMode;
  loading?: boolean;
  error?: string | null;
  pendingVerification?: PendingVerification | null;
  onSubmit: (payload: { email: string; password: string }) => Promise<void>;
  onRegisterStart: (payload: {
    username: string;
    email: string;
    firstName?: string;
    lastName?: string;
  }) => Promise<string>;
  onCheckRegisterCode: (email: string, code: string) => Promise<string>;
  onCompleteRegistration: (email: string, code: string, password: string) => Promise<string>;
  onSaveProfile: (payload: ProfilePayload, token: string) => Promise<void>;
  onFinishRegistration: (token: string) => void;
  onVerify: (email: string, code: string) => Promise<void>;
  onResend: (email: string) => Promise<void>;
  onRequestReset: (email: string) => Promise<string>;
  onCheckResetCode: (email: string, code: string) => Promise<string>;
  onCompleteReset: (email: string, code: string, newPassword: string) => Promise<void>;
  onCancelVerification: () => void;
  onSwitchMode: () => void;
  onGoogleCredential: (credential: string) => Promise<void>;
  onBack: () => void;
}

const perks = [
  { icon: FiMessageCircle, tile: rose, title: 'AI tutor, 24/7', body: 'Corrections that explain the why.' },
  { icon: FiGlobe, tile: sage, title: 'Instant translator', body: '10+ languages, powered by vibeon_translator.' },
  { icon: FiTarget, tile: amber, title: 'Daily drills', body: 'Vocabulary, quizzes and roleplay.' },
];

const languages = [
  'English',
  'Kinyarwanda',
  'French',
  'Swahili',
  'Spanish',
  'German',
  'Portuguese',
  'Arabic',
  'Chinese',
  'Japanese',
];

const inputStyles = {
  bg: 'white',
  border: '1px solid',
  borderColor: line,
  borderRadius: 'xl',
  h: '48px',
  _focus: { borderColor: rose, boxShadow: `0 0 0 1px ${rose}` },
} as const;

const primaryButtonStyles = {
  h: '50px',
  borderRadius: 'xl',
  bg: ink,
  color: cream,
  fontWeight: '600',
  _hover: { bg: '#463039', transform: 'translateY(-1px)' },
  _active: { transform: 'translateY(0)' },
} as const;

const GoogleButton = ({ onCredential }: { onCredential: (credential: string) => Promise<void> }) => {
  const slotRef = useRef<HTMLDivElement>(null);
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) {
      setUnavailable(true);
      return;
    }
    const render = () => {
      if (!window.google || !slotRef.current) return;
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: (response) => {
          onCredential(response.credential).catch(() => undefined);
        },
      });
      // GSI accepts widths of 120–400px; size to the container so it never overflows small screens
      const slotWidth = slotRef.current.offsetWidth;
      window.google.accounts.id.renderButton(slotRef.current, {
        theme: 'outline',
        size: 'large',
        width: Math.max(200, Math.min(360, slotWidth || 360)),
        shape: 'rectangular',
        text: 'continue_with',
        logo_alignment: 'center',
      });
    };
    if (window.google) {
      render();
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.onload = render;
    script.onerror = () => setUnavailable(true);
    document.head.appendChild(script);
  }, [onCredential]);

  if (unavailable) {
    return (
      <Button
        w="full"
        h="46px"
        borderRadius="xl"
        variant="outline"
        borderColor={line}
        color={inkSoft}
        fontWeight="500"
        isDisabled
      >
        Google sign-in coming soon
      </Button>
    );
  }
  return <Flex ref={slotRef} justify="center" minH="46px" w="full" overflow="hidden" />;
};

const CodeInput = ({
  code,
  onChange,
  onComplete,
  disabled,
}: {
  code: string;
  onChange: (value: string) => void;
  onComplete: (value: string) => void;
  disabled: boolean;
}) => (
  <HStack justify="center" spacing={{ base: 1.5, sm: 2, md: 3 }}>
    <PinInput otp autoFocus size="lg" value={code} onChange={onChange} onComplete={onComplete} isDisabled={disabled}>
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <PinInputField
          key={i}
          bg="white"
          border="1px solid"
          borderColor={line}
          borderRadius="xl"
          fontWeight="700"
          color={ink}
          boxSize={{ base: '42px', sm: '48px' }}
          fontSize={{ base: 'md', sm: 'lg' }}
          _focus={{ borderColor: rose, boxShadow: `0 0 0 1px ${rose}` }}
        />
      ))}
    </PinInput>
  </HStack>
);

const registerSteps = ['Account', 'Verify', 'Password', 'Profile'];

const RegisterStepper = ({ active }: { active: number }) => (
  <HStack spacing={{ base: 2, sm: 3 }} mb={7}>
    {registerSteps.map((label, i) => (
      <HStack key={label} spacing={2} flex={i === active ? 'none' : 1} minW={0}>
        <Circle
          size="24px"
          bg={i <= active ? rose : 'transparent'}
          border="1.5px solid"
          borderColor={i <= active ? rose : line}
          color={i <= active ? 'white' : inkSoft}
          fontSize="11px"
          fontWeight="700"
          flexShrink={0}
        >
          {i < active ? <CheckIcon boxSize={2} /> : i + 1}
        </Circle>
        <Text
          fontSize="xs"
          fontWeight={i === active ? '700' : '500'}
          color={i === active ? ink : inkSoft}
          display={{ base: i === active ? 'block' : 'none', md: 'block' }}
          whiteSpace="nowrap"
        >
          {label}
        </Text>
        {i < registerSteps.length - 1 && (
          <Box flex={1} h="1.5px" bg={i < active ? rose : line} display={{ base: 'none', md: 'block' }} />
        )}
      </HStack>
    ))}
  </HStack>
);

type RegisterStage = null | 'code' | 'password' | 'profile';

const AuthPage = ({
  mode,
  loading = false,
  error = null,
  pendingVerification = null,
  onSubmit,
  onRegisterStart,
  onCheckRegisterCode,
  onCompleteRegistration,
  onSaveProfile,
  onFinishRegistration,
  onVerify,
  onResend,
  onRequestReset,
  onCheckResetCode,
  onCompleteReset,
  onCancelVerification,
  onSwitchMode,
  onGoogleCredential,
  onBack,
}: AuthPageProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [code, setCode] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [forgotStage, setForgotStage] = useState<null | 'email' | 'code' | 'password'>(null);
  const [resetMessage, setResetMessage] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  // Staged sign-up: null = identity form, then code → password → profile
  const [regStage, setRegStage] = useState<RegisterStage>(null);
  const [regMessage, setRegMessage] = useState('');
  const [regToken, setRegToken] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [nativeLanguage, setNativeLanguage] = useState('');
  const [learningLanguage, setLearningLanguage] = useState('');
  const [proficiencyLevel, setProficiencyLevel] = useState('');
  const [dailyGoal, setDailyGoal] = useState('');

  const isRegister = mode === 'register';
  const inRegisterFlow = isRegister && regStage !== null;
  const isVerifying = Boolean(pendingVerification) && !forgotStage && !inRegisterFlow;
  const isForgot = Boolean(forgotStage);
  const passwordsMismatch = confirmPassword.length > 0 && password !== confirmPassword;

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const handleVerify = async (value?: string) => {
    const finalCode = value ?? code;
    if (!pendingVerification || finalCode.length !== 6) return;
    await onVerify(pendingVerification.email, finalCode).catch(() => setCode(''));
  };

  const handleResend = async () => {
    if (!pendingVerification || resendCooldown > 0) return;
    setResendCooldown(30);
    await onResend(pendingVerification.email);
  };

  const handleSendReset = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!email) return;
    const message = await onRequestReset(email).catch(() => '');
    if (message) {
      setResetMessage(message);
      setCode('');
      setForgotStage('code');
    }
  };

  const handleCheckResetCode = async (value?: string) => {
    const finalCode = value ?? code;
    if (finalCode.length !== 6) return;
    const message = await onCheckResetCode(email, finalCode).catch(() => '');
    if (message) {
      setCode(finalCode);
      setResetMessage(message);
      setForgotStage('password');
    } else {
      setCode('');
    }
  };

  const handleCompleteReset = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (code.length !== 6 || newPassword.length < 8) return;
    await onCompleteReset(email, code, newPassword).catch(() => undefined);
  };

  const handleResendResetToCode = async () => {
    if (resendCooldown > 0) return;
    setResendCooldown(30);
    const message = await onRequestReset(email).catch(() => '');
    if (message) setResetMessage(message);
  };

  const exitForgot = () => {
    setForgotStage(null);
    setResetMessage('');
    setCode('');
    setNewPassword('');
  };

  // ---- Staged registration handlers ----
  const handleRegisterStart = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !email) return;
    const payload: { username: string; email: string; firstName?: string; lastName?: string } = {
      username,
      email,
    };
    if (firstName.trim()) payload.firstName = firstName.trim();
    if (lastName.trim()) payload.lastName = lastName.trim();
    const message = await onRegisterStart(payload).catch(() => '');
    if (message) {
      setRegMessage(message);
      setCode('');
      setRegStage('code');
    }
  };

  const handleRegisterCode = async (value?: string) => {
    const finalCode = value ?? code;
    if (finalCode.length !== 6) return;
    const message = await onCheckRegisterCode(email, finalCode).catch(() => '');
    if (message) {
      setCode(finalCode);
      setRegMessage(message);
      setPassword('');
      setConfirmPassword('');
      setRegStage('password');
    } else {
      setCode('');
    }
  };

  const handleResendRegisterCode = async () => {
    if (resendCooldown > 0) return;
    setResendCooldown(30);
    await onResend(email);
  };

  const handleCreatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8 || password !== confirmPassword) return;
    const token = await onCompleteRegistration(email, code, password).catch(() => '');
    if (token) {
      setRegToken(token);
      setRegStage('profile');
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: ProfilePayload = {};
    if (nativeLanguage) payload.preferredLanguage = nativeLanguage;
    if (learningLanguage) payload.learningLanguage = learningLanguage;
    if (proficiencyLevel) payload.proficiencyLevel = proficiencyLevel as ProfilePayload['proficiencyLevel'];
    if (dailyGoal) payload.dailyGoalMinutes = Number(dailyGoal);
    if (Object.keys(payload).length > 0) {
      const ok = await onSaveProfile(payload, regToken)
        .then(() => true)
        .catch(() => false);
      if (!ok) return;
    }
    onFinishRegistration(regToken);
  };

  const exitRegister = () => {
    setRegStage(null);
    setRegMessage('');
    setRegToken('');
    setCode('');
    setPassword('');
    setConfirmPassword('');
  };

  const handleSwitchMode = () => {
    exitRegister();
    onSwitchMode();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isRegister) return; // registration goes through the staged flow
    await onSubmit({ email, password }).catch(() => undefined);
  };

  const heading = forgotStage === 'email'
    ? 'Reset your password.'
    : forgotStage === 'code' || (isRegister && regStage === 'code')
    ? 'Check your email.'
    : forgotStage === 'password'
    ? 'Choose a new password.'
    : isRegister && regStage === 'password'
    ? 'Create your password.'
    : isRegister && regStage === 'profile'
    ? 'About you.'
    : isVerifying
    ? 'Check your email.'
    : isRegister
    ? 'Create your account.'
    : 'Welcome back.';

  const subheading = forgotStage === 'email'
    ? "Enter your account email and we'll send you a 6-digit reset code."
    : forgotStage === 'code'
    ? `Enter the 6-digit code we sent to ${email}.`
    : forgotStage === 'password'
    ? 'Code confirmed. Pick a strong new password for your account.'
    : isRegister && regStage === 'code'
    ? `Enter the 6-digit code we sent to ${email}.`
    : isRegister && regStage === 'password'
    ? 'Email verified! Choose a strong password to secure your account.'
    : isRegister && regStage === 'profile'
    ? 'Optional — this helps us personalize your learning. You can always add it later.'
    : isVerifying
    ? `Enter the 6-digit code we sent to ${pendingVerification?.email}.`
    : isRegister
    ? "No password needed yet — we'll verify your email first."
    : 'Pick up right where you left off — your streak misses you.';

  const registerStepIndex = regStage === 'code' ? 1 : regStage === 'password' ? 2 : regStage === 'profile' ? 3 : 0;

  return (
    <Grid minH="100dvh" templateColumns={{ base: '1fr', lg: '1fr 1.1fr' }} bg={cream}>
      {/* ===== Left: brand panel (hidden on small screens) ===== */}
      <Flex
        display={{ base: 'none', lg: 'flex' }}
        direction="column"
        justify="space-between"
        bg={ink}
        color={cream}
        p={{ lg: 12, xl: 16 }}
        position="relative"
        overflow="hidden"
      >
        <Box position="absolute" top="-120px" right="-120px" w="340px" h="340px" borderRadius="full" bg={roseDeep} opacity={0.25} />
        <Box position="absolute" bottom="-140px" left="-100px" w="380px" h="380px" borderRadius="full" bg={amber} opacity={0.14} />

        <Link
          onClick={onBack}
          fontFamily={serif}
          fontWeight="700"
          fontSize="2xl"
          color="white"
          _hover={{ textDecoration: 'none', color: '#F3C9D2' }}
        >
          Vibeon Learn
        </Link>

        <Stack spacing={10} maxW="440px" zIndex={1}>
          <Text fontFamily={serif} fontWeight="600" fontSize={{ lg: '4xl', xl: '5xl' }} lineHeight="1.15">
            Speak boldly.{' '}
            <Box as="span" fontStyle="italic" color="#F3A0B2">
              Learn daily.
            </Box>
          </Text>
          <Stack spacing={6}>
            {perks.map((perk) => (
              <HStack key={perk.title} spacing={4} align="flex-start">
                <Flex w="42px" h="42px" align="center" justify="center" borderRadius="xl" bg={perk.tile} color="white" flexShrink={0}>
                  <Icon as={perk.icon} boxSize={4} />
                </Flex>
                <Box>
                  <Text fontWeight="700" color="white">
                    {perk.title}
                  </Text>
                  <Text fontSize="sm" color="#D8C7BC">
                    {perk.body}
                  </Text>
                </Box>
              </HStack>
            ))}
          </Stack>
          <Box bg="rgba(255,255,255,0.07)" border="1px solid rgba(255,255,255,0.12)" borderRadius="2xl" p={5}>
            <Text fontSize="sm" fontStyle="italic" lineHeight="1.7" color="#EADDD3">
              "Niga buhoro buhoro ariko buri munsi." — I learn slowly, but every day.
            </Text>
            <HStack mt={3} spacing={2}>
              <CheckIcon boxSize={3} color="#9BC4B3" />
              <Text fontSize="xs" color="#D8C7BC">
                Your first phrase — the tutor will teach you the rest.
              </Text>
            </HStack>
          </Box>
        </Stack>

        <Text fontSize="sm" color="#B9A49A" zIndex={1}>
          Learn in 10+ languages · Anywhere
        </Text>
      </Flex>

      {/* ===== Right: header pinned to the top, form centered below ===== */}
      <Flex direction="column" px={{ base: 4, sm: 8, md: 12 }} py={{ base: 5, md: 6 }}>
        <HStack justify="space-between" align="center">
          <Button
            onClick={onBack}
            variant="ghost"
            size="sm"
            color={inkSoft}
            borderRadius="lg"
            leftIcon={<ArrowBackIcon />}
            _hover={{ bg: 'rgba(46,31,38,0.05)' }}
          >
            Home
          </Button>
          <Text display={{ base: 'block', lg: 'none' }} fontFamily={serif} fontWeight="700" fontSize="xl" color={ink}>
            Vibeon Learn
          </Text>
        </HStack>

        <Flex flex={1} align="center" justify="center" py={{ base: 8, md: 10 }}>
          <Box w="full" maxW="440px">
            {inRegisterFlow || (isRegister && !isVerifying && !isForgot) ? (
              <RegisterStepper active={registerStepIndex} />
            ) : null}

            <Stack spacing={2} mb={8}>
              <Text fontFamily={serif} fontWeight="600" fontSize={{ base: '3xl', md: '4xl' }} color={ink} lineHeight="1.1">
                {heading}
              </Text>
              <Text color={inkSoft} fontSize="sm">
                {subheading}
              </Text>
            </Stack>

            {error && (
              <Alert status="error" borderRadius="xl" mb={6} fontSize="sm">
                <AlertIcon />
                {error}
              </Alert>
            )}

            {forgotStage === 'email' && (
              <form onSubmit={handleSendReset}>
                <Stack spacing={5}>
                  <FormControl isRequired>
                    <FormLabel fontSize="sm" fontWeight="600" color={ink}>
                      Email
                    </FormLabel>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      autoComplete="email"
                      {...inputStyles}
                    />
                  </FormControl>
                  <Button type="submit" isLoading={loading} isDisabled={!email} {...primaryButtonStyles}>
                    Send reset code
                  </Button>
                  <Link fontSize="sm" color={inkSoft} textAlign="center" onClick={exitForgot}>
                    ← Back to sign in
                  </Link>
                </Stack>
              </form>
            )}

            {forgotStage === 'code' && (
              <Stack spacing={6}>
                {resetMessage && (
                  <Alert status="info" borderRadius="xl" fontSize="sm" bg="#EAF2EE" color={ink}>
                    <AlertIcon color={sage} />
                    {resetMessage}
                  </Alert>
                )}
                <CodeInput code={code} onChange={setCode} onComplete={(value) => handleCheckResetCode(value)} disabled={loading} />
                <Button
                  onClick={() => handleCheckResetCode()}
                  isLoading={loading}
                  isDisabled={code.length !== 6}
                  {...primaryButtonStyles}
                >
                  Verify code
                </Button>
                <HStack justify="center" spacing={1}>
                  <Text fontSize="sm" color={inkSoft}>
                    Didn't get it?
                  </Text>
                  <Link
                    fontSize="sm"
                    fontWeight="700"
                    color={resendCooldown > 0 ? inkSoft : rose}
                    pointerEvents={resendCooldown > 0 ? 'none' : 'auto'}
                    onClick={handleResendResetToCode}
                  >
                    {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
                  </Link>
                </HStack>
                <Link fontSize="sm" color={inkSoft} textAlign="center" onClick={exitForgot}>
                  ← Back to sign in
                </Link>
              </Stack>
            )}

            {forgotStage === 'password' && (
              <form onSubmit={handleCompleteReset}>
                <Stack spacing={6}>
                  <Alert status="success" borderRadius="xl" fontSize="sm" bg="#EAF2EE" color={ink}>
                    <AlertIcon color={sage} />
                    {resetMessage || 'Code verified — choose your new password.'}
                  </Alert>
                  <FormControl isRequired>
                    <FormLabel fontSize="sm" fontWeight="600" color={ink}>
                      New password
                    </FormLabel>
                    <InputGroup>
                      <Input
                        type={showNewPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="At least 8 characters"
                        autoComplete="new-password"
                        autoFocus
                        {...inputStyles}
                      />
                      <InputRightElement h="48px">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowNewPassword((v) => !v)}
                          color={inkSoft}
                          tabIndex={-1}
                          aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                        >
                          {showNewPassword ? <ViewOffIcon /> : <ViewIcon />}
                        </Button>
                      </InputRightElement>
                    </InputGroup>
                  </FormControl>
                  <Button type="submit" isLoading={loading} isDisabled={newPassword.length < 8} {...primaryButtonStyles}>
                    Reset password & sign in
                  </Button>
                  <Link fontSize="sm" color={inkSoft} textAlign="center" onClick={exitForgot}>
                    ← Back to sign in
                  </Link>
                </Stack>
              </form>
            )}

            {isVerifying && pendingVerification && (
              <Stack spacing={6}>
                <Alert status="info" borderRadius="xl" fontSize="sm" bg="#EAF2EE" color={ink}>
                  <AlertIcon color={sage} />
                  {pendingVerification.message}
                </Alert>
                <CodeInput code={code} onChange={setCode} onComplete={(value) => handleVerify(value)} disabled={loading} />
                <Button
                  onClick={() => handleVerify()}
                  isLoading={loading}
                  isDisabled={code.length !== 6}
                  {...primaryButtonStyles}
                >
                  Verify & start learning
                </Button>
                <HStack justify="center" spacing={1}>
                  <Text fontSize="sm" color={inkSoft}>
                    Didn't get it?
                  </Text>
                  <Link
                    fontSize="sm"
                    fontWeight="700"
                    color={resendCooldown > 0 ? inkSoft : rose}
                    pointerEvents={resendCooldown > 0 ? 'none' : 'auto'}
                    onClick={handleResend}
                  >
                    {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
                  </Link>
                </HStack>
                <Link fontSize="sm" color={inkSoft} textAlign="center" onClick={onCancelVerification}>
                  ← Use a different account
                </Link>
              </Stack>
            )}

            {/* ===== Register step 2: verify email code ===== */}
            {isRegister && regStage === 'code' && !isForgot && (
              <Stack spacing={6}>
                {regMessage && (
                  <Alert status="info" borderRadius="xl" fontSize="sm" bg="#EAF2EE" color={ink}>
                    <AlertIcon color={sage} />
                    {regMessage}
                  </Alert>
                )}
                <CodeInput code={code} onChange={setCode} onComplete={(value) => handleRegisterCode(value)} disabled={loading} />
                <Button
                  onClick={() => handleRegisterCode()}
                  isLoading={loading}
                  isDisabled={code.length !== 6}
                  {...primaryButtonStyles}
                >
                  Verify code
                </Button>
                <HStack justify="center" spacing={1}>
                  <Text fontSize="sm" color={inkSoft}>
                    Didn't get it?
                  </Text>
                  <Link
                    fontSize="sm"
                    fontWeight="700"
                    color={resendCooldown > 0 ? inkSoft : rose}
                    pointerEvents={resendCooldown > 0 ? 'none' : 'auto'}
                    onClick={handleResendRegisterCode}
                  >
                    {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
                  </Link>
                </HStack>
                <Link fontSize="sm" color={inkSoft} textAlign="center" onClick={exitRegister}>
                  ← Edit my details
                </Link>
              </Stack>
            )}

            {/* ===== Register step 3: create password ===== */}
            {isRegister && regStage === 'password' && !isForgot && (
              <form onSubmit={handleCreatePassword}>
                <Stack spacing={5}>
                  <Alert status="success" borderRadius="xl" fontSize="sm" bg="#EAF2EE" color={ink}>
                    <AlertIcon color={sage} />
                    {regMessage || 'Email verified — now choose your password.'}
                  </Alert>
                  <FormControl isRequired>
                    <FormLabel fontSize="sm" fontWeight="600" color={ink}>
                      New password
                    </FormLabel>
                    <InputGroup>
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="At least 8 characters"
                        autoComplete="new-password"
                        autoFocus
                        {...inputStyles}
                      />
                      <InputRightElement h="48px">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowPassword((v) => !v)}
                          color={inkSoft}
                          tabIndex={-1}
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                        >
                          {showPassword ? <ViewOffIcon /> : <ViewIcon />}
                        </Button>
                      </InputRightElement>
                    </InputGroup>
                  </FormControl>
                  <FormControl isRequired isInvalid={passwordsMismatch}>
                    <FormLabel fontSize="sm" fontWeight="600" color={ink}>
                      Confirm password
                    </FormLabel>
                    <InputGroup>
                      <Input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Repeat your password"
                        autoComplete="new-password"
                        {...inputStyles}
                        borderColor={passwordsMismatch ? roseDeep : line}
                      />
                      <InputRightElement h="48px">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowConfirmPassword((v) => !v)}
                          color={inkSoft}
                          tabIndex={-1}
                          aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                        >
                          {showConfirmPassword ? <ViewOffIcon /> : <ViewIcon />}
                        </Button>
                      </InputRightElement>
                    </InputGroup>
                    {passwordsMismatch && (
                      <Text fontSize="xs" color={roseDeep} mt={1.5}>
                        Passwords don't match yet.
                      </Text>
                    )}
                  </FormControl>
                  <Button
                    type="submit"
                    isLoading={loading}
                    isDisabled={password.length < 8 || password !== confirmPassword}
                    {...primaryButtonStyles}
                  >
                    Create password & continue
                  </Button>
                </Stack>
              </form>
            )}

            {/* ===== Register step 4: optional basics ===== */}
            {isRegister && regStage === 'profile' && !isForgot && (
              <form onSubmit={handleSaveProfile}>
                <Stack spacing={5}>
                  <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={4}>
                    <FormControl>
                      <FormLabel fontSize="sm" fontWeight="600" color={ink}>
                        I speak
                      </FormLabel>
                      <Select
                        placeholder="Select language"
                        value={nativeLanguage}
                        onChange={(e) => setNativeLanguage(e.target.value)}
                        {...inputStyles}
                      >
                        {languages.map((l) => (
                          <option key={l} value={l}>
                            {l}
                          </option>
                        ))}
                      </Select>
                    </FormControl>
                    <FormControl>
                      <FormLabel fontSize="sm" fontWeight="600" color={ink}>
                        I want to learn
                      </FormLabel>
                      <Select
                        placeholder="Select language"
                        value={learningLanguage}
                        onChange={(e) => setLearningLanguage(e.target.value)}
                        {...inputStyles}
                      >
                        {languages.map((l) => (
                          <option key={l} value={l}>
                            {l}
                          </option>
                        ))}
                      </Select>
                    </FormControl>
                  </SimpleGrid>
                  <FormControl>
                    <FormLabel fontSize="sm" fontWeight="600" color={ink}>
                      My level
                    </FormLabel>
                    <Select
                      placeholder="Select level"
                      value={proficiencyLevel}
                      onChange={(e) => setProficiencyLevel(e.target.value)}
                      {...inputStyles}
                    >
                      <option value="BEGINNER">Beginner — just starting out</option>
                      <option value="ELEMENTARY">Elementary — I know some basics</option>
                      <option value="INTERMEDIATE">Intermediate — I can hold a conversation</option>
                      <option value="ADVANCED">Advanced — polishing my fluency</option>
                    </Select>
                  </FormControl>
                  <FormControl>
                    <FormLabel fontSize="sm" fontWeight="600" color={ink}>
                      Daily goal
                    </FormLabel>
                    <Select
                      placeholder="Select daily goal"
                      value={dailyGoal}
                      onChange={(e) => setDailyGoal(e.target.value)}
                      {...inputStyles}
                    >
                      <option value="5">5 min — casual</option>
                      <option value="10">10 min — regular</option>
                      <option value="20">20 min — serious</option>
                      <option value="30">30 min — intense</option>
                      <option value="60">60 min — all in</option>
                    </Select>
                  </FormControl>
                  <Button type="submit" isLoading={loading} {...primaryButtonStyles}>
                    Save & start learning
                  </Button>
                  <Link
                    fontSize="sm"
                    fontWeight="600"
                    color={inkSoft}
                    textAlign="center"
                    onClick={() => onFinishRegistration(regToken)}
                  >
                    Skip for now — I'll add it later
                  </Link>
                </Stack>
              </form>
            )}

            {/* ===== Register step 1: identity (no password yet) ===== */}
            {isRegister && regStage === null && !isVerifying && !isForgot && (
              <>
                <form onSubmit={handleRegisterStart}>
                  <Stack spacing={5}>
                    <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={4}>
                      <FormControl>
                        <FormLabel fontSize="sm" fontWeight="600" color={ink}>
                          First name
                        </FormLabel>
                        <Input
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          placeholder="Etienne"
                          autoComplete="given-name"
                          {...inputStyles}
                        />
                      </FormControl>
                      <FormControl>
                        <FormLabel fontSize="sm" fontWeight="600" color={ink}>
                          Last name
                        </FormLabel>
                        <Input
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          placeholder="Tuyihamye"
                          autoComplete="family-name"
                          {...inputStyles}
                        />
                      </FormControl>
                    </SimpleGrid>
                    <FormControl isRequired>
                      <FormLabel fontSize="sm" fontWeight="600" color={ink}>
                        Username
                      </FormLabel>
                      <Input
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="e.g. etienne.rw"
                        autoComplete="username"
                        {...inputStyles}
                      />
                    </FormControl>
                    <FormControl isRequired>
                      <FormLabel fontSize="sm" fontWeight="600" color={ink}>
                        Email
                      </FormLabel>
                      <Input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        autoComplete="email"
                        {...inputStyles}
                      />
                    </FormControl>
                    <Button
                      type="submit"
                      isLoading={loading}
                      isDisabled={!username || !email}
                      {...primaryButtonStyles}
                    >
                      Continue — verify my email
                    </Button>
                  </Stack>
                </form>

                <HStack my={6}>
                  <Divider borderColor={line} />
                  <Text fontSize="xs" color={inkSoft} whiteSpace="nowrap" px={2}>
                    or continue with
                  </Text>
                  <Divider borderColor={line} />
                </HStack>

                <GoogleButton onCredential={onGoogleCredential} />

                <HStack justify="center" mt={8} spacing={1}>
                  <Text fontSize="sm" color={inkSoft}>
                    Already have an account?
                  </Text>
                  <Link fontSize="sm" fontWeight="700" color={rose} onClick={handleSwitchMode} _hover={{ color: roseDeep }}>
                    Sign in
                  </Link>
                </HStack>
              </>
            )}

            {/* ===== Login form ===== */}
            {!isRegister && !isVerifying && !isForgot && (
              <>
                <form onSubmit={handleSubmit}>
                  <Stack spacing={5}>
                    <FormControl isRequired>
                      <FormLabel fontSize="sm" fontWeight="600" color={ink}>
                        Email
                      </FormLabel>
                      <Input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        autoComplete="email"
                        {...inputStyles}
                      />
                    </FormControl>
                    <FormControl isRequired>
                      <Flex justify="space-between" align="center">
                        <FormLabel fontSize="sm" fontWeight="600" color={ink}>
                          Password
                        </FormLabel>
                        <Link
                          fontSize="sm"
                          fontWeight="600"
                          color={rose}
                          mb={2}
                          onClick={() => {
                            setForgotStage('email');
                            setCode('');
                          }}
                        >
                          Forgot password?
                        </Link>
                      </Flex>
                      <InputGroup>
                        <Input
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Your password"
                          autoComplete="current-password"
                          {...inputStyles}
                        />
                        <InputRightElement h="48px">
                          <Button variant="ghost" size="sm" onClick={() => setShowPassword((v) => !v)} color={inkSoft} tabIndex={-1}>
                            {showPassword ? <ViewOffIcon /> : <ViewIcon />}
                          </Button>
                        </InputRightElement>
                      </InputGroup>
                    </FormControl>

                    <Button type="submit" isLoading={loading} {...primaryButtonStyles}>
                      Sign in
                    </Button>
                  </Stack>
                </form>

                <HStack my={6}>
                  <Divider borderColor={line} />
                  <Text fontSize="xs" color={inkSoft} whiteSpace="nowrap" px={2}>
                    or continue with
                  </Text>
                  <Divider borderColor={line} />
                </HStack>

                <GoogleButton onCredential={onGoogleCredential} />

                <HStack justify="center" mt={8} spacing={1}>
                  <Text fontSize="sm" color={inkSoft}>
                    New to Vibeon Learn?
                  </Text>
                  <Link fontSize="sm" fontWeight="700" color={rose} onClick={handleSwitchMode} _hover={{ color: roseDeep }}>
                    Create an account
                  </Link>
                </HStack>
              </>
            )}

            <HStack justify="center" mt={10} spacing={2} color={inkSoft} fontSize="xs">
              <Circle size="6px" bg={sage} />
              <Text>Private by default — we never share your data.</Text>
            </HStack>
          </Box>
        </Flex>
      </Flex>
    </Grid>
  );
};

export default AuthPage;
