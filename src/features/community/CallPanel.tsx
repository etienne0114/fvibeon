import { useEffect, useState } from 'react';
import {
  Alert,
  AlertIcon,
  Avatar,
  Box,
  Button,
  HStack,
  Icon,
  IconButton,
  Modal,
  ModalContent,
  ModalOverlay,
  Spinner,
  Stack,
  Text,
} from '@chakra-ui/react';
import { FiClock, FiMic, FiMicOff, FiPhoneOff, FiSkipForward, FiVideo, FiVideoOff } from 'react-icons/fi';
import { PiHandPalmFill, PiClosedCaptioningBold } from 'react-icons/pi';
import { CallReaction, CaptionLine, RemoteParticipant } from '../../hooks/useWebRTCCall';
import { CallPhase, PendingJoinRequest, QueuedSpeaker, SpeakingMode } from '../../api/calls';
import { ink, inkSoft, rose, roseDeep, sage, sageDeep, sageTint, card, line, serif } from '../../theme/brand';
import VideoTile from './call/VideoTile';
import CallSidebar, { SidebarParticipant } from './call/CallSidebar';
import CallSettingsPopover from './call/CallSettingsPopover';
import { ReactionOverlay, ReactionPicker } from './call/ReactionBar';

/* Ticking "Ns left" label for the current speaker's turn — recomputed every second from
   the server-recorded start time, so it stays correct even if this tab was backgrounded. */
const SpeakerTimer = ({ startedAt, durationSec }: { startedAt: string; durationSec: number }) => {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const remaining = Math.max(0, durationSec - Math.floor((now - new Date(startedAt).getTime()) / 1000));
  return (
    <Text fontSize="xs" fontWeight="600" color={remaining <= 10 ? rose : inkSoft}>
      0:{String(remaining).padStart(2, '0')} left
    </Text>
  );
};

/* Running call length, mm:ss — the small professional touch every real meeting app has. */
const CallDuration = ({ startedAt }: { startedAt: string }) => {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const elapsed = Math.max(0, Math.floor((now - new Date(startedAt).getTime()) / 1000));
  const m = Math.floor(elapsed / 60);
  const s = elapsed % 60;
  return (
    <Text fontSize="xs" color={inkSoft} sx={{ fontVariantNumeric: 'tabular-nums' }}>
      {m}:{String(s).padStart(2, '0')}
    </Text>
  );
};

