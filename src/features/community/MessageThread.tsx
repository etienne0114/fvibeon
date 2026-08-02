import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  AlertIcon,
  Badge,
  Box,
  Button,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerHeader,
  DrawerOverlay,
  HStack,
  Icon,
  IconButton,
  Input,
  Skeleton,
  Stack,
  Text,
  useToast,
} from '@chakra-ui/react';
import { FiArrowLeft, FiCheck, FiCornerUpLeft, FiHash, FiImage, FiMessageSquare, FiMic, FiPhoneCall, FiSend, FiTrash2, FiX } from 'react-icons/fi';
import {
  fetchMessages,
  postTextMessage,
  postMediaMessage,
  deleteMessage,
  fetchReplies,
  messageMediaUrl,
  requestToJoinDebate,
  fetchDebateRequests,
  fetchApprovedDebateParticipants,
  revokeDebateApproval,
  resolveDebateRequest,
  fetchMyDebateStatus,
  ChannelSummary,
  ChannelMessage,
  DebateRequest,
} from '../../api/spaces';
import { fetchActiveCall, ActiveCall } from '../../api/calls';
import { useAudioRecorder } from '../../hooks/useAudioRecorder';
import { useWebRTCCall } from '../../hooks/useWebRTCCall';
import { useMe } from '../../hooks/useMe';
import CallPanel from './CallPanel';
import { blobToBase64, MAX_UPLOAD_BYTES, ConfirmModal } from './shared';
import { ink, inkSoft, rose, roseDeep, card, line, serif, sage, sageDeep, sageTint, amber, amberDeep, amberTint } from '../../theme/brand';

