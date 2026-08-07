import { useEffect, useRef } from 'react';
import { Badge, Box, Circle, Icon, Menu, MenuButton, MenuItem, MenuList, ResponsiveValue, Stack, Text } from '@chakra-ui/react';
import { FiMicOff, FiMoreVertical, FiUserX, FiVolumeX } from 'react-icons/fi';
import { rose, roseDeep, sage, serif } from '../../../theme/brand';

const DEFAULT_SIZE: ResponsiveValue<string> = { base: '52px', sm: '64px', md: '76px' };

/* A member's spot in the aisle — small circular video/avatar bubble with their name in a
   pill underneath, matching the theater layout's look. Same prop shape as VideoTile so the
   two are interchangeable data-wise; only the shell is different (circle vs. TV rectangle). */
const TheaterBubble = ({
  stream,
  label,
  muted,
  cameraOff,
  micOff,
  isSpeaking,
  isOrganizer,
  size = DEFAULT_SIZE,
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
  isOrganizer?: boolean;
  size?: ResponsiveValue<string>;
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
    <Stack align="center" spacing={1.5} w={size}>
      <Box position="relative">
        <Circle
          size={size}
          overflow="hidden"
          bg="whiteAlpha.200"
          outline={isSpeaking ? '3px solid' : '2px solid'}
          outlineColor={isSpeaking ? sage : 'whiteAlpha.400'}
          boxShadow={isSpeaking ? '0 0 18px 3px rgba(127,169,155,0.55)' : 'none'}
          transition="box-shadow 0.2s, outline-color 0.2s"
        >
          {hasVideoTrack && !cameraOff ? (
            <video ref={videoRef} autoPlay playsInline muted={muted} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <Circle size="full" bg={roseDeep} color="white" fontFamily={serif} fontWeight="700" fontSize="lg">
              {label.charAt(0).toUpperCase()}
            </Circle>
          )}
        </Circle>

        {micOff && (
          <Circle position="absolute" bottom={0} right={0} size="22px" bg={rose} border="2px solid" borderColor="#14101f">
            <Icon as={FiMicOff} color="white" boxSize={2.5} />
          </Circle>
        )}

        {isOrganizer && (
          <Badge
            position="absolute"
            top={-1.5}
            left="50%"
            transform="translateX(-50%)"
            fontSize="7px"
            bg="whiteAlpha.900"
            color="#2E1F26"
            borderRadius="full"
            px={1.5}
          >
            Host
          </Badge>
        )}

        {canManage && (onKick || onForceMute) && (
          <Menu placement="bottom-end">
            <MenuButton
              position="absolute"
              bottom={-1}
              left={-1}
              as={Box}
              bg="blackAlpha.700"
              borderRadius="full"
              p={0.5}
              cursor="pointer"
              _hover={{ bg: 'blackAlpha.800' }}
            >
              <Icon as={FiMoreVertical} color="white" boxSize={3} />
            </MenuButton>
            <MenuList fontSize="sm" minW="180px">
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

      <Text fontSize="xs" color="white" bg="whiteAlpha.200" px={2} py={0.5} borderRadius="full" noOfLines={1} maxW="full">
        {label}
      </Text>
    </Stack>
  );
};

export default TheaterBubble;
