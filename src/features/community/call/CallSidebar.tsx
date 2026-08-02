import { Avatar, Badge, Box, HStack, Icon, IconButton, Menu, MenuButton, MenuItem, MenuList, Stack, Text } from '@chakra-ui/react';
import { FiCheck, FiMic, FiMicOff, FiMoreVertical, FiUserX, FiVideo, FiVideoOff, FiVolumeX, FiX } from 'react-icons/fi';
import { PendingJoinRequest } from '../../../api/calls';
import { ink, inkSoft, line, rose, roseDeep, sage, sageDeep, sageTint } from '../../../theme/brand';

export interface SidebarParticipant {
  userId: string;
  username: string;
  micEnabled: boolean;
  cameraEnabled: boolean;
  isSpeaking: boolean;
}

/* Two-sided call layout, right pane: who's here (with live mic/camera state and host
   moderation actions) and, for the host, anyone waiting to be let in. */
const CallSidebar = ({
  participants,
  myUserId,
  isHost,
  joinRequests,
  onAdmit,
  onDeny,
  onKick,
  onForceMute,
}: {
  participants: SidebarParticipant[];
  myUserId?: string;
  isHost: boolean;
  joinRequests: PendingJoinRequest[];
  onAdmit: (userId: string) => void;
  onDeny: (userId: string) => void;
  onKick: (userId: string) => void;
  onForceMute: (userId: string) => void;
}) => (
  <Stack spacing={4} w="280px" flexShrink={0} h="full" overflowY="auto" pl={1}>
    {isHost && joinRequests.length > 0 && (
      <Box bg={sageTint} borderRadius="lg" p={3}>
        <Text fontSize="xs" fontWeight="700" color={sageDeep} textTransform="uppercase" letterSpacing="0.05em" mb={2}>
          Waiting to join ({joinRequests.length})
        </Text>
        <Stack spacing={2}>
          {joinRequests.map((r) => (
            <HStack key={r.userId} justify="space-between">
              <HStack spacing={2}>
                <Avatar size="xs" name={r.username} />
                <Text fontSize="sm" color={ink}>
                  @{r.username}
                </Text>
              </HStack>
              <HStack spacing={1}>
                <IconButton aria-label="Admit" icon={<FiCheck />} size="xs" bg={sage} color="white" _hover={{ bg: sageDeep }} onClick={() => onAdmit(r.userId)} />
                <IconButton aria-label="Deny" icon={<FiX />} size="xs" variant="outline" borderColor={line} onClick={() => onDeny(r.userId)} />
              </HStack>
            </HStack>
          ))}
        </Stack>
      </Box>
    )}

    <Box>
      <Text fontSize="xs" fontWeight="700" color={inkSoft} textTransform="uppercase" letterSpacing="0.05em" mb={2}>
        In this call ({participants.length})
      </Text>
      <Stack spacing={1}>
        {participants.map((p) => (
          <HStack key={p.userId} justify="space-between" borderRadius="md" px={2} py={1.5} _hover={{ bg: 'blackAlpha.50' }}>
            <HStack spacing={2} minW={0}>
              <Avatar size="xs" name={p.username} />
              <Text fontSize="sm" color={ink} noOfLines={1}>
                {p.username}
              </Text>
              {p.isSpeaking && (
                <Badge fontSize="8px" bg={sageTint} color={sageDeep} borderRadius="full" px={1.5}>
                  live
                </Badge>
              )}
            </HStack>
            <HStack spacing={1.5} flexShrink={0}>
              <Icon as={p.micEnabled ? FiMic : FiMicOff} color={p.micEnabled ? inkSoft : rose} boxSize={3.5} />
              <Icon as={p.cameraEnabled ? FiVideo : FiVideoOff} color={p.cameraEnabled ? inkSoft : rose} boxSize={3.5} />
              {isHost && p.userId !== myUserId && (
                <Menu placement="bottom-end">
                  <MenuButton as={IconButton} aria-label="Manage participant" icon={<FiMoreVertical />} size="xs" variant="ghost" />
                  <MenuList fontSize="sm" color={inkSoft} minW="180px">
                    <MenuItem icon={<FiVolumeX />} onClick={() => onForceMute(p.userId)} isDisabled={!p.micEnabled}>
                      Mute for everyone
                    </MenuItem>
                    <MenuItem icon={<FiUserX />} color={roseDeep} onClick={() => onKick(p.userId)}>
                      Remove from call
                    </MenuItem>
                  </MenuList>
                </Menu>
              )}
            </HStack>
          </HStack>
        ))}
      </Stack>
    </Box>
  </Stack>
);

export default CallSidebar;
