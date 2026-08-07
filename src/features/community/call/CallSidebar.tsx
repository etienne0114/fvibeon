import {
  Avatar,
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
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Stack,
  Text,
  useDisclosure,
} from '@chakra-ui/react';
import { FiCheck, FiMic, FiMicOff, FiMoreVertical, FiUsers, FiUserX, FiVideo, FiVideoOff, FiVolumeX, FiX } from 'react-icons/fi';
import { PendingJoinRequest } from '../../../api/calls';
import { rose, roseDeep, sage, sageDeep, serif } from '../../../theme/brand';

export interface SidebarParticipant {
  userId: string;
  username: string;
  micEnabled: boolean;
  cameraEnabled: boolean;
  isSpeaking: boolean;
}

/* A compact people-count trigger that opens the participant list as a popup — keeps the
   call header uncluttered (especially on small screens) instead of an always-open sidebar. */
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
}) => {
  const { isOpen, onOpen, onClose } = useDisclosure();

  return (
    <>
      <Button
        size="sm"
        variant="ghost"
        color="white"
        leftIcon={<Icon as={FiUsers} />}
        _hover={{ bg: 'whiteAlpha.200' }}
        position="relative"
        onClick={onOpen}
      >
        {participants.length}
        {isHost && joinRequests.length > 0 && (
          <Badge position="absolute" top={-1} right={-1} borderRadius="full" fontSize="9px" bg="#B4823D" color="white" px={1.5}>
            {joinRequests.length}
          </Badge>
        )}
      </Button>

      <Drawer isOpen={isOpen} onClose={onClose} placement="right" size="xs">
        <DrawerOverlay />
        <DrawerContent bg="#1a1530">
          <DrawerCloseButton color="white" />
          <DrawerHeader fontFamily={serif} color="white" borderBottom="1px solid" borderColor="whiteAlpha.200">
            Participants
          </DrawerHeader>
          <DrawerBody py={4}>
            <Stack spacing={4}>
              {isHost && joinRequests.length > 0 && (
                <Box bg="whiteAlpha.100" borderRadius="lg" p={3}>
                  <Text fontSize="xs" fontWeight="700" color={sage} textTransform="uppercase" letterSpacing="0.05em" mb={2}>
                    Waiting to join ({joinRequests.length})
                  </Text>
                  <Stack spacing={2}>
                    {joinRequests.map((r) => (
                      <HStack key={r.userId} justify="space-between">
                        <HStack spacing={2}>
                          <Avatar size="xs" name={r.username} />
                          <Text fontSize="sm" color="white">
                            @{r.username}
                          </Text>
                        </HStack>
                        <HStack spacing={1}>
                          <IconButton aria-label="Admit" icon={<FiCheck />} size="xs" bg={sage} color="white" _hover={{ bg: sageDeep }} onClick={() => onAdmit(r.userId)} />
                          <IconButton
                            aria-label="Deny"
                            icon={<FiX />}
                            size="xs"
                            variant="outline"
                            borderColor="whiteAlpha.400"
                            color="white"
                            onClick={() => onDeny(r.userId)}
                          />
                        </HStack>
                      </HStack>
                    ))}
                  </Stack>
                </Box>
              )}

              <Box>
                <Text fontSize="xs" fontWeight="700" color="whiteAlpha.700" textTransform="uppercase" letterSpacing="0.05em" mb={2}>
                  In this call ({participants.length})
                </Text>
                <Stack spacing={1}>
                  {participants.map((p) => (
                    <HStack key={p.userId} justify="space-between" borderRadius="md" px={2} py={1.5} _hover={{ bg: 'whiteAlpha.100' }}>
                      <HStack spacing={2} minW={0}>
                        <Avatar size="xs" name={p.username} />
                        <Text fontSize="sm" color="white" noOfLines={1}>
                          {p.username}
                        </Text>
                        {p.isSpeaking && (
                          <Badge fontSize="8px" bg="whiteAlpha.200" color={sage} borderRadius="full" px={1.5}>
                            live
                          </Badge>
                        )}
                      </HStack>
                      <HStack spacing={1.5} flexShrink={0}>
                        <Icon as={p.micEnabled ? FiMic : FiMicOff} color={p.micEnabled ? 'whiteAlpha.700' : rose} boxSize={3.5} />
                        <Icon as={p.cameraEnabled ? FiVideo : FiVideoOff} color={p.cameraEnabled ? 'whiteAlpha.700' : rose} boxSize={3.5} />
                        {isHost && p.userId !== myUserId && (
                          <Menu placement="bottom-end">
                            <MenuButton as={IconButton} aria-label="Manage participant" icon={<FiMoreVertical />} size="xs" variant="ghost" color="whiteAlpha.700" />
                            <MenuList fontSize="sm" minW="180px">
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
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </>
  );
};

export default CallSidebar;
