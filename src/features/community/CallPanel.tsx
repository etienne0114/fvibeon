import { useEffect, useRef } from 'react';
import { Box, Circle, Grid, HStack, Icon, IconButton, Modal, ModalContent, ModalOverlay, Stack, Text, Alert, AlertIcon } from '@chakra-ui/react';
import { FiMic, FiMicOff, FiVideo, FiVideoOff, FiPhoneOff } from 'react-icons/fi';
import { RemoteParticipant } from '../../hooks/useWebRTCCall';
import { ink, inkSoft, rose, roseDeep, card, line, serif } from '../../theme/brand';

const VideoTile = ({
  stream,
  label,
  muted,
  cameraOff,
}: {
  stream: MediaStream | null;
  label: string;
  muted?: boolean;
  cameraOff?: boolean;
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) videoRef.current.srcObject = stream;
  }, [stream]);

  const hasVideoTrack = Boolean(stream?.getVideoTracks().some((t) => t.enabled));

  return (
    <Box position="relative" bg={ink} borderRadius="lg" overflow="hidden" aspectRatio="4/3" minH="140px">
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
  onToggleMic,
  onToggleCamera,
  onLeave,
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
  onToggleMic: () => void;
  onToggleCamera: () => void;
  onLeave: () => void;
}) => (
  <Modal isOpen={isOpen} onClose={onLeave} size="4xl" isCentered closeOnOverlayClick={false} closeOnEsc={false}>
    <ModalOverlay />
    <ModalContent bg={card} borderRadius="xl" p={{ base: 4, md: 6 }}>
      <Stack spacing={4}>
        <HStack justify="space-between">
          <Text fontFamily={serif} fontWeight="600" fontSize="lg" color={ink}>
            Call in #{channelName}
          </Text>
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

        {status === 'in-call' && (
          <Grid templateColumns={{ base: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }} gap={3}>
            <VideoTile stream={localStream} label={`${myUsername} (you)`} muted cameraOff={!cameraEnabled} />
            {remoteParticipants.map((p) => (
              <VideoTile key={p.userId} stream={p.stream} label={p.username} />
            ))}
          </Grid>
        )}

        <HStack justify="center" spacing={3} pt={2} borderTop="1px solid" borderColor={line}>
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

export default CallPanel;
