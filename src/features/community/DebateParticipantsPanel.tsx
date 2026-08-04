import { useCallback, useEffect, useState } from 'react';
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
  IconButton,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Skeleton,
  Stack,
  Text,
} from '@chakra-ui/react';
import { FiCheck, FiUsers, FiX } from 'react-icons/fi';
import { fetchDebateRoster, DebateRequest } from '../../api/spaces';
import { ink, inkSoft, rose, roseTint, sage, sageDeep, sageTint, line, serif } from '../../theme/brand';

const STATUS_STYLE = {
  APPROVED: { label: 'Approved', bg: sageTint, color: sageDeep },
  PENDING: { label: 'Pending', bg: '#FBF0DC', color: '#B4823D' },
  DECLINED: { label: 'Declined', bg: roseTint, color: rose },
} as const;

/* Trigger + sidebar: replaces the old always-on inline "pending requests" / "approved
   participants" boxes with a compact people-count badge that opens the full roster —
   every status (approved, pending, declined) in one place, moderator-only. */
const DebateParticipantsPanel = ({
  isOpen,
  channelId,
  onOpen,
  onClose,
  onAdmit,
  onDeny,
  onRevoke,
  hasQuestion,
}: {
  isOpen: boolean;
  channelId: string;
  onOpen: () => void;
  onClose: () => void;
  onAdmit: (requestId: string, side?: 'FOR' | 'AGAINST') => Promise<void>;
  onDeny: (requestId: string) => Promise<void>;
  onRevoke: (requestId: string) => Promise<void>;
  /** Whether the debate has a motion — side assignment on approval only makes sense then. */
  hasQuestion: boolean;
}) => {
  const [roster, setRoster] = useState<DebateRequest[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    const result = await fetchDebateRoster(channelId).catch(() => null);
    if (result) setRoster(result);
    if (!silent) setLoading(false);
  }, [channelId]);

  // While the panel is open, poll for new join requests / status changes — a moderator
  // sitting on this sidebar shouldn't need to close and reopen it to see something new.
  useEffect(() => {
    if (!isOpen) return;
    load();
    const interval = setInterval(() => load(true), 4000);
    return () => clearInterval(interval);
  }, [isOpen, load]);

  const approved = (roster || []).filter((r) => r.status === 'APPROVED');
  const pending = (roster || []).filter((r) => r.status === 'PENDING');
  const declined = (roster || []).filter((r) => r.status === 'DECLINED');

  const act = async (fn: () => Promise<void>, id: string) => {
    try {
      setBusyId(id);
      await fn();
      await load();
    } finally {
      setBusyId(null);
    }
  };

  const renderGroup = (title: string, items: DebateRequest[], style: (typeof STATUS_STYLE)[keyof typeof STATUS_STYLE], renderActions?: (r: DebateRequest) => React.ReactNode) => (
    <Box>
      <Text fontSize="xs" fontWeight="700" color={inkSoft} textTransform="uppercase" letterSpacing="0.05em" mb={2}>
        {title} ({items.length})
      </Text>
      {items.length === 0 ? (
        <Text fontSize="xs" color={inkSoft} fontStyle="italic">
          None yet.
        </Text>
      ) : (
        <Stack spacing={1.5}>
          {items.map((r) => (
            <HStack key={r.id} justify="space-between" bg="white" border="1px solid" borderColor={line} borderRadius="lg" px={2.5} py={1.5}>
              <HStack spacing={2} minW={0}>
                <Avatar size="xs" name={r.user.username} />
                <Text fontSize="sm" color={ink} noOfLines={1}>
                  @{r.user.username}
                </Text>
                {r.side && (
                  <Badge fontSize="9px" borderRadius="full" px={1.5} bg={r.side === 'FOR' ? sageTint : roseTint} color={r.side === 'FOR' ? sageDeep : rose}>
                    {r.side}
                  </Badge>
                )}
              </HStack>
              {renderActions ? renderActions(r) : (
                <Badge fontSize="9px" borderRadius="full" px={2} bg={style.bg} color={style.color}>
                  {style.label}
                </Badge>
              )}
            </HStack>
          ))}
        </Stack>
      )}
    </Box>
  );

  return (
    <>
      <Button size="sm" variant="outline" borderColor={line} leftIcon={<FiUsers />} onClick={onOpen} position="relative">
        {approved.length}
        {pending.length > 0 && (
          <Badge position="absolute" top={-1.5} right={-1.5} borderRadius="full" fontSize="9px" bg="#B4823D" color="white" px={1.5}>
            {pending.length}
          </Badge>
        )}
      </Button>

      <Drawer isOpen={isOpen} placement="right" onClose={onClose} size="sm">
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader fontFamily={serif} borderBottom="1px solid" borderColor={line}>
            Debate participants
          </DrawerHeader>
          <DrawerBody py={4}>
            {loading && !roster ? (
              <Stack spacing={3}>
                <Skeleton h="40px" borderRadius="lg" />
                <Skeleton h="40px" borderRadius="lg" />
              </Stack>
            ) : (
              <Stack spacing={5}>
                {renderGroup('Approved', approved, STATUS_STYLE.APPROVED, (r) => (
                  <Button size="xs" variant="outline" borderColor={line} color={inkSoft} isLoading={busyId === r.id} onClick={() => act(() => onRevoke(r.id), r.id)}>
                    Revoke
                  </Button>
                ))}
                {renderGroup('Pending', pending, STATUS_STYLE.PENDING, (r) => (
                  <HStack spacing={1}>
                    {hasQuestion ? (
                      <Menu placement="bottom-end">
                        <MenuButton as={IconButton} aria-label="Approve" icon={<FiCheck />} size="xs" bg={sage} color="white" isLoading={busyId === r.id} />
                        <MenuList fontSize="sm" minW="160px">
                          <MenuItem onClick={() => act(() => onAdmit(r.id, 'FOR'), r.id)}>Approve — For</MenuItem>
                          <MenuItem onClick={() => act(() => onAdmit(r.id, 'AGAINST'), r.id)}>Approve — Against</MenuItem>
                          <MenuItem onClick={() => act(() => onAdmit(r.id), r.id)}>Approve — no side</MenuItem>
                        </MenuList>
                      </Menu>
                    ) : (
                      <IconButton aria-label="Approve" icon={<FiCheck />} size="xs" bg={sage} color="white" isLoading={busyId === r.id} onClick={() => act(() => onAdmit(r.id), r.id)} />
                    )}
                    <IconButton aria-label="Decline" icon={<FiX />} size="xs" bg={rose} color="white" isLoading={busyId === r.id} onClick={() => act(() => onDeny(r.id), r.id)} />
                  </HStack>
                ))}
                {renderGroup('Declined', declined, STATUS_STYLE.DECLINED)}
              </Stack>
            )}
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </>
  );
};

export default DebateParticipantsPanel;