const MessageBubble = ({
  message,
  canDelete,
  onDelete,
  onReply,
}: {
  message: ChannelMessage;
  canDelete: boolean;
  onDelete: () => void;
  /** Omitted inside the thread panel itself — replies don't get their own sub-threads. */
  onReply?: () => void;
}) => (
  <Stack spacing={0.5} align="flex-start" role="group" w="full">
    <HStack spacing={2} w="full" justify="space-between">
      <HStack spacing={2}>
        <Text fontSize="xs" fontWeight="700" color={ink}>
          @{message.user.username}
        </Text>
        <Text fontSize="10px" color={inkSoft}>
          {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </HStack>
      <HStack spacing={0} opacity={0} _groupHover={{ opacity: 1 }}>
        {onReply && (
          <IconButton aria-label="Reply in thread" icon={<FiCornerUpLeft />} size="xs" variant="ghost" color={inkSoft} onClick={onReply} />
        )}
        {canDelete && (
          <IconButton aria-label="Delete message" icon={<FiTrash2 />} size="xs" variant="ghost" color={inkSoft} onClick={onDelete} />
        )}
      </HStack>
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
    {onReply && Boolean(message.replyCount) && (
      <HStack as="button" spacing={1.5} mt={0.5} onClick={onReply} color={roseDeep}>
        <Icon as={FiCornerUpLeft} boxSize={3} />
        <Text fontSize="xs" fontWeight="700">
          {message.replyCount} {message.replyCount === 1 ? 'reply' : 'replies'}
        </Text>
      </HStack>
    )}
  </Stack>
);

/* ---------------- Thread panel — a real sidebar/drawer, not an inline
   "usual chat" expansion. Opens over the channel when a message's reply
   count (or its Reply action) is clicked. ---------------- */
const ThreadPanel = ({
  isOpen,
  messageId,
  channelId,
  isModerator,
  onClose,
  onRepliesChanged,
}: {
  isOpen: boolean;
  messageId: string | null;
  channelId: string;
  isModerator: boolean;
  onClose: () => void;
  onRepliesChanged: () => void;
}) => {
  const [root, setRoot] = useState<ChannelMessage | null>(null);
  const [replies, setReplies] = useState<ChannelMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recorder = useAudioRecorder();
  const toast = useToast();
  const { user: me } = useMe();

  const load = useCallback(async () => {
    if (!messageId) return;
    try {
      setLoading(true);
      const result = await fetchReplies(messageId);
      setRoot(result.root);
      setReplies(result.replies);
    } catch (err: any) {
      toast({ title: err?.response?.data?.error || 'Could not load thread', status: 'error', duration: 3000, position: 'top' });
    } finally {
      setLoading(false);
    }
  }, [messageId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (isOpen && messageId) {
      setText('');
      load();
    }
  }, [isOpen, messageId, load]);

  const sendReply = async () => {
    if (!text.trim() || !messageId) return;
    try {
      setSending(true);
      await postTextMessage(channelId, text, messageId);
      setText('');
      await load();
      onRepliesChanged();
    } catch (err: any) {
      toast({ title: err?.response?.data?.error || 'Could not send reply', status: 'error', duration: 3000, position: 'top' });
    } finally {
      setSending(false);
    }
  };

  const toggleVoiceReply = async () => {
    if (recorder.isRecording) {
      recorder.stopRecording();
      return;
    }
    recorder.clearRecording();
    await recorder.startRecording().catch(() => undefined);
    window.setTimeout(() => recorder.stopRecording(), 15000);
  };

  useEffect(() => {
    if (!recorder.audioBlob || !messageId) return;
    (async () => {
      try {
        setSending(true);
        const base64 = await blobToBase64(recorder.audioBlob!);
        await postMediaMessage(channelId, 'VOICE', base64, recorder.audioBlob!.type, messageId);
        recorder.clearRecording();
        await load();
        onRepliesChanged();
      } catch (err: any) {
        toast({ title: err?.response?.data?.error || 'Could not send voice reply', status: 'error', duration: 3000, position: 'top' });
      } finally {
        setSending(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recorder.audioBlob]);

  const handleImagePick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !messageId) return;
    if (file.size > MAX_UPLOAD_BYTES) {
      toast({ title: 'Image is too large — keep it small', status: 'error', duration: 3000, position: 'top' });
      return;
    }
    try {
      setSending(true);
      const base64 = await blobToBase64(file);
      await postMediaMessage(channelId, 'IMAGE', base64, file.type, messageId);
      await load();
      onRepliesChanged();
    } catch (err: any) {
      toast({ title: err?.response?.data?.error || 'Could not send image', status: 'error', duration: 3000, position: 'top' });
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <Drawer isOpen={isOpen} placement="right" onClose={onClose} size="sm">
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader borderBottom="1px solid" borderColor={line} fontFamily={serif} fontSize="lg">
            Thread
          </DrawerHeader>
          <DrawerBody display="flex" flexDirection="column" p={4}>
            {loading ? (
              <Stack spacing={3}>
                <Skeleton h="60px" borderRadius="lg" />
                <Skeleton h="40px" borderRadius="lg" />
              </Stack>
            ) : !root ? (
              <Text color={inkSoft}>Message not found.</Text>
            ) : (
              <>
                <Box pb={3} mb={3} borderBottom="1px solid" borderColor={line}>
                  <MessageBubble message={root} canDelete={false} onDelete={() => {}} />
                </Box>
                <Text fontSize="xs" fontWeight="700" color={inkSoft} mb={2}>
                  {replies.length} {replies.length === 1 ? 'reply' : 'replies'}
                </Text>
                <Stack spacing={3} flex={1} overflowY="auto" mb={3} minH="120px">
                  {replies.length === 0 ? (
                    <Text fontSize="sm" color={inkSoft} textAlign="center" mt={4}>
                      No replies yet — start the thread.
                    </Text>
                  ) : (
                    replies.map((r) => (
                      <MessageBubble
                        key={r.id}
                        message={r}
                        canDelete={r.user.id === me?.id || isModerator}
                        onDelete={() => setConfirmDeleteId(r.id)}
                      />
                    ))
                  )}
                </Stack>
                <HStack>
                  <Input
                    placeholder="Reply..."
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && sendReply()}
                    borderColor={line}
                    size="sm"
                  />
                  <input type="file" accept="image/*" ref={fileInputRef} style={{ display: 'none' }} onChange={handleImagePick} />
                  <IconButton
                    aria-label="Attach image"
                    icon={<FiImage />}
                    size="sm"
                    variant="outline"
                    borderColor={line}
                    onClick={() => fileInputRef.current?.click()}
                  />
                  <IconButton
                    aria-label={recorder.isRecording ? 'Stop recording' : 'Record voice reply'}
                    icon={<FiMic />}
                    size="sm"
                    variant="outline"
                    borderColor={recorder.isRecording ? rose : line}
                    color={recorder.isRecording ? rose : inkSoft}
                    onClick={toggleVoiceReply}
                  />
                  <IconButton
                    aria-label="Send reply"
                    icon={<FiSend />}
                    size="sm"
                    bg={ink}
                    color="white"
                    _hover={{ bg: '#463039' }}
                    isLoading={sending}
                    isDisabled={!text.trim()}
                    onClick={sendReply}
                  />
                </HStack>
              </>
            )}
          </DrawerBody>
        </DrawerContent>
      </Drawer>
      <ConfirmModal
        isOpen={Boolean(confirmDeleteId)}
        title="Delete this reply?"
        body="This can't be undone."
        confirmLabel="Delete"
        onConfirm={async () => {
          if (!confirmDeleteId) return;
          try {
            await deleteMessage(channelId, confirmDeleteId);
            setConfirmDeleteId(null);
            await load();
            onRepliesChanged();
          } catch (err: any) {
            toast({ title: err?.response?.data?.error || 'Could not delete reply', status: 'error', duration: 3000, position: 'top' });
          }
        }}
        onClose={() => setConfirmDeleteId(null)}
      />
    </>
  );
};

/* ---------------- Channel thread (right column content) ---------------- */
export const ChannelThread = ({
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
  const [approvedParticipants, setApprovedParticipants] = useState<DebateRequest[]>([]);
  const [confirmDeleteMessageId, setConfirmDeleteMessageId] = useState<string | null>(null);
  const [openThreadMessageId, setOpenThreadMessageId] = useState<string | null>(null);
  const [activeCall, setActiveCall] = useState<ActiveCall | null>(null);
  const [showCallPanel, setShowCallPanel] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recorder = useAudioRecorder();
  const toast = useToast();
  const { user: me } = useMe();
  const call = useWebRTCCall();

  // Lets anyone viewing the channel see "a call is happening, join?" —
  // independent of whether they're in it, so it polls even before joining.
  useEffect(() => {
    let cancelled = false;
    const check = () => fetchActiveCall(channel.id).then((c) => !cancelled && setActiveCall(c)).catch(() => undefined);
    check();
    const interval = setInterval(check, 4000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [channel.id]);

  const startOrJoinCall = async () => {
    setShowCallPanel(true);
    await call.join(channel.id, activeCall?.participants);
  };

  const leaveCallPanel = async () => {
    await call.leave();
    setShowCallPanel(false);
  };

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
          const [requests, participants] = await Promise.all([
            fetchDebateRequests(channel.id).catch(() => []),
            fetchApprovedDebateParticipants(channel.id).catch(() => []),
          ]);
          setPendingRequests(requests);
          setApprovedParticipants(participants);
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
    if (approve) await load();
  };

  const revokeApproval = async (requestId: string) => {
    await revokeDebateApproval(requestId).catch(() => undefined);
    setApprovedParticipants((prev) => prev.filter((r) => r.id !== requestId));
  };

  return (
    <Stack spacing={3} h="full">
      <HStack justify="space-between">
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
        <Button
          size="sm"
          borderRadius="full"
          leftIcon={<Icon as={FiPhoneCall} />}
          bg={activeCall ? sage : 'transparent'}
          color={activeCall ? 'white' : inkSoft}
          variant={activeCall ? 'solid' : 'outline'}
          borderColor={line}
          _hover={{ bg: activeCall ? sageDeep : card }}
          onClick={startOrJoinCall}
        >
          {activeCall ? `Join call (${activeCall.participants.length})` : 'Start call'}
        </Button>
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

      {isModerator && approvedParticipants.length > 0 && (
        <Box bg={sageTint} border="1px solid" borderColor={sage} borderRadius="lg" p={3}>
          <Text fontSize="xs" fontWeight="700" color={sageDeep} mb={2}>
            {approvedParticipants.length} approved to participate
          </Text>
          <Stack spacing={1.5}>
            {approvedParticipants.map((r) => (
              <HStack key={r.id} justify="space-between">
                <Text fontSize="sm">@{r.user.username}</Text>
                <Button size="xs" variant="outline" borderColor={line} color={inkSoft} onClick={() => revokeApproval(r.id)}>
                  Revoke
                </Button>
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
          messages.map((m) => (
            <MessageBubble
              key={m.id}
              message={m}
              canDelete={m.user.id === me?.id || isModerator}
              onDelete={() => setConfirmDeleteMessageId(m.id)}
              onReply={() => setOpenThreadMessageId(m.id)}
            />
          ))
        )}
      </Stack>

      <ThreadPanel
        isOpen={Boolean(openThreadMessageId)}
        messageId={openThreadMessageId}
        channelId={channel.id}
        isModerator={isModerator}
        onClose={() => setOpenThreadMessageId(null)}
        onRepliesChanged={load}
      />

      <ConfirmModal
        isOpen={Boolean(confirmDeleteMessageId)}
        title="Delete this message?"
        body="This can't be undone."
        confirmLabel="Delete"
        onConfirm={async () => {
          if (!confirmDeleteMessageId) return;
          try {
            await deleteMessage(channel.id, confirmDeleteMessageId);
            setConfirmDeleteMessageId(null);
            await load();
          } catch (err: any) {
            toast({ title: err?.response?.data?.error || 'Could not delete message', status: 'error', duration: 3000, position: 'top' });
          }
        }}
        onClose={() => setConfirmDeleteMessageId(null)}
      />

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

      <CallPanel
        isOpen={showCallPanel}
        channelName={channel.name}
        status={call.status}
        error={call.error}
        localStream={call.localStream}
        remoteParticipants={call.remoteParticipants}
        micEnabled={call.micEnabled}
        cameraEnabled={call.cameraEnabled}
        myUsername={me?.username || 'You'}
        onToggleMic={call.toggleMic}
        onToggleCamera={call.toggleCamera}
        onLeave={leaveCallPanel}
      />
    </Stack>
  );
};
