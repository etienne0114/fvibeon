import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  AlertIcon,
  Badge,
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  HStack,
  Icon,
  IconButton,
  Input,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Radio,
  RadioGroup,
  Skeleton,
  Stack,
  Text,
  Textarea,
  useBreakpointValue,
  useToast,
} from '@chakra-ui/react';
import {
  FiPlus,
  FiLock,
  FiGlobe,
  FiHash,
  FiMessageSquare,
  FiLink,
  FiUserPlus,
  FiUsers,
  FiCheck,
  FiX,
  FiArrowLeft,
  FiSettings,
  FiTrash2,
  FiEdit2,
  FiMoreVertical,
  FiLogOut,
} from 'react-icons/fi';
import {
  fetchSpaces,
  fetchSpace,
  createSpace,
  joinSpace,
  joinViaInvite,
  createInvite,
  leaveSpace,
  createChannel,
  updateChannel,
  deleteChannel,
  SpaceSummary,
  SpaceDetail,
  PrivateSpaceLocked,
  ChannelSummary,
} from '../../api/spaces';
import { ChannelThread } from './MessageThread';
import SpaceSettingsModal from './SpaceSettingsModal';
import { ConfirmModal } from './shared';
import { ink, inkSoft, rose, card, line, serif, sageDeep, sageTint } from '../../theme/brand';

