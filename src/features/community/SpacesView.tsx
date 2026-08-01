import { useCallback, useEffect, useRef, useState } from 'react';
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
  FiSend,
  FiMic,
  FiImage,
  FiLink,
  FiUserPlus,
  FiUsers,
  FiCheck,
  FiX,
  FiArrowLeft,
} from 'react-icons/fi';
import {
  fetchSpaces,
  fetchSpace,
  createSpace,
  joinSpace,
  joinViaInvite,
  createInvite,
  createChannel,
  fetchMessages,
  postTextMessage,
  postMediaMessage,
  messageMediaUrl,
  requestToJoinDebate,
  fetchDebateRequests,
  resolveDebateRequest,
  fetchMyDebateStatus,
  SpaceSummary,
  SpaceDetail,
  PrivateSpaceLocked,
  ChannelSummary,
  ChannelMessage,
  DebateRequest,
} from '../../api/spaces';
import { useAudioRecorder } from '../../hooks/useAudioRecorder';
import { ink, inkSoft, rose, roseDeep, card, line, serif, sage, sageDeep, sageTint, amber, amberDeep, amberTint } from '../../theme/brand';

const blobToBase64 = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1] || '');
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });

const MAX_UPLOAD_BYTES = 350 * 1024;

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

/* ---------------- Message bubble ---------------- */
const MessageBubble = ({ message }: { message: ChannelMessage }) => (
  <Stack spacing={0.5} align="flex-start">
    <HStack spacing={2}>
      <Text fontSize="xs" fontWeight="700" color={ink}>
        @{message.user.username}
      </Text>
      <Text fontSize="10px" color={inkSoft}>
        {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </Text>
    </HStack>
    {message.type === 'TEXT' && (
      <Box bg={card} borderRadius="lg" px={3} py={2} maxW="80%">
        <Text fontSize="sm" color={ink} whiteSpace="pre-wrap">
          {message.text}
        </Text>
      </Box>
    )}
    {message.type === 'VOICE' && (
      <Box bg={card} borderRadius="lg" px={3} py={2}>
        <audio src={messageMediaUrl(message.id)} controls style={{ height: '32px', maxWidth: '260px' }} />
      </Box>
    )}
    {message.type === 'IMAGE' && (
      <Box borderRadius="lg" overflow="hidden" maxW="260px">
        <img src={messageMediaUrl(message.id)} alt="Shared" style={{ maxWidth: '100%', display: 'block' }} />
      </Box>
    )}
  </Stack>
);

/* ---------------- Channel thread (right column content) ---------------- */
const ChannelThread = ({
  spaceId,
  channel,
  isModerator,
  onBack,
}: {
  spaceId: string;
  channel: ChannelSummary;
  isModerator: boolean;
  onBack?: () => void;
}) => {
  const [messages, setMessages] = useState<ChannelMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [debateStatus, setDebateStatus] = useState<string | null>(null);
  const [pendingRequests, setPendingRequests] = useState<DebateRequest[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recorder = useAudioRecorder();
  const toast = useToast();

  const canPost = channel.type === 'TEXT' || isModerator || debateStatus === 'APPROVED';

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const result = await fetchMessages(channel.id);
      setMessages(result.messages);
      if (channel.type === 'DEBATE') {
        const status = await fetchMyDebateStatus(channel.id).catch(() => null);
        setDebateStatus(status);
        if (isModerator) {
          const requests = await fetchDebateRequests(channel.id).catch(() => []);
          setPendingRequests(requests);
        }
      }
    } catch (err: any) {
      toast({ title: err?.response?.data?.error || 'Could not load channel', status: 'error', duration: 3000, position: 'top' });
    } finally {
      setLoading(false);
    }
  }, [channel.id, channel.type, isModerator]);

  useEffect(() => {
    load();
  }, [load]);

  const sendText = async () => {
    if (!text.trim()) return;
    try {
      setSending(true);
      await postTextMessage(channel.id, text);
      setText('');
      await load();
    } catch (err: any) {
      toast({ title: err?.response?.data?.error || 'Could not send message', status: 'error', duration: 3000, position: 'top' });
    } finally {
      setSending(false);
    }
  };

  const toggleVoiceNote = async () => {
    if (recorder.isRecording) {
      recorder.stopRecording();
      return;
    }
    recorder.clearRecording();
    await recorder.startRecording().catch(() => undefined);
    window.setTimeout(() => recorder.stopRecording(), 15000);
  };

  useEffect(() => {
    if (!recorder.audioBlob) return;
    (async () => {
      try {
        setSending(true);
        const base64 = await blobToBase64(recorder.audioBlob!);
        await postMediaMessage(channel.id, 'VOICE', base64, recorder.audioBlob!.type);
        recorder.clearRecording();
        await load();
      } catch (err: any) {
        toast({ title: err?.response?.data?.error || 'Could not send voice note', status: 'error', duration: 3000, position: 'top' });
      } finally {
        setSending(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recorder.audioBlob]);

  const handleImagePick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > MAX_UPLOAD_BYTES) {
      toast({ title: 'Image is too large — keep it small', status: 'error', duration: 3000, position: 'top' });
      return;
    }
    try {
      setSending(true);
      const base64 = await blobToBase64(file);
      await postMediaMessage(channel.id, 'IMAGE', base64, file.type);
      await load();
    } catch (err: any) {
      toast({ title: err?.response?.data?.error || 'Could not send image', status: 'error', duration: 3000, position: 'top' });
    } finally {
      setSending(false);
    }
  };

  const requestJoin = async () => {
    try {
      await requestToJoinDebate(channel.id);
      setDebateStatus('PENDING');
      toast({ title: 'Request sent — a moderator will review it', status: 'success', duration: 2500, position: 'top' });
    } catch (err: any) {
      toast({ title: err?.response?.data?.error || 'Could not request to join', status: 'error', duration: 3000, position: 'top' });
    }
  };

  const resolveRequest = async (requestId: string, approve: boolean) => {
    await resolveDebateRequest(requestId, approve).catch(() => undefined);
    setPendingRequests((prev) => prev.filter((r) => r.id !== requestId));
  };

  return (
    <Stack spacing={3} h="full">
      <HStack>
        {onBack && (
          <IconButton aria-label="Back" icon={<FiArrowLeft />} size="sm" variant="ghost" onClick={onBack} />
        )}
        <Icon as={channel.type === 'DEBATE' ? FiMessageSquare : FiHash} color={inkSoft} />
        <Text fontFamily={serif} fontWeight="600" color={ink}>
          {channel.name}
        </Text>
        {channel.type === 'DEBATE' && (
          <Badge bg={amberTint} color={amberDeep} borderRadius="full" px={2} fontSize="10px">
            DEBATE
          </Badge>
        )}
      </HStack>
      {channel.description && (
        <Text fontSize="xs" color={inkSoft}>
          {channel.description}
        </Text>
      )}

      {isModerator && pendingRequests.length > 0 && (
        <Box bg={amberTint} border="1px solid" borderColor={amber} borderRadius="lg" p={3}>
          <Text fontSize="xs" fontWeight="700" color={amberDeep} mb={2}>
            {pendingRequests.length} request{pendingRequests.length === 1 ? '' : 's'} to join this debate
          </Text>
          <Stack spacing={1.5}>
            {pendingRequests.map((r) => (
              <HStack key={r.id} justify="space-between">
                <Text fontSize="sm">@{r.user.username}</Text>
                <HStack spacing={1}>
                  <IconButton aria-label="Approve" icon={<FiCheck />} size="xs" bg={sage} color="white" onClick={() => resolveRequest(r.id, true)} />
                  <IconButton aria-label="Decline" icon={<FiX />} size="xs" bg={rose} color="white" onClick={() => resolveRequest(r.id, false)} />
                </HStack>
              </HStack>
            ))}
          </Stack>
        </Box>
      )}

      <Stack spacing={3} flex={1} overflowY="auto" minH="200px" maxH={{ base: 'calc(100dvh - 260px)', lg: '58vh' }} bg="white" border="1px solid" borderColor={line} borderRadius="xl" p={4}>
        {loading ? (
          <>
            <Skeleton h="40px" borderRadius="md" />
            <Skeleton h="40px" borderRadius="md" />
          </>
        ) : messages.length === 0 ? (
          <Text fontSize="sm" color={inkSoft} textAlign="center" mt={8}>
            No messages yet — say something!
          </Text>
        ) : (
          messages.map((m) => <MessageBubble key={m.id} message={m} />)
        )}
      </Stack>

      {channel.type === 'DEBATE' && !isModerator && debateStatus !== 'APPROVED' && (
        <Alert status={debateStatus === 'PENDING' ? 'info' : debateStatus === 'DECLINED' ? 'warning' : 'info'} borderRadius="lg" fontSize="sm">
          <AlertIcon />
          {debateStatus === 'PENDING' && 'Your request to join is pending approval.'}
          {debateStatus === 'DECLINED' && 'Your request to join was declined.'}
          {!debateStatus && (
            <HStack justify="space-between" w="full">
              <Text>Request to join this debate to participate.</Text>
              <Button size="xs" bg={ink} color="white" onClick={requestJoin}>
                Request to join
              </Button>
            </HStack>
          )}
        </Alert>
      )}

      {canPost && (
        <HStack>
          <Input
            placeholder="Write a message..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendText()}
            borderColor={line}
          />
          <input type="file" accept="image/*" ref={fileInputRef} style={{ display: 'none' }} onChange={handleImagePick} />
          <IconButton aria-label="Attach image" icon={<FiImage />} variant="outline" borderColor={line} onClick={() => fileInputRef.current?.click()} />
          <IconButton
            aria-label={recorder.isRecording ? 'Stop recording' : 'Record voice note'}
            icon={<FiMic />}
            variant="outline"
            borderColor={recorder.isRecording ? rose : line}
            color={recorder.isRecording ? rose : inkSoft}
            onClick={toggleVoiceNote}
          />
          <IconButton
            aria-label="Send"
            icon={<FiSend />}
            bg={ink}
            color="white"
            _hover={{ bg: '#463039' }}
            isDisabled={!text.trim()}
            isLoading={sending}
            onClick={sendText}
          />
        </HStack>
      )}
    </Stack>
  );
};

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
    if (data && 'channels' in data && data.channels.length > 0 && isDesktop) {
      setSelectedChannelId((prev) => prev || data.channels[0].id);
    }
    setLoading(false);
  }, [spaceId, isDesktop]);

  useEffect(() => {
    load();
    setSelectedChannelId(null);
  }, [spaceId]); // eslint-disable-line react-hooks/exhaustive-deps

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
              </>
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
            {space.channels.map((c) => (
              <HStack
                key={c.id}
                as="button"
                onClick={() => setSelectedChannelId(c.id)}
                spacing={2}
                px={3}
                py={2}
                borderRadius="md"
                bg={c.id === selectedChannelId ? card : 'transparent'}
                textAlign="left"
              >
                <Icon as={c.type === 'DEBATE' ? FiMessageSquare : FiHash} boxSize={3.5} color={inkSoft} />
                <Text fontSize="sm" color={ink}>
                  {c.name}
                </Text>
              </HStack>
            ))}
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
