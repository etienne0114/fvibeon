import { useEffect, useRef } from 'react';
import { Badge, Box, Circle, HStack, Icon, Menu, MenuButton, MenuItem, MenuList, Text } from '@chakra-ui/react';
import { FiMicOff, FiMoreVertical, FiUserX, FiVolumeX } from 'react-icons/fi';
import { ink, inkSoft, roseDeep, sage, sageDeep, serif } from '../../../theme/brand';

const VideoTile = ({
  stream,
  label,
  muted,
  cameraOff,
  micOff,
  isSpeaking,
  canManage,
  onKick,
  onForceMute,
}: {
  stream: MediaStream | null;
  label: string;
  muted?: boolean;
  cameraOff?: boolean;
  micOff?: boolean;
  isSpeaking?: boolean;
  canManage?: boolean;
  onKick?: () => void;
  onForceMute?: () => void;
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

      <HStack position="absolute" bottom={1.5} left={2} spacing={1.5}>
        <Text fontSize="xs" color="white" bg="blackAlpha.600" px={2} py={0.5} borderRadius="md">
          {label}
        </Text>
        {micOff && (
          <Box bg="blackAlpha.600" borderRadius="full" p={1}>
            <Icon as={FiMicOff} color="white" boxSize={3} />
          </Box>
        )}
      </HStack>

      {isSpeaking && (
        <Badge position="absolute" top={1.5} left={1.5} bg={sageDeep} color="white" fontSize="9px" borderRadius="full" px={2}>
          Speaking
        </Badge>
      )}

      {canManage && (onKick || onForceMute) && (
        <Menu placement="bottom-end">
          <MenuButton
            position="absolute"
            top={1.5}
            right={1.5}
            as={Box}
            bg="blackAlpha.600"
            borderRadius="full"
            p={1}
            cursor="pointer"
            _hover={{ bg: 'blackAlpha.700' }}
          >
            <Icon as={FiMoreVertical} color="white" boxSize={3.5} />
          </MenuButton>
          <MenuList fontSize="sm" color={inkSoft} minW="180px">
            {onForceMute && (
              <MenuItem icon={<FiVolumeX />} onClick={onForceMute} isDisabled={micOff}>
                Mute for everyone
              </MenuItem>
            )}
            {onKick && (
              <MenuItem icon={<FiUserX />} color={roseDeep} onClick={onKick}>
                Remove from call
              </MenuItem>
            )}
          </MenuList>
        </Menu>
      )}
    </Box>
  );
};

export default VideoTile;