/* ---------------- Create Space modal ---------------- */
const CreateSpaceModal = ({ isOpen, onClose, onCreated }: { isOpen: boolean; onClose: () => void; onCreated: (id: string) => void }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState<'PUBLIC' | 'PRIVATE'>('PUBLIC');
  const [submitting, setSubmitting] = useState(false);
  const toast = useToast();

  const submit = async () => {
    try {
      setSubmitting(true);
      const space = await createSpace(name, description, visibility);
      onCreated(space.id);
      onClose();
      setName('');
      setDescription('');
    } catch (err: any) {
      toast({ title: err?.response?.data?.error || 'Could not create space', status: 'error', duration: 3000, position: 'top' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered>
      <ModalOverlay />
      <ModalContent borderRadius="xl">
        <ModalHeader fontFamily={serif}>Create a space</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Stack spacing={4}>
            <FormControl>
              <FormLabel fontSize="sm" color={inkSoft}>
                Name
              </FormLabel>
              <Input value={name} onChange={(e) => setName(e.target.value)} borderColor={line} placeholder="e.g. English Speaking Club" />
            </FormControl>
            <FormControl>
              <FormLabel fontSize="sm" color={inkSoft}>
                Description
              </FormLabel>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} borderColor={line} rows={2} />
            </FormControl>
            <FormControl>
              <FormLabel fontSize="sm" color={inkSoft}>
                Visibility
              </FormLabel>
              <RadioGroup value={visibility} onChange={(v) => setVisibility(v as 'PUBLIC' | 'PRIVATE')}>
                <Stack spacing={2}>
                  <Radio value="PUBLIC">
                    <Text fontSize="sm">
                      <strong>Public</strong> — listed for everyone, anyone can join
                    </Text>
                  </Radio>
                  <Radio value="PRIVATE">
                    <Text fontSize="sm">
                      <strong>Private</strong> — not listed, joinable only via invite link
                    </Text>
                  </Radio>
                </Stack>
              </RadioGroup>
            </FormControl>
          </Stack>
        </ModalBody>
        <ModalFooter>
          <Button
            bg={ink}
            color="white"
            _hover={{ bg: '#463039' }}
            borderRadius="full"
            px={6}
            isDisabled={!name.trim()}
            isLoading={submitting}
            onClick={submit}
          >
            Create
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

/* ---------------- Join via invite ---------------- */
const JoinViaInvite = ({ onJoined }: { onJoined: (spaceId: string) => void }) => {
  const [code, setCode] = useState('');
  const [joining, setJoining] = useState(false);
  const toast = useToast();

  const submit = async () => {
    try {
      setJoining(true);
      const result = await joinViaInvite(code.trim().toUpperCase());
      onJoined(result.spaceId);
      setCode('');
      toast({ title: 'Joined!', status: 'success', duration: 2000, position: 'top' });
    } catch (err: any) {
      toast({ title: err?.response?.data?.error || 'Invalid invite code', status: 'error', duration: 3000, position: 'top' });
    } finally {
      setJoining(false);
    }
  };

  return (
    <HStack spacing={2}>
      <Input
        size="sm"
        placeholder="Have an invite code?"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        borderColor={line}
      />
      <IconButton
        aria-label="Join with invite code"
        icon={<FiLink />}
        size="sm"
        isDisabled={!code.trim()}
        isLoading={joining}
        onClick={submit}
      />
    </HStack>
  );
};

/* ---------------- Space list (left column) ---------------- */
const SpaceList = ({
  spaces,
  selectedSpaceId,
  onSelect,
  onCreateClick,
  onJoined,
}: {
  spaces: SpaceSummary[];
  selectedSpaceId: string | null;
  onSelect: (id: string) => void;
  onCreateClick: () => void;
  onJoined: (id: string) => void;
}) => (
  <Stack spacing={3}>
    <Button size="sm" leftIcon={<FiPlus />} bg={ink} color="white" _hover={{ bg: '#463039' }} borderRadius="full" onClick={onCreateClick}>
      Create a space
    </Button>
    <JoinViaInvite onJoined={onJoined} />
    <Stack spacing={1.5} maxH={{ base: 'none', lg: '60vh' }} overflowY="auto">
      {spaces.map((s) => (
        <HStack
          key={s.id}
          as="button"
          onClick={() => onSelect(s.id)}
          justify="space-between"
          bg={s.id === selectedSpaceId ? card : 'white'}
          border="1px solid"
          borderColor={s.id === selectedSpaceId ? ink : line}
          borderRadius="lg"
          px={3}
          py={2.5}
          textAlign="left"
        >
          <HStack spacing={2} minW={0}>
            <Icon as={s.visibility === 'PRIVATE' ? FiLock : FiGlobe} boxSize={3.5} color={inkSoft} flexShrink={0} />
            <Box minW={0}>
              <Text fontSize="sm" fontWeight="600" color={ink} noOfLines={1}>
                {s.name}
              </Text>
              <Text fontSize="xs" color={inkSoft}>
                {s._count.memberships} members · {s._count.channels} channels
              </Text>
            </Box>
          </HStack>
          {s.myRole && (
            <Badge fontSize="9px" bg={sageTint} color={sageDeep} borderRadius="full" px={2}>
              {s.myRole}
            </Badge>
          )}
        </HStack>
      ))}
      {spaces.length === 0 && (
        <Text fontSize="sm" color={inkSoft} textAlign="center" py={4}>
          No spaces yet — create the first one.
        </Text>
      )}
    </Stack>
  </Stack>
);

/* ---------------- Space detail (right column) ---------------- */
const SpaceDetailPanel = ({
  spaceId,
  onBack,
  onSpaceListRefresh,
}: {
  spaceId: string;
  onBack: () => void;
  onSpaceListRefresh: () => void;
}) => {
  const [space, setSpace] = useState<SpaceDetail | PrivateSpaceLocked | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);
  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelType, setNewChannelType] = useState<'TEXT' | 'DEBATE'>('TEXT');
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [editingChannelId, setEditingChannelId] = useState<string | null>(null);
  const [editChannelName, setEditChannelName] = useState('');
  const [confirmDeleteChannel, setConfirmDeleteChannel] = useState<ChannelSummary | null>(null);
  const toast = useToast();
  // Below lg, channels and the thread are two more drill-down levels
  // (space -> channel -> thread) instead of a side-by-side split — a
  // fixed channel list + thread wedged into a narrow column read as
  // cramped and unpolished on phones/tablets.
  const isDesktop = useBreakpointValue({ base: false, lg: true }) ?? false;

  const load = useCallback(async () => {
    setLoading(true);
    const data = await fetchSpace(spaceId).catch(() => null);
    setSpace(data);
    setLoading(false);
  }, [spaceId]);

  useEffect(() => {
    load();
    setSelectedChannelId(null);
  }, [spaceId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Separate from the load above: `isDesktop` resolves asynchronously
  // (Chakra's media-query listener attaches after mount), so auto-selecting
  // the first channel has to react to it independently — otherwise a
  // desktop-width visit that loads before `isDesktop` flips true never
  // gets a channel selected at all.
  useEffect(() => {
    if (space && 'channels' in space && space.channels.length > 0 && isDesktop) {
      setSelectedChannelId((prev) => prev || space.channels[0].id);
    }
  }, [space, isDesktop]);

  if (loading) return <Skeleton h="300px" borderRadius="xl" />;
  if (!space) return <Text color={inkSoft}>Space not found.</Text>;

  if ('notAMember' in space) {
    return (
      <Stack spacing={4} align="center" textAlign="center" py={10}>
        <Icon as={FiLock} boxSize={8} color={inkSoft} />
        <Text fontFamily={serif} fontSize="lg" color={ink}>
          {space.name}
        </Text>
        <Text fontSize="sm" color={inkSoft}>
          This is a private space. You need an invite link to join.
        </Text>
      </Stack>
    );
  }

  const isMember = Boolean(space.myRole);
  const isModerator = space.myRole === 'OWNER' || space.myRole === 'MODERATOR';
  const selectedChannel = space.channels.find((c) => c.id === selectedChannelId) || null;

  const handleJoin = async () => {
    try {
      setJoining(true);
      await joinSpace(spaceId);
      onSpaceListRefresh();
      await load();
    } catch (err: any) {
      toast({ title: err?.response?.data?.error || 'Could not join', status: 'error', duration: 3000, position: 'top' });
    } finally {
      setJoining(false);
    }
  };

  const handleCreateChannel = async () => {
    try {
      await createChannel(spaceId, newChannelName, '', newChannelType);
      setNewChannelName('');
      setShowCreateChannel(false);
      await load();
    } catch (err: any) {
      toast({ title: err?.response?.data?.error || 'Could not create channel', status: 'error', duration: 3000, position: 'top' });
    }
  };

  const handleInvite = async () => {
    try {
      const invite = await createInvite(spaceId);
      setInviteCode(invite.code);
    } catch (err: any) {
      toast({ title: err?.response?.data?.error || 'Could not create invite', status: 'error', duration: 3000, position: 'top' });
    }
  };

  const handleLeave = async () => {
    try {
      setLeaving(true);
      await leaveSpace(spaceId);
      setConfirmLeave(false);
      onSpaceListRefresh();
      onBack();
    } catch (err: any) {
      toast({ title: err?.response?.data?.error || 'Could not leave space', status: 'error', duration: 3000, position: 'top' });
    } finally {
      setLeaving(false);
    }
  };

  const startEditChannel = (c: ChannelSummary) => {
    setEditingChannelId(c.id);
    setEditChannelName(c.name);
  };

  const saveChannelEdit = async () => {
    if (!editingChannelId) return;
    try {
      await updateChannel(editingChannelId, { name: editChannelName });
      setEditingChannelId(null);
      await load();
    } catch (err: any) {
      toast({ title: err?.response?.data?.error || 'Could not rename channel', status: 'error', duration: 3000, position: 'top' });
    }
  };

  const handleDeleteChannel = async () => {
    if (!confirmDeleteChannel) return;
    try {
      await deleteChannel(confirmDeleteChannel.id);
      if (selectedChannelId === confirmDeleteChannel.id) setSelectedChannelId(null);
      setConfirmDeleteChannel(null);
      await load();
    } catch (err: any) {
      toast({ title: err?.response?.data?.error || 'Could not delete channel', status: 'error', duration: 3000, position: 'top' });
    }
  };

  // On mobile/tablet, once a channel is open it takes the full screen —
  // the space header and channel list step out of the way, matching the
  // channel thread's own back button (channel -> channel list), separate
  // from the space list's back button (space list -> spaces).
  const showingMobileThread = !isDesktop && Boolean(selectedChannel);

  return (
    <Stack spacing={4}>
      <Box display={showingMobileThread ? { base: 'none', lg: 'block' } : 'block'}>
        <HStack justify="space-between" wrap="wrap">
          <HStack>
            <IconButton aria-label="Back to spaces" icon={<FiArrowLeft />} size="sm" variant="ghost" display={{ base: 'flex', lg: 'none' }} onClick={onBack} />
            <Box>
              <HStack spacing={2}>
                <Icon as={space.visibility === 'PRIVATE' ? FiLock : FiGlobe} color={inkSoft} boxSize={3.5} />
                <Text fontFamily={serif} fontWeight="600" fontSize="lg" color={ink}>
                  {space.name}
                </Text>
              </HStack>
              <Text fontSize="xs" color={inkSoft}>
                {space._count.memberships} members
              </Text>
            </Box>
          </HStack>
          <HStack>
            {!isMember && space.visibility === 'PUBLIC' && (
              <Button size="sm" bg={ink} color="white" _hover={{ bg: '#463039' }} borderRadius="full" isLoading={joining} onClick={handleJoin}>
                Join
              </Button>
            )}
            {isModerator && (
              <>
                <Button size="sm" variant="outline" borderColor={line} leftIcon={<FiUserPlus />} onClick={handleInvite}>
                  Invite
                </Button>
                <Button size="sm" variant="outline" borderColor={line} leftIcon={<FiPlus />} onClick={() => setShowCreateChannel((v) => !v)}>
                  Channel
                </Button>
                <IconButton
                  aria-label="Space settings"
                  icon={<FiSettings />}
                  size="sm"
                  variant="outline"
                  borderColor={line}
                  onClick={() => setShowSettings(true)}
                />
              </>
            )}
            {isMember && space.myRole !== 'OWNER' && (
              <IconButton
                aria-label="Leave space"
                icon={<FiLogOut />}
                size="sm"
                variant="outline"
                borderColor={line}
                color={inkSoft}
                onClick={() => setConfirmLeave(true)}
              />
            )}
          </HStack>
        </HStack>

        {space.description && (
          <Text fontSize="sm" color={inkSoft} mt={2}>
            {space.description}
          </Text>
        )}

        {inviteCode && (
          <Alert status="success" borderRadius="lg" fontSize="sm" mt={3}>
            <AlertIcon />
            Invite code: <Text as="span" fontWeight="700" ml={1}>{inviteCode}</Text>
          </Alert>
        )}

        {showCreateChannel && (
          <HStack bg={card} borderRadius="lg" p={3} mt={3}>
            <Input size="sm" placeholder="channel-name" value={newChannelName} onChange={(e) => setNewChannelName(e.target.value)} borderColor={line} bg="white" />
            <RadioGroup value={newChannelType} onChange={(v) => setNewChannelType(v as 'TEXT' | 'DEBATE')}>
              <HStack fontSize="xs">
                <Radio size="sm" value="TEXT">
                  Text
                </Radio>
                <Radio size="sm" value="DEBATE">
                  Debate
                </Radio>
              </HStack>
            </RadioGroup>
            <Button size="sm" bg={ink} color="white" isDisabled={!newChannelName.trim()} onClick={handleCreateChannel}>
              Add
            </Button>
          </HStack>
        )}
      </Box>

      {!isMember ? (
        <Text fontSize="sm" color={inkSoft} textAlign="center" py={6}>
          Join this space to see its channels.
        </Text>
      ) : (
        <Flex gap={0} direction={{ base: 'column', lg: 'row' }} align="stretch">
          <Stack
            spacing={0.5}
            w={{ base: 'full', lg: '200px' }}
            flexShrink={0}
            pr={{ base: 0, lg: 4 }}
            pb={{ base: 3, lg: 0 }}
            borderRight={{ base: 'none', lg: '1px solid' }}
            borderColor={line}
            display={showingMobileThread ? 'none' : 'flex'}
          >
            {space.channels.map((c) =>
              editingChannelId === c.id ? (
                <HStack key={c.id} px={2} py={1}>
                  <Input
                    size="xs"
                    value={editChannelName}
                    onChange={(e) => setEditChannelName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && saveChannelEdit()}
                    borderColor={line}
                    autoFocus
                  />
                  <IconButton aria-label="Save" icon={<FiCheck />} size="xs" onClick={saveChannelEdit} />
                  <IconButton aria-label="Cancel" icon={<FiX />} size="xs" variant="ghost" onClick={() => setEditingChannelId(null)} />
                </HStack>
              ) : (
                <HStack key={c.id} justify="space-between" borderRadius="md" bg={c.id === selectedChannelId ? card : 'transparent'} pr={1}>
                  <HStack as="button" onClick={() => setSelectedChannelId(c.id)} spacing={2} px={3} py={2} flex={1} textAlign="left" minW={0}>
                    <Icon as={c.type === 'DEBATE' ? FiMessageSquare : FiHash} boxSize={3.5} color={inkSoft} flexShrink={0} />
                    <Text fontSize="sm" color={ink} noOfLines={1}>
                      {c.name}
                    </Text>
                  </HStack>
                  {isModerator && (
                    <Menu>
                      <MenuButton as={IconButton} aria-label="Channel settings" icon={<FiMoreVertical />} size="xs" variant="ghost" />
                      <MenuList fontSize="sm">
                        <MenuItem icon={<FiEdit2 />} onClick={() => startEditChannel(c)}>
                          Rename
                        </MenuItem>
                        <MenuItem icon={<FiTrash2 />} color={rose} onClick={() => setConfirmDeleteChannel(c)}>
                          Delete channel
                        </MenuItem>
                      </MenuList>
                    </Menu>
                  )}
                </HStack>
              ),
            )}
          </Stack>
          <Box flex={1} pl={{ base: 0, lg: 5 }} display={!isDesktop && !selectedChannel ? 'none' : 'block'}>
            {selectedChannel && (
              <ChannelThread
                spaceId={spaceId}
                channel={selectedChannel}
                isModerator={isModerator}
                onBack={!isDesktop ? () => setSelectedChannelId(null) : undefined}
              />
            )}
          </Box>
        </Flex>
      )}

      {showSettings && (
        <SpaceSettingsModal
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
          space={space}
          onUpdated={() => {
            onSpaceListRefresh();
            load();
          }}
          onDeleted={() => {
            onSpaceListRefresh();
            onBack();
          }}
        />
      )}

      <ConfirmModal
        isOpen={confirmLeave}
        title="Leave this space?"
        body="You'll lose access to its channels unless you rejoin (public) or get invited again (private)."
        confirmLabel="Leave"
        isLoading={leaving}
        onConfirm={handleLeave}
        onClose={() => setConfirmLeave(false)}
      />

      <ConfirmModal
        isOpen={Boolean(confirmDeleteChannel)}
        title="Delete this channel?"
        body={`"#${confirmDeleteChannel?.name}" and all its messages will be permanently deleted.`}
        confirmLabel="Delete channel"
        onConfirm={handleDeleteChannel}
        onClose={() => setConfirmDeleteChannel(null)}
      />
    </Stack>
  );
};

/* ---------------- Top-level Spaces view ---------------- */
const SpacesView = () => {
  const [spaces, setSpaces] = useState<SpaceSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSpaceId, setSelectedSpaceId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const loadSpaces = useCallback(async () => {
    setLoading(true);
    const data = await fetchSpaces().catch(() => []);
    setSpaces(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadSpaces();
  }, [loadSpaces]);

  return (
    <Box>
      <Flex gap={5} direction={{ base: 'column', lg: 'row' }}>
        <Box w={{ base: 'full', lg: '320px' }} flexShrink={0} display={{ base: selectedSpaceId ? 'none' : 'block', lg: 'block' }}>
          {loading ? <Skeleton h="200px" borderRadius="xl" /> : (
            <SpaceList
              spaces={spaces}
              selectedSpaceId={selectedSpaceId}
              onSelect={setSelectedSpaceId}
              onCreateClick={() => setShowCreateModal(true)}
              onJoined={(id) => {
                loadSpaces();
                setSelectedSpaceId(id);
              }}
            />
          )}
        </Box>
        <Box flex={1} display={{ base: selectedSpaceId ? 'block' : 'none', lg: 'block' }}>
          {selectedSpaceId ? (
            <SpaceDetailPanel spaceId={selectedSpaceId} onBack={() => setSelectedSpaceId(null)} onSpaceListRefresh={loadSpaces} />
          ) : (
            <Stack spacing={2} align="center" justify="center" py={16} bg={card} borderRadius="xl" border="1px solid" borderColor={line}>
              <Icon as={FiUsers} boxSize={8} color={inkSoft} />
              <Text color={inkSoft} fontSize="sm">
                Select a space, or create one to get started.
              </Text>
            </Stack>
          )}
        </Box>
      </Flex>

      <CreateSpaceModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={(id) => {
          loadSpaces();
          setSelectedSpaceId(id);
        }}
      />
    </Box>
  );
};

export default SpacesView;
