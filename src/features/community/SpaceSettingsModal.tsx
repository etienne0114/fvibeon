import { useCallback, useEffect, useState } from 'react';
import {
  Badge,
  Button,
  FormControl,
  FormLabel,
  HStack,
  IconButton,
  Input,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Radio,
  RadioGroup,
  Skeleton,
  Stack,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
  Textarea,
  useToast,
} from '@chakra-ui/react';
import { FiTrash2, FiMoreVertical, FiShield, FiUserPlus, FiUserX } from 'react-icons/fi';
import { updateSpace, deleteSpace, fetchMembers, updateMemberRole, removeMember, transferOwnership, SpaceDetail, SpaceMember } from '../../api/spaces';
import { useMe } from '../../hooks/useMe';
import { ConfirmModal } from './shared';
import { ink, inkSoft, rose, card, line, serif, sageDeep, sageTint, amberDeep, amberTint } from '../../theme/brand';

/* Role-gated Space settings — General (rename/describe/visibility/delete)
   and Members (promote/demote/remove/transfer ownership). */
const SpaceSettingsModal = ({
  isOpen,
  onClose,
  space,
  onUpdated,
  onDeleted,
}: {
  isOpen: boolean;
  onClose: () => void;
  space: SpaceDetail;
  onUpdated: () => void;
  onDeleted: () => void;
}) => {
  const { user: me } = useMe();
  const isOwner = space.myRole === 'OWNER';
  const [name, setName] = useState(space.name);
  const [description, setDescription] = useState(space.description || '');
  const [visibility, setVisibility] = useState<'PUBLIC' | 'PRIVATE'>(space.visibility);
  const [saving, setSaving] = useState(false);
  const [members, setMembers] = useState<SpaceMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [confirmDeleteSpace, setConfirmDeleteSpace] = useState(false);
  const [confirmRemoveMember, setConfirmRemoveMember] = useState<SpaceMember | null>(null);
  const [confirmTransfer, setConfirmTransfer] = useState<SpaceMember | null>(null);
  const [busyMemberId, setBusyMemberId] = useState<string | null>(null);
  const toast = useToast();

  const loadMembers = useCallback(async () => {
    try {
      setLoadingMembers(true);
      setMembers(await fetchMembers(space.id));
    } catch {
      // leave list empty — the tab still shows a friendly empty state
    } finally {
      setLoadingMembers(false);
    }
  }, [space.id]);

  useEffect(() => {
    if (!isOpen) return;
    setName(space.name);
    setDescription(space.description || '');
    setVisibility(space.visibility);
    loadMembers();
  }, [isOpen, space, loadMembers]);

  const saveGeneral = async () => {
    try {
      setSaving(true);
      await updateSpace(space.id, { name, description, visibility });
      toast({ title: 'Space updated', status: 'success', duration: 2000, position: 'top' });
      onUpdated();
    } catch (err: any) {
      toast({ title: err?.response?.data?.error || 'Could not update space', status: 'error', duration: 3000, position: 'top' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSpace = async () => {
    try {
      setSaving(true);
      await deleteSpace(space.id);
      setConfirmDeleteSpace(false);
      onClose();
      onDeleted();
    } catch (err: any) {
      toast({ title: err?.response?.data?.error || 'Could not delete space', status: 'error', duration: 3000, position: 'top' });
    } finally {
      setSaving(false);
    }
  };

  const promote = async (member: SpaceMember) => {
    try {
      setBusyMemberId(member.user.id);
      await updateMemberRole(space.id, member.user.id, 'MODERATOR');
      await loadMembers();
    } catch (err: any) {
      toast({ title: err?.response?.data?.error || 'Could not promote', status: 'error', duration: 3000, position: 'top' });
    } finally {
      setBusyMemberId(null);
    }
  };

  const demote = async (member: SpaceMember) => {
    try {
      setBusyMemberId(member.user.id);
      await updateMemberRole(space.id, member.user.id, 'MEMBER');
      await loadMembers();
    } catch (err: any) {
      toast({ title: err?.response?.data?.error || 'Could not demote', status: 'error', duration: 3000, position: 'top' });
    } finally {
      setBusyMemberId(null);
    }
  };

  const handleRemoveMember = async () => {
    if (!confirmRemoveMember) return;
    try {
      setBusyMemberId(confirmRemoveMember.user.id);
      await removeMember(space.id, confirmRemoveMember.user.id);
      setConfirmRemoveMember(null);
      await loadMembers();
      onUpdated();
    } catch (err: any) {
      toast({ title: err?.response?.data?.error || 'Could not remove member', status: 'error', duration: 3000, position: 'top' });
    } finally {
      setBusyMemberId(null);
    }
  };

  const handleTransfer = async () => {
    if (!confirmTransfer) return;
    try {
      setBusyMemberId(confirmTransfer.user.id);
      await transferOwnership(space.id, confirmTransfer.user.id);
      setConfirmTransfer(null);
      toast({ title: `${confirmTransfer.user.username} now owns this space`, status: 'success', duration: 2500, position: 'top' });
      onUpdated();
      onClose();
    } catch (err: any) {
      toast({ title: err?.response?.data?.error || 'Could not transfer ownership', status: 'error', duration: 3000, position: 'top' });
    } finally {
      setBusyMemberId(null);
    }
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} isCentered size="lg">
        <ModalOverlay />
        <ModalContent borderRadius="xl">
          <ModalHeader fontFamily={serif}>Space settings</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <Tabs colorScheme="blackAlpha" size="sm">
              <TabList>
                <Tab>General</Tab>
                <Tab>Members ({members.length || space._count.memberships})</Tab>
              </TabList>
              <TabPanels>
                <TabPanel px={0}>
                  <Stack spacing={4}>
                    <FormControl>
                      <FormLabel fontSize="sm" color={inkSoft}>
                        Name
                      </FormLabel>
                      <Input value={name} onChange={(e) => setName(e.target.value)} borderColor={line} />
                    </FormControl>
                    <FormControl>
                      <FormLabel fontSize="sm" color={inkSoft}>
                        Description
                      </FormLabel>
                      <Textarea value={description} onChange={(e) => setDescription(e.target.value)} borderColor={line} rows={2} />
                    </FormControl>
                    <FormControl>
                      <FormLabel fontSize="sm" color={inkSoft}>
                        Visibility
                      </FormLabel>
                      <RadioGroup value={visibility} onChange={(v) => setVisibility(v as 'PUBLIC' | 'PRIVATE')}>
                        <Stack spacing={2}>
                          <Radio value="PUBLIC">
                            <Text fontSize="sm">Public — listed, anyone can join</Text>
                          </Radio>
                          <Radio value="PRIVATE">
                            <Text fontSize="sm">Private — invite link only</Text>
                          </Radio>
                        </Stack>
                      </RadioGroup>
                    </FormControl>
                    <HStack justify="space-between" pt={2}>
                      <Button size="sm" bg={ink} color="white" _hover={{ bg: '#463039' }} borderRadius="full" isLoading={saving} onClick={saveGeneral}>
                        Save changes
                      </Button>
                      {isOwner && (
                        <Button size="sm" variant="outline" borderColor={rose} color={rose} leftIcon={<FiTrash2 />} onClick={() => setConfirmDeleteSpace(true)}>
                          Delete space
                        </Button>
                      )}
                    </HStack>
                  </Stack>
                </TabPanel>
                <TabPanel px={0}>
                  {loadingMembers ? (
                    <Skeleton h="120px" borderRadius="lg" />
                  ) : (
                    <Stack spacing={2} maxH="360px" overflowY="auto">
                      {members.map((m) => {
                        const isSelf = m.user.id === me?.id;
                        const canManage = isOwner && !isSelf && m.role !== 'OWNER';
                        return (
                          <HStack key={m.id} justify="space-between" bg={card} borderRadius="lg" px={3} py={2}>
                            <HStack spacing={2}>
                              <Text fontSize="sm" fontWeight="600" color={ink}>
                                @{m.user.username}
                              </Text>
                              <Badge
                                fontSize="9px"
                                borderRadius="full"
                                px={2}
                                bg={m.role === 'OWNER' ? amberTint : m.role === 'MODERATOR' ? sageTint : 'gray.100'}
                                color={m.role === 'OWNER' ? amberDeep : m.role === 'MODERATOR' ? sageDeep : inkSoft}
                              >
                                {m.role}
                              </Badge>
                              {isSelf && (
                                <Text fontSize="10px" color={inkSoft}>
                                  (you)
                                </Text>
                              )}
                            </HStack>
                            {canManage && (
                              <Menu>
                                <MenuButton
                                  as={IconButton}
                                  aria-label="Manage member"
                                  icon={<FiMoreVertical />}
                                  size="xs"
                                  variant="ghost"
                                  isLoading={busyMemberId === m.user.id}
                                />
                                <MenuList fontSize="sm">
                                  {m.role === 'MEMBER' ? (
                                    <MenuItem icon={<FiShield />} onClick={() => promote(m)}>
                                      Promote to moderator
                                    </MenuItem>
                                  ) : (
                                    <MenuItem icon={<FiShield />} onClick={() => demote(m)}>
                                      Demote to member
                                    </MenuItem>
                                  )}
                                  <MenuItem icon={<FiUserPlus />} onClick={() => setConfirmTransfer(m)}>
                                    Make owner
                                  </MenuItem>
                                  <MenuItem icon={<FiUserX />} color={rose} onClick={() => setConfirmRemoveMember(m)}>
                                    Remove from space
                                  </MenuItem>
                                </MenuList>
                              </Menu>
                            )}
                          </HStack>
                        );
                      })}
                    </Stack>
                  )}
                </TabPanel>
              </TabPanels>
            </Tabs>
          </ModalBody>
        </ModalContent>
      </Modal>

      <ConfirmModal
        isOpen={confirmDeleteSpace}
        title="Delete this space?"
        body="This permanently deletes the space, its channels, and all messages. This can't be undone."
        confirmLabel="Delete space"
        isLoading={saving}
        onConfirm={handleDeleteSpace}
        onClose={() => setConfirmDeleteSpace(false)}
      />
      <ConfirmModal
        isOpen={Boolean(confirmRemoveMember)}
        title="Remove this member?"
        body={`@${confirmRemoveMember?.user.username} will lose access to this space and its channels.`}
        confirmLabel="Remove"
        isLoading={Boolean(busyMemberId)}
        onConfirm={handleRemoveMember}
        onClose={() => setConfirmRemoveMember(null)}
      />
      <ConfirmModal
        isOpen={Boolean(confirmTransfer)}
        title="Transfer ownership?"
        body={`@${confirmTransfer?.user.username} becomes the owner of this space. You'll become a moderator instead.`}
        confirmLabel="Transfer"
        isLoading={Boolean(busyMemberId)}
        onConfirm={handleTransfer}
        onClose={() => setConfirmTransfer(null)}
      />
    </>
  );
};

export default SpaceSettingsModal;
