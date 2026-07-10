import { useState } from 'react';
import {
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Stack,
  Text,
  useColorModeValue,
} from '@chakra-ui/react';

export type AuthMode = 'login' | 'register';

interface AuthPanelProps {
  mode: AuthMode;
  loading?: boolean;
  error?: string | null;
  onSubmit: (payload: { email: string; password: string; username?: string }) => Promise<void>;
  onSwitchMode: () => void;
}

const AuthPanel = ({ mode, loading = false, error = null, onSubmit, onSwitchMode }: AuthPanelProps) => {
  const [email, setEmail] = useState('admin@vibeon.com');
  const [password, setPassword] = useState('Etienne2025');
  const [username, setUsername] = useState('etienne.vibeon');

  const handleSubmit = async () => {
    const payload: { email: string; password: string; username?: string } = { email, password };
    if (mode === 'register') {
      payload.username = username;
    }
    await onSubmit(payload);
  };

  return (
    <Flex align="center" justify="center" flex={1} py={{ base: 8, md: 16 }} px={4}>
      <Box
        bg={useColorModeValue('white', 'gray.700')}
        borderRadius="2xl"
        p={{ base: 8, md: 10 }}
        w="full"
        maxW="440px"
        boxShadow="premium"
        border="1px solid"
        borderColor={useColorModeValue('gray.100', 'gray.600')}
        position="relative"
        overflow="hidden"
      >
        <Box
          position="absolute"
          top={0}
          left={0}
          w="full"
          h="3px"
          bg="learning.500"
        />

        <Stack spacing={6}>
          <Stack spacing={2}>
            <Heading size="lg" color="gray.800" fontWeight="800" letterSpacing="tight">
              {mode === 'login' ? 'Welcome back' : 'Create your account'}
            </Heading>
            <Text fontSize="sm" color="gray.500" fontWeight="medium">
              {mode === 'login'
                ? 'Sign in to continue your learning journey'
                : 'Join Vibeon Learn and start your path'}
            </Text>
          </Stack>

          <Box bg="learning.50" p={3} borderRadius="lg" borderLeft="3px solid" borderColor="learning.400">
            <Text fontSize="xs" color="learning.700" fontWeight="medium">
              Demo: admin@vibeon.com / Etienne2025
            </Text>
          </Box>

          {mode === 'register' && (
            <FormControl>
              <FormLabel fontSize="sm" fontWeight="bold" color="gray.600">Username</FormLabel>
              <Input
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="etienne.vibeon"
                size="lg"
                borderRadius="xl"
              />
            </FormControl>
          )}
          <FormControl>
            <FormLabel fontSize="sm" fontWeight="bold" color="gray.600">Email</FormLabel>
            <Input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="admin@vibeon.com"
              size="lg"
              borderRadius="xl"
            />
          </FormControl>
          <FormControl>
            <FormLabel fontSize="sm" fontWeight="bold" color="gray.600">Password</FormLabel>
            <Input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
              size="lg"
              borderRadius="xl"
            />
          </FormControl>
          {error && (
            <Box bg="red.50" p={3} borderRadius="lg">
              <Text color="red.600" fontSize="sm" fontWeight="medium">
                {error}
              </Text>
            </Box>
          )}
          <Button
            colorScheme="learning"
            onClick={handleSubmit}
            isLoading={loading}
            loadingText={mode === 'login' ? 'Signing in' : 'Creating account'}
            size="lg"
            borderRadius="xl"
            fontWeight="bold"
          >
            {mode === 'login' ? 'Sign in' : 'Create account'}
          </Button>
          <Text textAlign="center" fontSize="sm" color="gray.500">
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <Button
              variant="link"
              onClick={onSwitchMode}
              color="learning.600"
              fontWeight="bold"
              fontSize="sm"
            >
              {mode === 'login' ? 'Sign up' : 'Sign in'}
            </Button>
          </Text>
        </Stack>
      </Box>
    </Flex>
  );
};

export default AuthPanel;
