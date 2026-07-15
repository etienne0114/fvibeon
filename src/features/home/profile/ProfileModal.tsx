import { useEffect, useState } from 'react';
import {
  Badge,
  Box,
  Button,
  Circle,
  Divider,
  Flex,
  FormControl,
  FormLabel,
  HStack,
  Icon,
  IconButton,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalOverlay,
  Select,
  SimpleGrid,
  Stack,
  Text,
  useToast,
} from '@chakra-ui/react';
import {
  FiUser,
  FiBookOpen,
  FiLock,
  FiLogOut,
  FiEye,
  FiEyeOff,
  FiAward,
  FiCheckCircle,
  FiMail,
  FiCalendar,
} from 'react-icons/fi';
import { MeUser } from '../../../hooks/useMe';
import { DashboardSummary } from '../../../hooks/useDashboard';
import { updateProfile, changePassword } from '../../../api/auth';
import { ink, inkSoft, rose, roseDeep, card, line, serif, sage, sageDeep, roseTint, sageTint, amber, amberTint, cream } from '../../../theme/brand';

const LANGS = [
  { id: 'en', label: 'English' },
  { id: 'rw', label: 'Kinyarwanda' },
  { id: 'fr', label: 'Français' },
];

const LEVELS = [
  { id: 'BEGINNER', label: 'Beginner' },
  { id: 'ELEMENTARY', label: 'Elementary' },
  { id: 'INTERMEDIATE', label: 'Intermediate' },
  { id: 'ADVANCED', label: 'Advanced' },
];

type Section = 'overview' | 'learning' | 'account' | 'security';

const NAV: { id: Section; label: string; icon: React.ElementType }[] = [
  { id: 'overview', label: 'Overview', icon: FiUser },
  { id: 'learning', label: 'Learning', icon: FiBookOpen },
  { id: 'account', label: 'Account', icon: FiMail },
  { id: 'security', label: 'Security', icon: FiLock },
];

const formatMinutes = (mins: number) => {
  if (!mins) return '0m';
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
};

const StatTile = ({ label, value }: { label: string; value: string | number }) => (
  <Box bg={card} border="1px solid" borderColor={line} borderRadius="xl" px={4} py={3} textAlign="center">
    <Text fontFamily={serif} fontWeight="700" fontSize="xl" color={ink}>
      {value}
    </Text>
    <Text fontSize="10px" color={inkSoft} fontWeight="600" textTransform="uppercase" letterSpacing="0.05em">
      {label}
    </Text>
  </Box>
);

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: MeUser | null;
  token?: string | null;
  dashboardSummary?: DashboardSummary | null;
  achievementsUnlocked?: number;
  onLogout?: () => void;
  onUserUpdated?: () => Promise<unknown> | void;
}

