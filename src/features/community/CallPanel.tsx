import { useEffect, useState } from 'react';
import {
  Alert,
  AlertIcon,
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
import { rose, roseDeep, sage, sageDeep, serif } from '../../theme/brand';
import VideoTile from './call/VideoTile';
import TvFrame from './call/TvFrame';
import TheaterBubble from './call/TheaterBubble';
import CallSidebar, { SidebarParticipant } from './call/CallSidebar';
import CallSettingsPopover from './call/CallSettingsPopover';
import { ReactionOverlay, ReactionPicker } from './call/ReactionBar';

// A dedicated "theater" look for the call itself — dark, spotlighted aisle, TV-framed
// featured speaker — distinct from the app's warm cream/ink editorial palette elsewhere.
const theaterBg = 'linear-gradient(180deg, #14101f 0%, #241a3d 55%, #14101f 100%)';
const theaterCard = 'whiteAlpha.100';
// Matches TvFrame's own responsive width (roughly 4:3) so the featured tile's height
// never gets stretched taller than its frame by an oversized fixed minH floor.
const featuredMinH = { base: '140px', sm: '210px', md: '280px' };
const theaterBorder = 'whiteAlpha.200';

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
    <Text fontSize="xs" fontWeight="600" color={remaining <= 10 ? rose : 'whiteAlpha.700'}>
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
    <Text fontSize="xs" color="whiteAlpha.700" sx={{ fontVariantNumeric: 'tabular-nums' }}>
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
  // Everyone else is still fully present on audio, just sits in the aisle without video.
  const focusedParticipants = remoteParticipants.filter((p) => focusedUserIds.has(p.userId));

  // Speaker view: whoever's actually talking takes the TV; with no one talking, the
  // organizer (owner/moderator) holds it by default — everyone else sits in the aisle.
  type Tile = { key: string; isMe: boolean; participant?: RemoteParticipant };
  const allTiles: Tile[] = [{ key: 'me', isMe: true }, ...remoteParticipants.map((p) => ({ key: p.userId, isMe: false, participant: p }))];

  let featuredUserId: string | undefined;
  if (structured && currentSpeaker) {
    featuredUserId = currentSpeaker.id;
  } else {
    const activeSpeakerId = isSpeaking ? myUserId : focusedParticipants.find((p) => p.speaking)?.userId;
    featuredUserId = activeSpeakerId || (isHost ? myUserId : focusedParticipants.find((p) => p.isOrganizer)?.userId);
  }
  const featuredTile = allTiles.find((t) => (t.isMe ? t.key === 'me' && featuredUserId === myUserId : t.key === featuredUserId)) || allTiles[0];
  const aisleTiles = allTiles.filter((t) => t !== featuredTile);

  const renderFeatured = (tile: Tile) => {
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
          minH={featuredMinH}
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
        minH={featuredMinH}
        canManage={isHost}
        onKick={() => onKick(p.userId)}
        onForceMute={() => onForceMute(p.userId)}
      />
    );
  };

  const renderBubble = (tile: Tile) => {
    if (tile.isMe) {
      return (
        <TheaterBubble
          stream={localStream}
          label={`${myUsername} (you)`}
          muted
          cameraOff={!cameraEnabled}
          micOff={!micEnabled}
          isSpeaking={isSpeaking}
          isOrganizer={isHost}
        />
      );
    }
    const p = tile.participant!;
    return (
      <TheaterBubble
        stream={p.stream}
        label={p.username}
        cameraOff={!p.cameraEnabled || !p.hasVideo}
        micOff={!p.micEnabled}
        isSpeaking={remoteIsSpeaking(p)}
        isOrganizer={p.isOrganizer}
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
      <ModalContent bg={theaterBg} m={0} borderRadius={0}>
        <Stack spacing={0} h="100vh" p={{ base: 3, md: 5 }}>
          {status === 'pending-approval' ? (
            <Stack flex={1} align="center" justify="center" spacing={4}>
              <Spinner size="lg" color={sage} thickness="3px" />
              <Text fontFamily={serif} fontSize="lg" color="white">
                Waiting for the host to let you in...
              </Text>
              {topic && (
                <Text fontSize="sm" color="whiteAlpha.700">
                  {topic}
                </Text>
              )}
              <Button size="sm" variant="outline" borderColor={theaterBorder} color="white" onClick={onLeave}>
                Cancel
              </Button>
            </Stack>
          ) : status === 'connecting' ? (
            <Stack flex={1} align="center" justify="center" spacing={4}>
              <Spinner size="lg" color={sage} thickness="3px" />
              <Text fontSize="sm" color="whiteAlpha.700" textAlign="center">
                Connecting — check your browser's camera/mic permission prompt...
              </Text>
            </Stack>
          ) : status === 'error' ? (
            <Stack flex={1} align="center" justify="center" spacing={4} px={8}>
              <Alert status="error" borderRadius="lg" fontSize="sm" maxW="480px">
                <AlertIcon />
                {error}
              </Alert>
              <Button size="sm" variant="outline" borderColor={theaterBorder} color="white" onClick={onLeave}>
                Close
              </Button>
            </Stack>
          ) : (
            <>
              <HStack justify="space-between" align="flex-start" pb={3} flexShrink={0} flexWrap="wrap" rowGap={2}>
                <HStack spacing={2} minW={0} flexWrap="wrap" rowGap={1}>
                  <Text fontFamily={serif} fontWeight="600" fontSize={{ base: 'md', md: 'xl' }} color="white" noOfLines={1}>
                    Call in #{channelName}
                  </Text>
                  {topic && (
                    <Text fontSize={{ base: 'xs', md: 'sm' }} color="whiteAlpha.700" noOfLines={1}>
                      · {topic}
                    </Text>
                  )}
                  {structured && (
                    <Text fontSize="9px" fontWeight="700" bg="whiteAlpha.200" color={sage} borderRadius="full" px={2} py={0.5} whiteSpace="nowrap">
                      {phases && currentPhaseIndex !== null
                        ? `${phases[currentPhaseIndex].name.toUpperCase()} (${currentPhaseIndex + 1}/${phases.length}) · ${speakerTimeSec}S/SPEAKER`
                        : `STRUCTURED · ${speakerTimeSec}S/SPEAKER`}
                    </Text>
                  )}
                  {callStartedAt && <CallDuration startedAt={callStartedAt} />}
                </HStack>
                <HStack spacing={1} flexShrink={0}>
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
                <Box bg={theaterCard} border="1px solid" borderColor={theaterBorder} borderRadius="lg" px={3} py={2.5} mb={3} flexShrink={0}>
                  <HStack justify="space-between" align="flex-start" spacing={3}>
                    <HStack spacing={2}>
                      <Icon as={FiClock} color="whiteAlpha.700" />
                      {currentSpeaker ? (
                        <HStack spacing={2}>
                          <Text fontSize="sm" color="white">
                            <Text as="span" fontWeight="700">
                              {currentSpeaker.id === myUserId ? 'You' : currentSpeaker.username}
                            </Text>{' '}
                            {currentSpeaker.id === myUserId ? 'are' : 'is'} speaking
                          </Text>
                          {currentSpeakerStartedAt && speakerTimeSec && <SpeakerTimer startedAt={currentSpeakerStartedAt} durationSec={speakerTimeSec} />}
                        </HStack>
                      ) : (
                        <Text fontSize="sm" color="whiteAlpha.700">
                          No one is speaking — raise your hand to start.
                        </Text>
                      )}
                    </HStack>
                    <HStack spacing={1}>
                      {isHost && phases && currentPhaseIndex !== null && currentPhaseIndex < phases.length - 1 && (
                        <Button size="xs" variant="outline" borderColor={sage} color={sage} onClick={onAdvancePhase}>
                          Next: {phases[currentPhaseIndex + 1].name}
                        </Button>
                      )}
                      {isHost && currentSpeaker && (
                        <IconButton
                          aria-label="Skip to next speaker"
                          icon={<Icon as={FiSkipForward} />}
                          size="xs"
                          variant="ghost"
                          color="whiteAlpha.700"
                          onClick={onSkipSpeaker}
                        />
                      )}
                    </HStack>
                  </HStack>
                </Box>
              )}

              <Box flex={1} overflowY="auto" position="relative" borderRadius="xl" overflow="hidden">
                {/* The spotlighted aisle backdrop — purely atmospheric, sits behind everything. */}
                <Box
                  position="absolute"
                  inset={0}
                  zIndex={0}
                  sx={{
                    background: 'radial-gradient(ellipse 60% 50% at 50% 0%, rgba(147,112,219,0.28) 0%, rgba(147,112,219,0.06) 55%, transparent 75%)',
                  }}
                />
                <Box
                  position="absolute"
                  top={{ base: '14%', md: '16%' }}
                  left="50%"
                  transform="translateX(-50%)"
                  w={{ base: '94%', sm: '90%', md: '85%' }}
                  h={{ base: '86%', md: '84%' }}
                  zIndex={0}
                  sx={{
                    clipPath: 'polygon(40% 0%, 60% 0%, 100% 100%, 0% 100%)',
                    background: 'linear-gradient(180deg, rgba(147,112,219,0.18) 0%, rgba(88,66,140,0.05) 100%)',
                  }}
                />
                {/* Faint floor-grid texture within the same trapezoid mask — the "professional
                    perspective floor" touch from the Figma reference. */}
                <Box
                  position="absolute"
                  top={{ base: '14%', md: '16%' }}
                  left="50%"
                  transform="translateX(-50%)"
                  w={{ base: '94%', sm: '90%', md: '85%' }}
                  h={{ base: '86%', md: '84%' }}
                  zIndex={0}
                  opacity={0.5}
                  sx={{
                    clipPath: 'polygon(40% 0%, 60% 0%, 100% 100%, 0% 100%)',
                    backgroundImage:
                      'repeating-linear-gradient(90deg, rgba(255,255,255,0.07) 0, rgba(255,255,255,0.07) 1px, transparent 1px, transparent 12.5%), repeating-linear-gradient(0deg, rgba(255,255,255,0.06) 0, rgba(255,255,255,0.06) 1px, transparent 1px, transparent 16%)',
                  }}
                />

                <Stack align="center" spacing={{ base: 3, md: 5 }} position="relative" zIndex={1} py={2}>
                  <TvFrame>{renderFeatured(featuredTile)}</TvFrame>

                  {aisleTiles.length > 0 && (
                    <HStack
                      spacing={{ base: 3, md: 5 }}
                      flexWrap="wrap"
                      justify="flex-start"
                      w={{ base: '92%', sm: '88%', md: '82%' }}
                      pl={{ base: 2, md: 4 }}
                    >
                      {aisleTiles.map((t) => (
                        <Box key={t.key}>{renderBubble(t)}</Box>
                      ))}
                    </HStack>
                  )}
                </Stack>

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

              <HStack justify="center" spacing={3} pt={3} mt={2} borderTop="1px solid" borderColor={theaterBorder} flexShrink={0}>
                {structured ? (
                  <Button
                    leftIcon={<Icon as={PiHandPalmFill} />}
                    borderRadius="full"
                    size="lg"
                    px={5}
                    bg={handActive ? sage : 'white'}
                    color={handActive ? 'white' : '#2E1F26'}
                    border="1px solid"
                    borderColor={handActive ? sage : theaterBorder}
                    _hover={{ bg: handActive ? sageDeep : 'whiteAlpha.900' }}
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
                    color={micEnabled ? '#2E1F26' : 'white'}
                    onClick={onToggleMic}
                  />
                )}
                <IconButton
                  aria-label={cameraEnabled ? 'Turn camera off' : 'Turn camera on'}
                  icon={<Icon as={cameraEnabled ? FiVideo : FiVideoOff} />}
                  borderRadius="full"
                  size="lg"
                  bg={cameraEnabled ? 'white' : rose}
                  color={cameraEnabled ? '#2E1F26' : 'white'}
                  onClick={onToggleCamera}
                />
                {captionsSupported && (
                  <IconButton
                    aria-label={captionsEnabled ? 'Turn off captions of my speech' : 'Caption my speech'}
                    icon={<Icon as={PiClosedCaptioningBold} />}
                    borderRadius="full"
                    size="lg"
                    bg={captionsEnabled ? sage : 'white'}
                    color={captionsEnabled ? 'white' : '#2E1F26'}
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
