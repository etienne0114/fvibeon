import { useEffect, useRef, useState } from 'react';
import { Avatar, AvatarGroup, Badge, Box, Button, Circle, Grid, HStack, Icon, IconButton, Modal, ModalContent, ModalOverlay, Stack, Text, Alert, AlertIcon } from '@chakra-ui/react';
import { FiMic, FiMicOff, FiVideo, FiVideoOff, FiPhoneOff, FiClock, FiSkipForward } from 'react-icons/fi';
import { PiHandPalmFill } from 'react-icons/pi';
import { RemoteParticipant } from '../../hooks/useWebRTCCall';
import { QueuedSpeaker, SpeakingMode } from '../../api/calls';
import { ink, inkSoft, rose, roseDeep, sage, sageDeep, sageTint, card, line, serif } from '../../theme/brand';

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

const VideoTile = ({
  stream,
  label,
  muted,
  cameraOff,
  isSpeaking,
}: {
  stream: MediaStream | null;
  label: string;
  muted?: boolean;
  cameraOff?: boolean;
  isSpeaking?: boolean;
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) videoRef.current.srcObject = stream;
  }, [stream]);

  const hasVideoTrack = Boolean(stream?.getVideoTracks().some((t) => t.enabled));

  return (
    <Box
      position="relative"
      bg={ink}
      borderRadius="lg"
      overflow="hidden"
      aspectRatio="4/3"
      minH="140px"
      outline={isSpeaking ? '3px solid' : undefined}
      outlineColor={isSpeaking ? sage : undefined}
    >
      {hasVideoTrack && !cameraOff ? (
        <video ref={videoRef} autoPlay playsInline muted={muted} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      ) : (
        <Box w="full" h="full" display="flex" alignItems="center" justifyContent="center">
          <Circle size="56px" bg={roseDeep} color="white" fontFamily={serif} fontWeight="700" fontSize="lg">
            {label.charAt(0).toUpperCase()}
          </Circle>
        </Box>
      )}
      <Text position="absolute" bottom={1.5} left={2} fontSize="xs" color="white" bg="blackAlpha.600" px={2} py={0.5} borderRadius="md">
        {label}
      </Text>
      {isSpeaking && (
        <Badge position="absolute" top={1.5} right={1.5} bg={sageDeep} color="white" fontSize="9px" borderRadius="full" px={2}>
          Speaking
        </Badge>
      )}
    </Box>
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
  isModerator,
  speakingMode,
  speakerTimeSec,
  currentSpeaker,
  currentSpeakerStartedAt,
  queue,
  onToggleMic,
  onToggleCamera,
  onLeave,
  onRaiseHand,
  onLowerHand,
  onSkipSpeaker,
}: {
  isOpen: boolean;
  channelName: string;
  status: 'idle' | 'connecting' | 'in-call' | 'error';
  error: string | null;
  localStream: MediaStream | null;
  remoteParticipants: RemoteParticipant[];
  micEnabled: boolean;
  cameraEnabled: boolean;
  myUsername: string;
  myUserId?: string;
  isModerator: boolean;
  speakingMode: SpeakingMode;
  speakerTimeSec: number | null;
  currentSpeaker: QueuedSpeaker | null;
  currentSpeakerStartedAt: string | null;
  queue: QueuedSpeaker[];
  onToggleMic: () => void;
  onToggleCamera: () => void;
  onLeave: () => void;
  onRaiseHand: () => void;
  onLowerHand: () => void;
  onSkipSpeaker: () => void;
}) => {
  const structured = speakingMode === 'STRUCTURED';
  const isSpeaking = structured && currentSpeaker?.id === myUserId;
  const inQueue = structured && queue.some((q) => q.id === myUserId);
  const handActive = isSpeaking || inQueue;

  return (
    <Modal isOpen={isOpen} onClose={onLeave} size="4xl" isCentered closeOnOverlayClick={false} closeOnEsc={false}>
      <ModalOverlay />
      <ModalContent bg={card} borderRadius="xl" p={{ base: 4, md: 6 }}>
        <Stack spacing={4}>
          <HStack justify="space-between">
            <HStack spacing={2}>
              <Text fontFamily={serif} fontWeight="600" fontSize="lg" color={ink}>
                Call in #{channelName}
              </Text>
              {structured && (
                <Badge fontSize="9px" borderRadius="full" px={2} bg={sageTint} color={sageDeep}>
                  Structured · {speakerTimeSec}s/speaker
                </Badge>
              )}
            </HStack>
            <Text fontSize="xs" color={inkSoft}>
              {remoteParticipants.length + 1} in call
            </Text>
          </HStack>

          {status === 'connecting' && (
            <Text fontSize="sm" color={inkSoft} textAlign="center" py={8}>
              Connecting — check your browser's camera/mic permission prompt...
            </Text>
          )}

          {error && (
            <Alert status="error" borderRadius="lg" fontSize="sm">
              <AlertIcon />
              {error}
            </Alert>
          )}

          {status === 'in-call' && structured && (
            <Box bg="white" border="1px solid" borderColor={line} borderRadius="lg" px={3} py={2.5}>
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
                {isModerator && currentSpeaker && (
                  <IconButton aria-label="Skip to next speaker" icon={<Icon as={FiSkipForward} />} size="xs" variant="ghost" onClick={onSkipSpeaker} />
                )}
              </HStack>
              {queue.length > 0 && (
                <HStack mt={2} spacing={2}>
                  <Text fontSize="xs" color={inkSoft}>
                    Up next:
                  </Text>
                  <AvatarGroup size="xs" max={6}>
                    {queue.map((q) => (
                      <Avatar key={q.id} name={q.username} />
                    ))}
                  </AvatarGroup>
                </HStack>
              )}
            </Box>
          )}

          {status === 'in-call' && (
            <Grid templateColumns={{ base: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }} gap={3}>
              <VideoTile stream={localStream} label={`${myUsername} (you)`} muted cameraOff={!cameraEnabled} isSpeaking={isSpeaking} />
              {remoteParticipants.map((p) => (
                <VideoTile key={p.userId} stream={p.stream} label={p.username} isSpeaking={structured && currentSpeaker?.id === p.userId} />
              ))}
            </Grid>
          )}

          <HStack justify="center" spacing={3} pt={2} borderTop="1px solid" borderColor={line}>
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
        </Stack>
      </ModalContent>
    </Modal>
  );
};

export default CallPanel;