const ProfileModal = ({
  isOpen,
  onClose,
  user,
  token,
  dashboardSummary,
  achievementsUnlocked = 0,
  onLogout,
  onUserUpdated,
}: ProfileModalProps) => {
  const toast = useToast();
  const [section, setSection] = useState<Section>('overview');

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [savingAccount, setSavingAccount] = useState(false);

  const [learningLanguage, setLearningLanguage] = useState('en');
  const [preferredLanguage, setPreferredLanguage] = useState('en');
  const [proficiencyLevel, setProficiencyLevel] = useState('BEGINNER');
  const [dailyGoalMinutes, setDailyGoalMinutes] = useState(15);
  const [savingLearning, setSavingLearning] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    if (!user) return;
    setFirstName(user.firstName || '');
    setLastName(user.lastName || '');
    setLearningLanguage(user.learningLanguage || 'en');
    setPreferredLanguage(user.preferredLanguage || 'en');
    setProficiencyLevel(user.proficiencyLevel || 'BEGINNER');
    setDailyGoalMinutes(user.dailyGoalMinutes || 15);
  }, [user]);

  useEffect(() => {
    if (isOpen) setSection('overview');
  }, [isOpen]);

  const displayName = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.username || 'Learner';
  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : null;

  const saveAccount = async () => {
    if (!token) return;
    try {
      setSavingAccount(true);
      await updateProfile({ firstName: firstName.trim(), lastName: lastName.trim() }, token);
      await onUserUpdated?.();
      toast({ title: 'Profile updated', status: 'success', duration: 2000, position: 'top' });
    } catch (err: any) {
      toast({ title: err?.response?.data?.error || 'Could not save changes', status: 'error', duration: 2500, position: 'top' });
    } finally {
      setSavingAccount(false);
    }
  };

  const saveLearning = async () => {
    if (!token) return;
    try {
      setSavingLearning(true);
      await updateProfile({ learningLanguage, preferredLanguage, proficiencyLevel: proficiencyLevel as any, dailyGoalMinutes }, token);
      await onUserUpdated?.();
      toast({ title: 'Learning preferences saved', status: 'success', duration: 2000, position: 'top' });
    } catch (err: any) {
      toast({ title: err?.response?.data?.error || 'Could not save changes', status: 'error', duration: 2500, position: 'top' });
    } finally {
      setSavingLearning(false);
    }
  };

  const submitPasswordChange = async () => {
    setPasswordError(null);
    if (!currentPassword || !newPassword) {
      setPasswordError('Fill in both password fields.');
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords don't match.");
      return;
    }
    try {
      setChangingPassword(true);
      await changePassword({ currentPassword, newPassword });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      toast({ title: 'Password changed', status: 'success', duration: 2200, position: 'top' });
    } catch (err: any) {
      setPasswordError(err?.response?.data?.error || 'Could not change your password.');
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered size={{ base: 'full', sm: 'xl', md: '2xl' }} scrollBehavior="inside">
      <ModalOverlay bg="rgba(46,31,38,0.55)" backdropFilter="blur(2px)" />
      <ModalContent borderRadius={{ base: 0, sm: '2xl' }} overflow="hidden" maxH={{ base: '100vh', sm: '620px' }}>
        <ModalCloseButton color={{ base: 'white', md: ink }} zIndex={2} top={3} right={3} />
        <ModalBody p={0}>
          <Flex direction={{ base: 'column', md: 'row' }} minH={{ md: '620px' }}>
            {/* Sidebar */}
            <Flex
              direction="column"
              bg={ink}
              color="white"
              w={{ base: 'full', md: '220px' }}
              flexShrink={0}
              p={{ base: 4, md: 6 }}
            >
              <HStack spacing={3} mb={{ base: 4, md: 8 }}>
                <Circle size="56px" bg={roseTint} color={roseDeep} fontWeight="700" fontSize="xl" flexShrink={0}>
                  {displayName.charAt(0).toUpperCase()}
                </Circle>
                <Box minW={0}>
                  <Text fontWeight="700" fontSize="sm" isTruncated>
                    {displayName}
                  </Text>
                  <Text fontSize="xs" color="#B9A49A" isTruncated>
                    @{user?.username}
                  </Text>
                </Box>
              </HStack>

              <Stack spacing={1} flex={1} direction={{ base: 'row', md: 'column' }} overflowX={{ base: 'auto', md: 'visible' }}>
                {NAV.map((item) => {
                  const active = item.id === section;
                  return (
                    <HStack
                      key={item.id}
                      as="button"
                      onClick={() => setSection(item.id)}
                      spacing={3}
                      px={4}
                      py={2.5}
                      borderRadius="xl"
                      flexShrink={0}
                      bg={active ? 'rgba(255,255,255,0.1)' : 'transparent'}
                      color={active ? 'white' : '#B9A49A'}
                      transition="all 0.15s ease"
                      _hover={{ bg: 'rgba(255,255,255,0.08)', color: 'white' }}
                    >
                      <Icon as={item.icon} boxSize={4} />
                      <Text fontSize="sm" fontWeight={active ? '700' : '500'} whiteSpace="nowrap">
                        {item.label}
                      </Text>
                    </HStack>
                  );
                })}
              </Stack>

              <HStack
                as="button"
                onClick={onLogout}
                spacing={3}
                px={4}
                py={2.5}
                mt={{ base: 3, md: 4 }}
                borderRadius="xl"
                color="#B9A49A"
                _hover={{ bg: 'rgba(255,255,255,0.08)', color: 'white' }}
              >
                <Icon as={FiLogOut} boxSize={4} />
                <Text fontSize="sm" fontWeight="500">
                  Sign out
                </Text>
              </HStack>
            </Flex>

            {/* Content */}
            <Box flex={1} bg="white" p={{ base: 5, md: 8 }} overflowY="auto">
              {section === 'overview' && (
                <Stack spacing={6}>
                  <Box>
                    <Text fontFamily={serif} fontWeight="700" fontSize="xl" color={ink} mb={1}>
                      {displayName}
                    </Text>
                    <HStack spacing={2} color={inkSoft} fontSize="sm">
                      <Icon as={FiMail} boxSize={3.5} />
                      <Text>{user?.email}</Text>
                      {user?.emailVerified && (
                        <Badge bg={sageTint} color={sageDeep} borderRadius="full" px={2} py={0.5} fontSize="9px">
                          VERIFIED
                        </Badge>
                      )}
                    </HStack>
                    {memberSince && (
                      <HStack spacing={2} color={inkSoft} fontSize="sm" mt={1}>
                        <Icon as={FiCalendar} boxSize={3.5} />
                        <Text>Member since {memberSince}</Text>
                      </HStack>
                    )}
                    {user?.isPremium && (
                      <Badge mt={2} bg={amberTint} color={amber} borderRadius="full" px={3} py={1} fontSize="10px" fontWeight="700">
                        PREMIUM
                      </Badge>
                    )}
                  </Box>

                  <Box>
                    <Text fontSize="xs" fontWeight="700" color={inkSoft} mb={2} textTransform="uppercase" letterSpacing="0.05em">
                      Learning summary
                    </Text>
                    <SimpleGrid columns={2} spacing={3}>
                      <StatTile label="Day streak" value={dashboardSummary?.streakDays ?? 0} />
                      <StatTile label="Time learning" value={formatMinutes(dashboardSummary?.totalTimeMinutes ?? 0)} />
                      <StatTile label="Lessons done" value={dashboardSummary?.lessonsCompleted ?? 0} />
                      <StatTile label="Courses done" value={dashboardSummary?.completedCourses ?? 0} />
                    </SimpleGrid>
                  </Box>

                  <Box>
                    <Text fontSize="xs" fontWeight="700" color={inkSoft} mb={2} textTransform="uppercase" letterSpacing="0.05em">
                      Achievements
                    </Text>
                    <HStack bg={roseTint} borderRadius="xl" px={4} py={3} spacing={3}>
                      <Icon as={FiAward} color={roseDeep} boxSize={5} />
                      <Text fontSize="sm" color={ink}>
                        <Text as="span" fontWeight="700">
                          {achievementsUnlocked}
                        </Text>{' '}
                        unlocked so far
                      </Text>
                    </HStack>
                  </Box>
                </Stack>
              )}

              {section === 'learning' && (
                <Stack spacing={5} maxW="420px">
                  <Text fontFamily={serif} fontWeight="700" fontSize="xl" color={ink}>
                    Learning preferences
                  </Text>

                  <FormControl>
                    <FormLabel fontSize="sm" color={inkSoft}>
                      Learning language
                    </FormLabel>
                    <Select value={learningLanguage} onChange={(e) => setLearningLanguage(e.target.value)} borderColor={line}>
                      {LANGS.map((l) => (
                        <option key={l.id} value={l.id}>
                          {l.label}
                        </option>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl>
                    <FormLabel fontSize="sm" color={inkSoft}>
                      Native / preferred language
                    </FormLabel>
                    <Select value={preferredLanguage} onChange={(e) => setPreferredLanguage(e.target.value)} borderColor={line}>
                      {LANGS.map((l) => (
                        <option key={l.id} value={l.id}>
                          {l.label}
                        </option>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl>
                    <FormLabel fontSize="sm" color={inkSoft}>
                      Proficiency level
                    </FormLabel>
                    <Select value={proficiencyLevel} onChange={(e) => setProficiencyLevel(e.target.value)} borderColor={line}>
                      {LEVELS.map((l) => (
                        <option key={l.id} value={l.id}>
                          {l.label}
                        </option>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl>
                    <FormLabel fontSize="sm" color={inkSoft}>
                      Daily goal (minutes)
                    </FormLabel>
                    <Input
                      type="number"
                      min={5}
                      max={240}
                      value={dailyGoalMinutes}
                      onChange={(e) => setDailyGoalMinutes(Number(e.target.value))}
                      borderColor={line}
                    />
                  </FormControl>

                  <Button
                    onClick={saveLearning}
                    isLoading={savingLearning}
                    alignSelf="flex-start"
                    borderRadius="full"
                    bg={ink}
                    color="white"
                    _hover={{ bg: '#463039' }}
                    px={6}
                  >
                    Save preferences
                  </Button>
                </Stack>
              )}

              {section === 'account' && (
                <Stack spacing={5} maxW="420px">
                  <Text fontFamily={serif} fontWeight="700" fontSize="xl" color={ink}>
                    Account
                  </Text>

                  <HStack spacing={4}>
                    <FormControl>
                      <FormLabel fontSize="sm" color={inkSoft}>
                        First name
                      </FormLabel>
                      <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} borderColor={line} />
                    </FormControl>
                    <FormControl>
                      <FormLabel fontSize="sm" color={inkSoft}>
                        Last name
                      </FormLabel>
                      <Input value={lastName} onChange={(e) => setLastName(e.target.value)} borderColor={line} />
                    </FormControl>
                  </HStack>

                  <FormControl>
                    <FormLabel fontSize="sm" color={inkSoft}>
                      Username
                    </FormLabel>
                    <Input value={user?.username || ''} isReadOnly bg={card} borderColor={line} color={inkSoft} />
                  </FormControl>

                  <FormControl>
                    <FormLabel fontSize="sm" color={inkSoft}>
                      Email
                    </FormLabel>
                    <Input value={user?.email || ''} isReadOnly bg={card} borderColor={line} color={inkSoft} />
                  </FormControl>

                  <Button
                    onClick={saveAccount}
                    isLoading={savingAccount}
                    alignSelf="flex-start"
                    borderRadius="full"
                    bg={ink}
                    color="white"
                    _hover={{ bg: '#463039' }}
                    px={6}
                  >
                    Save changes
                  </Button>
                </Stack>
              )}

              {section === 'security' && (
                <Stack spacing={5} maxW="420px">
                  <Text fontFamily={serif} fontWeight="700" fontSize="xl" color={ink}>
                    Change password
                  </Text>

                  {passwordError && (
                    <Text fontSize="sm" color={roseDeep} fontWeight="600">
                      {passwordError}
                    </Text>
                  )}

                  <FormControl>
                    <FormLabel fontSize="sm" color={inkSoft}>
                      Current password
                    </FormLabel>
                    <Input
                      type={showPasswords ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      borderColor={line}
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel fontSize="sm" color={inkSoft}>
                      New password
                    </FormLabel>
                    <Input
                      type={showPasswords ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      borderColor={line}
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel fontSize="sm" color={inkSoft}>
                      Confirm new password
                    </FormLabel>
                    <Input
                      type={showPasswords ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      borderColor={line}
                    />
                  </FormControl>

                  <HStack spacing={3}>
                    <IconButton
                      aria-label={showPasswords ? 'Hide passwords' : 'Show passwords'}
                      icon={<Icon as={showPasswords ? FiEyeOff : FiEye} />}
                      onClick={() => setShowPasswords((v) => !v)}
                      variant="ghost"
                      borderRadius="full"
                      color={inkSoft}
                    />
                    <Button
                      onClick={submitPasswordChange}
                      isLoading={changingPassword}
                      borderRadius="full"
                      bg={ink}
                      color="white"
                      _hover={{ bg: '#463039' }}
                      px={6}
                    >
                      Update password
                    </Button>
                  </HStack>

                  <Divider borderColor={line} />
                  <HStack spacing={2} color={sageDeep} fontSize="xs">
                    <Icon as={FiCheckCircle} />
                    <Text>Your password is never shown or shared — it's stored securely, hashed.</Text>
                  </HStack>
                </Stack>
              )}
            </Box>
          </Flex>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default ProfileModal;