const CallPanel = ({
  isOpen,
  channelName,
  status,
  error,
  localStream,
  remoteParticipants,
  micEnabled,
  cameraEnabled,
  myUsername,
  myUserId,
  mySpeaking,
  focusedUserIds,
  reactions,
  speakingMode,
  speakerTimeSec,
  currentSpeaker,
  currentSpeakerStartedAt,
  queue,
  topic,
  requireApproval,
  autoMuteOnJoin,
  isHost,
  joinRequests,
  callStartedAt,
  phases,
  currentPhaseIndex,
  captionsSupported,
  captionsEnabled,
  captions,
  onToggleMic,
  onToggleCamera,
  onLeave,
  onRaiseHand,
  onLowerHand,
  onSkipSpeaker,
  onUpdateSettings,
  onAdmit,
  onDeny,
  onKick,
  onForceMute,
  onSendReaction,
  onAdvancePhase,
  onToggleCaptions,
}: {
  isOpen: boolean;
  channelName: string;
  status: 'idle' | 'connecting' | 'pending-approval' | 'in-call' | 'error';
  error: string | null;
  localStream: MediaStream | null;
  remoteParticipants: RemoteParticipant[];
  micEnabled: boolean;
  cameraEnabled: boolean;
  myUsername: string;
  myUserId?: string;
  mySpeaking: boolean;
  focusedUserIds: Set<string>;
  reactions: CallReaction[];
  speakingMode: SpeakingMode;
  speakerTimeSec: number | null;
  currentSpeaker: QueuedSpeaker | null;
  currentSpeakerStartedAt: string | null;
  queue: QueuedSpeaker[];
  topic: string | null;
  requireApproval: boolean;
  autoMuteOnJoin: boolean;
  isHost: boolean;
  joinRequests: PendingJoinRequest[];
  callStartedAt: string | null;
  phases: CallPhase[] | null;
  currentPhaseIndex: number | null;
  captionsSupported: boolean;
  captionsEnabled: boolean;
  captions: CaptionLine[];
  onToggleMic: () => void;
  onToggleCamera: () => void;
  onLeave: () => void;
  onRaiseHand: () => void;
  onLowerHand: () => void;
  onSkipSpeaker: () => void;
  onUpdateSettings: (patch: { speakingMode: SpeakingMode; speakerTimeSec?: number; topic: string; requireApproval: boolean; autoMuteOnJoin: boolean }) => void;
  onAdmit: (userId: string) => void;
  onDeny: (userId: string) => void;
  onKick: (userId: string) => void;
  onForceMute: (userId: string) => void;
  onAdvancePhase: () => void;
  onSendReaction: (emoji: string) => void;
  onToggleCaptions: () => void;
}) => {
  const structured = speakingMode === 'STRUCTURED';
  const isSpeaking = structured ? currentSpeaker?.id === myUserId : mySpeaking;
  const inQueue = structured && queue.some((q) => q.id === myUserId);
  const handActive = (structured && currentSpeaker?.id === myUserId) || inQueue;

  const remoteIsSpeaking = (p: RemoteParticipant) => (structured ? currentSpeaker?.id === p.userId : p.speaking);
  // Smart mesh limits: only a bounded "focus" set gets a real video tile — the size of
  // this group is what keeps mesh bandwidth from growing with the square of the call size.
  // Everyone else is still fully present on audio, just shown as a compact avatar chip.
  const focusedParticipants = remoteParticipants.filter((p) => focusedUserIds.has(p.userId));
  const audienceParticipants = remoteParticipants.filter((p) => !focusedUserIds.has(p.userId));

  // Speaker view: whoever's actually talking takes the featured spot; with no one talking,
  // the organizer (owner/moderator) holds it by default — everyone else sits in a filmstrip.
  type Tile = { key: string; isMe: boolean; participant?: RemoteParticipant };
  const focusedTiles: Tile[] = [{ key: 'me', isMe: true }, ...focusedParticipants.map((p) => ({ key: p.userId, isMe: false, participant: p }))];

  let featuredUserId: string | undefined;
  if (structured && currentSpeaker) {
    featuredUserId = currentSpeaker.id;
  } else {
    const activeSpeakerId = isSpeaking ? myUserId : focusedParticipants.find((p) => p.speaking)?.userId;
    featuredUserId = activeSpeakerId || (isHost ? myUserId : focusedParticipants.find((p) => p.isOrganizer)?.userId);
  }
  const featuredTile = focusedTiles.find((t) => (t.isMe ? t.key === 'me' && featuredUserId === myUserId : t.key === featuredUserId)) || focusedTiles[0];
  const filmstripTiles = focusedTiles.filter((t) => t !== featuredTile);

  const renderTile = (tile: Tile, minH: string) => {
    if (tile.isMe) {
      return (
        <VideoTile
          stream={localStream}
          label={`${myUsername} (you)`}
          muted
          cameraOff={!cameraEnabled}
          micOff={!micEnabled}
          isSpeaking={isSpeaking}
          isOrganizer={isHost}
          minH={minH}
        />
      );
    }
    const p = tile.participant!;
    return (
      <VideoTile
        stream={p.stream}
        label={p.username}
        cameraOff={!p.cameraEnabled || !p.hasVideo}
        micOff={!p.micEnabled}
        isSpeaking={remoteIsSpeaking(p)}
        isOrganizer={p.isOrganizer}
        minH={minH}
        canManage={isHost}
        onKick={() => onKick(p.userId)}
        onForceMute={() => onForceMute(p.userId)}
      />
    );
  };

  const sidebarParticipants: SidebarParticipant[] = [
    { userId: myUserId || 'me', username: `${myUsername} (you)`, micEnabled, cameraEnabled, isSpeaking },
    ...remoteParticipants.map((p) => ({
      userId: p.userId,
      username: p.username,
      micEnabled: p.micEnabled,
      cameraEnabled: p.cameraEnabled,
      isSpeaking: remoteIsSpeaking(p),
    })),
  ];

  return (
    <Modal isOpen={isOpen} onClose={onLeave} size="full" closeOnOverlayClick={false} closeOnEsc={false}>
      <ModalOverlay />
      <ModalContent bg={card} m={0} borderRadius={0}>
        <Stack spacing={0} h="100vh" p={{ base: 3, md: 5 }}>
          {status === 'pending-approval' ? (
            <Stack flex={1} align="center" justify="center" spacing={4}>
              <Spinner size="lg" color={sageDeep} thickness="3px" />
              <Text fontFamily={serif} fontSize="lg" color={ink}>
                Waiting for the host to let you in...
              </Text>
              {topic && (
                <Text fontSize="sm" color={inkSoft}>
                  {topic}
                </Text>
              )}
              <Button size="sm" variant="outline" borderColor={line} onClick={onLeave}>
                Cancel
              </Button>
            </Stack>
          ) : status === 'connecting' ? (
            <Stack flex={1} align="center" justify="center" spacing={4}>
              <Spinner size="lg" color={sageDeep} thickness="3px" />
              <Text fontSize="sm" color={inkSoft} textAlign="center">
                Connecting — check your browser's camera/mic permission prompt...
              </Text>
            </Stack>
          ) : status === 'error' ? (
            <Stack flex={1} align="center" justify="center" spacing={4} px={8}>
              <Alert status="error" borderRadius="lg" fontSize="sm" maxW="480px">
                <AlertIcon />
                {error}
              </Alert>
              <Button size="sm" variant="outline" borderColor={line} onClick={onLeave}>
                Close
              </Button>
            </Stack>
          ) : (
            <>
              <HStack justify="space-between" pb={3} flexShrink={0}>
                <HStack spacing={3} minW={0}>
                  <Text fontFamily={serif} fontWeight="600" fontSize="xl" color={ink} noOfLines={1}>
                    Call in #{channelName}
                  </Text>
                  {topic && (
                    <Text fontSize="sm" color={inkSoft} noOfLines={1}>
                      · {topic}
                    </Text>
                  )}
                  {structured && (
                    <Text fontSize="9px" fontWeight="700" bg={sageTint} color={sageDeep} borderRadius="full" px={2} py={0.5} whiteSpace="nowrap">
                      {phases && currentPhaseIndex !== null
                        ? `${phases[currentPhaseIndex].name.toUpperCase()} (${currentPhaseIndex + 1}/${phases.length}) · ${speakerTimeSec}S/SPEAKER`
                        : `STRUCTURED · ${speakerTimeSec}S/SPEAKER`}
                    </Text>
                  )}
                  {callStartedAt && <CallDuration startedAt={callStartedAt} />}
                </HStack>
                <HStack spacing={2} flexShrink={0}>
                  <Text fontSize="xs" color={inkSoft}>
                    {remoteParticipants.length + 1} in call
                  </Text>
                  {isHost && (
                    <CallSettingsPopover
                      speakingMode={speakingMode}
                      speakerTimeSec={speakerTimeSec}
                      topic={topic}
                      requireApproval={requireApproval}
                      autoMuteOnJoin={autoMuteOnJoin}
                      onSave={onUpdateSettings}
                    />
                  )}
                </HStack>
              </HStack>

              {structured && (
                <Box bg="white" border="1px solid" borderColor={line} borderRadius="lg" px={3} py={2.5} mb={3} flexShrink={0}>
                  <HStack justify="space-between" align="flex-start" spacing={3}>
                    <HStack spacing={2}>
                      <Icon as={FiClock} color={inkSoft} />
                      {currentSpeaker ? (
                        <HStack spacing={2}>
                          <Text fontSize="sm" color={ink}>
                            <Text as="span" fontWeight="700">
                              {currentSpeaker.id === myUserId ? 'You' : currentSpeaker.username}
                            </Text>{' '}
                            {currentSpeaker.id === myUserId ? 'are' : 'is'} speaking
                          </Text>
                          {currentSpeakerStartedAt && speakerTimeSec && <SpeakerTimer startedAt={currentSpeakerStartedAt} durationSec={speakerTimeSec} />}
                        </HStack>
                      ) : (
                        <Text fontSize="sm" color={inkSoft}>
                          No one is speaking — raise your hand to start.
                        </Text>
                      )}
                    </HStack>
                    <HStack spacing={1}>
                      {isHost && phases && currentPhaseIndex !== null && currentPhaseIndex < phases.length - 1 && (
                        <Button size="xs" variant="outline" borderColor={sage} color={sageDeep} onClick={onAdvancePhase}>
                          Next: {phases[currentPhaseIndex + 1].name}
                        </Button>
                      )}
                      {isHost && currentSpeaker && (
                        <IconButton aria-label="Skip to next speaker" icon={<Icon as={FiSkipForward} />} size="xs" variant="ghost" onClick={onSkipSpeaker} />
                      )}
                    </HStack>
                  </HStack>
                </Box>
              )}

              <HStack flex={1} spacing={4} align="stretch" minH={0}>
                <Box flex={1} overflowY="auto" position="relative">
                  <Box maxW="720px" mx="auto" mb={filmstripTiles.length > 0 ? 2 : 0}>
                    {renderTile(featuredTile, '320px')}
                  </Box>

                  {filmstripTiles.length > 0 && (
                    <HStack spacing={2} overflowX="auto" pb={1} justify="center">
                      {filmstripTiles.map((t) => (
                        <Box key={t.key} w="140px" flexShrink={0}>
                          {renderTile(t, '90px')}
                        </Box>
                      ))}
                    </HStack>
                  )}

                  {audienceParticipants.length > 0 && (
                    <Box mt={4}>
                      <Text fontSize="xs" fontWeight="700" color={inkSoft} textTransform="uppercase" letterSpacing="0.05em" mb={2}>
                        Also here — audio only ({audienceParticipants.length})
                      </Text>
                      <HStack spacing={3} flexWrap="wrap">
                        {audienceParticipants.map((p) => (
                          <Stack key={p.userId} spacing={1} align="center" w="64px">
                            <Box position="relative">
                              <Avatar
                                size="md"
                                name={p.username}
                                outline={remoteIsSpeaking(p) ? '3px solid' : undefined}
                                outlineColor={remoteIsSpeaking(p) ? sage : undefined}
                              />
                              {!p.micEnabled && (
                                <Box position="absolute" bottom={0} right={0} bg={rose} borderRadius="full" p={0.5}>
                                  <Icon as={FiMicOff} color="white" boxSize={2.5} />
                                </Box>
                              )}
                            </Box>
                            <Text fontSize="10px" color={inkSoft} noOfLines={1} textAlign="center" w="full">
                              {p.username}
                            </Text>
                          </Stack>
                        ))}
                      </HStack>
                    </Box>
                  )}

                  <ReactionOverlay reactions={reactions} />

                  {captions.length > 0 && (
                    <Stack position="absolute" bottom={2} left="50%" transform="translateX(-50%)" spacing={1} maxW="90%" align="center" pointerEvents="none">
                      {[...captions]
                        .sort((a, b) => a.updatedAt - b.updatedAt)
                        .slice(-2)
                        .map((c) => (
                          <Box key={c.userId} bg="blackAlpha.750" borderRadius="md" px={3} py={1.5}>
                            <Text fontSize="sm" color="white" textAlign="center">
                              <Text as="span" fontWeight="700">
                                {c.username}:
                              </Text>{' '}
                              {c.text}
                            </Text>
                          </Box>
                        ))}
                    </Stack>
                  )}
                </Box>

                <CallSidebar
                  participants={sidebarParticipants}
                  myUserId={myUserId}
                  isHost={isHost}
                  joinRequests={joinRequests}
                  onAdmit={onAdmit}
                  onDeny={onDeny}
                  onKick={onKick}
                  onForceMute={onForceMute}
                />
              </HStack>

              <HStack justify="center" spacing={3} pt={3} mt={2} borderTop="1px solid" borderColor={line} flexShrink={0}>
                {structured ? (
                  <Button
                    leftIcon={<Icon as={PiHandPalmFill} />}
                    borderRadius="full"
                    size="lg"
                    px={5}
                    bg={handActive ? sage : 'white'}
                    color={handActive ? 'white' : ink}
                    border="1px solid"
                    borderColor={handActive ? sage : line}
                    _hover={{ bg: handActive ? sageDeep : card }}
                    onClick={handActive ? onLowerHand : onRaiseHand}
                  >
                    {isSpeaking ? 'Done speaking' : inQueue ? 'Lower hand' : 'Raise hand'}
                  </Button>
                ) : (
                  <IconButton
                    aria-label={micEnabled ? 'Mute microphone' : 'Unmute microphone'}
                    icon={<Icon as={micEnabled ? FiMic : FiMicOff} />}
                    borderRadius="full"
                    size="lg"
                    bg={micEnabled ? 'white' : rose}
                    color={micEnabled ? ink : 'white'}
                    border="1px solid"
                    borderColor={line}
                    onClick={onToggleMic}
                  />
                )}
                <IconButton
                  aria-label={cameraEnabled ? 'Turn camera off' : 'Turn camera on'}
                  icon={<Icon as={cameraEnabled ? FiVideo : FiVideoOff} />}
                  borderRadius="full"
                  size="lg"
                  bg={cameraEnabled ? 'white' : rose}
                  color={cameraEnabled ? ink : 'white'}
                  border="1px solid"
                  borderColor={line}
                  onClick={onToggleCamera}
                />
                {captionsSupported && (
                  <IconButton
                    aria-label={captionsEnabled ? 'Turn off captions of my speech' : 'Caption my speech'}
                    icon={<Icon as={PiClosedCaptioningBold} />}
                    borderRadius="full"
                    size="lg"
                    bg={captionsEnabled ? sage : 'white'}
                    color={captionsEnabled ? 'white' : ink}
                    border="1px solid"
                    borderColor={captionsEnabled ? sage : line}
                    onClick={onToggleCaptions}
                  />
                )}
                <ReactionPicker onSend={onSendReaction} />
                <IconButton
                  aria-label="Leave call"
                  icon={<Icon as={FiPhoneOff} />}
                  borderRadius="full"
                  size="lg"
                  bg={rose}
                  color="white"
                  _hover={{ bg: roseDeep }}
                  onClick={onLeave}
                />
              </HStack>
            </>
          )}
        </Stack>
      </ModalContent>
    </Modal>
  );
};

export default CallPanel;
