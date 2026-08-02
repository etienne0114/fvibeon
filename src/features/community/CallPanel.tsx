import { useEffect, useState } from 'react';
import {
  Alert,
  AlertIcon,
  Box,
  Button,
  Grid,
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
import { PiHandPalmFill } from 'react-icons/pi';
import { RemoteParticipant } from '../../hooks/useWebRTCCall';
import { PendingJoinRequest, QueuedSpeaker, SpeakingMode } from '../../api/calls';
import { ink, inkSoft, rose, roseDeep, sage, sageDeep, sageTint, card, line, serif } from '../../theme/brand';
import VideoTile from './call/VideoTile';
import CallSidebar, { SidebarParticipant } from './call/CallSidebar';
import CallSettingsPopover from './call/CallSettingsPopover';

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
}) => {
  const structured = speakingMode === 'STRUCTURED';
  const isSpeaking = structured && currentSpeaker?.id === myUserId;
  const inQueue = structured && queue.some((q) => q.id === myUserId);
  const handActive = isSpeaking || inQueue;

  const sidebarParticipants: SidebarParticipant[] = [
    { userId: myUserId || 'me', username: `${myUsername} (you)`, micEnabled, cameraEnabled, isSpeaking: Boolean(isSpeaking) },
    ...remoteParticipants.map((p) => ({
      userId: p.userId,
      username: p.username,
      micEnabled: p.micEnabled,
      cameraEnabled: p.cameraEnabled,
      isSpeaking: structured && currentSpeaker?.id === p.userId,
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
                      STRUCTURED · {speakerTimeSec}S/SPEAKER
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
                    {isHost && currentSpeaker && (
                      <IconButton aria-label="Skip to next speaker" icon={<Icon as={FiSkipForward} />} size="xs" variant="ghost" onClick={onSkipSpeaker} />
                    )}
                  </HStack>
                </Box>
              )}

              <HStack flex={1} spacing={4} align="stretch" minH={0}>
                <Box flex={1} overflowY="auto">
                  <Grid templateColumns={{ base: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }} gap={3}>
                    <VideoTile stream={localStream} label={`${myUsername} (you)`} muted cameraOff={!cameraEnabled} micOff={!micEnabled} isSpeaking={isSpeaking} />
                    {remoteParticipants.map((p) => (
                      <VideoTile
                        key={p.userId}
                        stream={p.stream}
                        label={p.username}
                        cameraOff={!p.cameraEnabled}
                        micOff={!p.micEnabled}
                        isSpeaking={structured && currentSpeaker?.id === p.userId}
                        canManage={isHost}
                        onKick={() => onKick(p.userId)}
                        onForceMute={() => onForceMute(p.userId)}
                      />
                    ))}
                  </Grid>
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
