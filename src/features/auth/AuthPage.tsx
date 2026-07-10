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
  Stack,
  Text,
} from '@chakra-ui/react';
import { ViewIcon, ViewOffIcon, ArrowBackIcon, CheckIcon } from '@chakra-ui/icons';
import { FiMessageCircle, FiGlobe, FiTarget } from 'react-icons/fi';

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
  onSubmit: (payload: { email: string; password: string; username?: string }) => Promise<void>;
  onVerify: (email: string, code: string) => Promise<void>;
  onResend: (email: string) => Promise<void>;
  onRequestReset: (email: string) => Promise<string>;
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
      window.google.accounts.id.renderButton(slotRef.current, {
        theme: 'outline',
        size: 'large',
        width: 360,
        shape: 'pill',
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
        borderRadius="full"
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
  return <Flex ref={slotRef} justify="center" minH="46px" />;
};

const AuthPage = ({
  mode,
  loading = false,
  error = null,
  pendingVerification = null,
  onSubmit,
  onVerify,
  onResend,
  onRequestReset,
  onCompleteReset,
  onCancelVerification,
  onSwitchMode,
  onGoogleCredential,
  onBack,
}: AuthPageProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [code, setCode] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [forgotStage, setForgotStage] = useState<null | 'email' | 'reset'>(null);
  const [resetMessage, setResetMessage] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);

  const isRegister = mode === 'register';
  const isVerifying = Boolean(pendingVerification) && !forgotStage;
  const isForgot = Boolean(forgotStage);

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
      setForgotStage('reset');
    }
  };

  const handleResendReset = async () => {
    if (resendCooldown > 0) return;
    setResendCooldown(30);
    await onRequestReset(email).catch(() => undefined);
  };

  const handleCompleteReset = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (code.length !== 6 || newPassword.length < 8) return;
    await onCompleteReset(email, code, newPassword).catch(() => undefined);
  };

  const exitForgot = () => {
    setForgotStage(null);
    setResetMessage('');
    setCode('');
    setNewPassword('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: { email: string; password: string; username?: string } = { email, password };
    if (isRegister) payload.username = username;
    await onSubmit(payload).catch(() => undefined);
  };

  return (
    <Grid minH="100vh" templateColumns={{ base: '1fr', lg: '1fr 1.1fr' }} bg={cream}>
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

      {/* ===== Right: form ===== */}
      <Flex align="center" justify="center" px={{ base: 5, md: 12 }} py={{ base: 8, md: 12 }}>
        <Box w="full" maxW="440px">
          <HStack justify="space-between" mb={{ base: 8, md: 10 }}>
            <Button
              onClick={onBack}
              variant="ghost"
              size="sm"
              color={inkSoft}
              leftIcon={<ArrowBackIcon />}
              _hover={{ bg: 'rgba(46,31,38,0.05)' }}
            >
              Home
            </Button>
            <Text display={{ base: 'block', lg: 'none' }} fontFamily={serif} fontWeight="700" fontSize="xl" color={ink}>
              Vibeon Learn
            </Text>
          </HStack>

          <Stack spacing={2} mb={8}>
            <Text fontFamily={serif} fontWeight="600" fontSize={{ base: '3xl', md: '4xl' }} color={ink} lineHeight="1.1">
              {forgotStage === 'email'
                ? 'Reset your password.'
                : forgotStage === 'reset'
                ? 'Check your email.'
                : isVerifying
                ? 'Check your email.'
                : isRegister
                ? 'Create your account.'
                : 'Welcome back.'}
            </Text>
            <Text color={inkSoft} fontSize="sm">
              {forgotStage === 'email'
                ? "Enter your account email and we'll send you a 6-digit reset code."
                : forgotStage === 'reset'
                ? `Enter the code we sent to ${email} and pick a new password.`
                : isVerifying
                ? `Enter the 6-digit code we sent to ${pendingVerification?.email}.`
                : isRegister
                ? 'Free forever. Your tutor is ready when you are.'
                : 'Pick up right where you left off — your streak misses you.'}
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
                    bg="white"
                    border="1px solid"
                    borderColor={line}
                    borderRadius="xl"
                    h="48px"
                    _focus={{ borderColor: rose, boxShadow: `0 0 0 1px ${rose}` }}
                    autoComplete="email"
                  />
                </FormControl>
                <Button
                  type="submit"
                  isLoading={loading}
                  isDisabled={!email}
                  h="50px"
                  borderRadius="full"
                  bg={ink}
                  color={cream}
                  fontWeight="600"
                  _hover={{ bg: '#db216f', transform: 'translateY(-1px)' }}
                >
                  Send reset code
                </Button>
                <Link fontSize="sm" color={inkSoft} textAlign="center" onClick={exitForgot}>
                  ← Back to sign in
                </Link>
              </Stack>
            </form>
          )}

          {forgotStage === 'reset' && (
            <form onSubmit={handleCompleteReset}>
              <Stack spacing={6}>
                {resetMessage && (
                  <Alert status="info" borderRadius="xl" fontSize="sm" bg="#EAF2EE" color={ink}>
                    <AlertIcon color={sage} />
                    {resetMessage}
                  </Alert>
                )}
                <HStack justify="center" spacing={{ base: 2, md: 3 }}>
                  <PinInput otp autoFocus size="lg" value={code} onChange={setCode} isDisabled={loading}>
                    {[0, 1, 2, 3, 4, 5].map((i) => (
                      <PinInputField
                        key={i}
                        bg="white"
                        border="1px solid"
                        borderColor={line}
                        borderRadius="xl"
                        fontWeight="700"
                        color={ink}
                        _focus={{ borderColor: rose, boxShadow: `0 0 0 1px ${rose}` }}
                      />
                    ))}
                  </PinInput>
                </HStack>
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
                      bg="white"
                      border="1px solid"
                      borderColor={line}
                      borderRadius="xl"
                      h="48px"
                      _focus={{ borderColor: rose, boxShadow: `0 0 0 1px ${rose}` }}
                      autoComplete="new-password"
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
                <Button
                  type="submit"
                  isLoading={loading}
                  isDisabled={code.length !== 6 || newPassword.length < 8}
                  h="50px"
                  borderRadius="full"
                  bg={ink}
                  color={cream}
                  fontWeight="600"
                  _hover={{ bg: '#463039', transform: 'translateY(-1px)' }}
                >
                  Reset password & sign in
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
                    onClick={handleResendReset}
                  >
                    {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
                  </Link>
                </HStack>
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
              <HStack justify="center" spacing={{ base: 2, md: 3 }}>
                <PinInput
                  otp
                  autoFocus
                  size="lg"
                  value={code}
                  onChange={setCode}
                  onComplete={(value) => handleVerify(value)}
                  isDisabled={loading}
                >
                  {[0, 1, 2, 3, 4, 5].map((i) => (
                    <PinInputField
                      key={i}
                      bg="white"
                      border="1px solid"
                      borderColor={line}
                      borderRadius="xl"
                      fontWeight="700"
                      color={ink}
                      _focus={{ borderColor: rose, boxShadow: `0 0 0 1px ${rose}` }}
                    />
                  ))}
                </PinInput>
              </HStack>
              <Button
                onClick={() => handleVerify()}
                isLoading={loading}
                isDisabled={code.length !== 6}
                h="50px"
                borderRadius="full"
                bg={ink}
                color={cream}
                fontWeight="600"
                _hover={{ bg: '#463039', transform: 'translateY(-1px)' }}
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

          {!isVerifying && !isForgot && (
          <>
          <form onSubmit={handleSubmit}>
            <Stack spacing={5}>
              {isRegister && (
                <FormControl isRequired>
                  <FormLabel fontSize="sm" fontWeight="600" color={ink}>
                    Username
                  </FormLabel>
                  <Input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. etienne.rw"
                    bg="white"
                    border="1px solid"
                    borderColor={line}
                    borderRadius="xl"
                    h="48px"
                    _focus={{ borderColor: rose, boxShadow: `0 0 0 1px ${rose}` }}
                    autoComplete="username"
                  />
                </FormControl>
              )}
              <FormControl isRequired>
                <FormLabel fontSize="sm" fontWeight="600" color={ink}>
                  Email
                </FormLabel>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  bg="white"
                  border="1px solid"
                  borderColor={line}
                  borderRadius="xl"
                  h="48px"
                  _focus={{ borderColor: rose, boxShadow: `0 0 0 1px ${rose}` }}
                  autoComplete="email"
                />
              </FormControl>
              <FormControl isRequired>
                <Flex justify="space-between" align="center">
                  <FormLabel fontSize="sm" fontWeight="600" color={ink}>
                    Password
                  </FormLabel>
                  {!isRegister && (
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
                  )}
                </Flex>
                <InputGroup>
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={isRegister ? 'At least 8 characters' : 'Your password'}
                    bg="white"
                    border="1px solid"
                    borderColor={line}
                    borderRadius="xl"
                    h="48px"
                    _focus={{ borderColor: rose, boxShadow: `0 0 0 1px ${rose}` }}
                    autoComplete={isRegister ? 'new-password' : 'current-password'}
                  />
                  <InputRightElement h="48px">
                    <Button variant="ghost" size="sm" onClick={() => setShowPassword((v) => !v)} color={inkSoft} tabIndex={-1}>
                      {showPassword ? <ViewOffIcon /> : <ViewIcon />}
                    </Button>
                  </InputRightElement>
                </InputGroup>
              </FormControl>

              <Button
                type="submit"
                isLoading={loading}
                h="50px"
                borderRadius="full"
                bg={ink}
                color={cream}
                fontWeight="600"
                _hover={{ bg: '#463039', transform: 'translateY(-1px)' }}
                _active={{ transform: 'translateY(0)' }}
              >
                {isRegister ? 'Create account' : 'Sign in'}
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
              {isRegister ? 'Already have an account?' : 'New to Vibeon Learn?'}
            </Text>
            <Link fontSize="sm" fontWeight="700" color={rose} onClick={onSwitchMode} _hover={{ color: roseDeep }}>
              {isRegister ? 'Sign in' : 'Create an account'}
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
    </Grid>
  );
};

export default AuthPage;
