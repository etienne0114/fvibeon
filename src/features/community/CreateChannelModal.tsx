import { useState } from 'react';
import {
  Button,
  FormControl,
  FormLabel,
  HStack,
  IconButton,
  Icon,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Radio,
  RadioGroup,
  Select,
  Stack,
  Text,
  Textarea,
  useToast,
} from '@chakra-ui/react';
import { FiHash, FiMessageSquare, FiPlus, FiTrash2 } from 'react-icons/fi';
import { createChannel, DebatePhase } from '../../api/spaces';
import { ink, inkSoft, rose, roseDeep, card, line, serif } from '../../theme/brand';

const PHASE_TIME_OPTIONS = [30, 45, 60, 90, 120, 180];
const MAX_PHASES = 6;

/* Creating a channel — a plain text channel, or a debate with the structure that makes it
   different from a generic chat room: an optional motion, ground rules the creator sets,
   and optional formal phases (each with its own per-side speaking time). */
const CreateChannelModal = ({
  isOpen,
  spaceId,
  onClose,
  onCreated,
}: {
  isOpen: boolean;
  spaceId: string;
  onClose: () => void;
  onCreated: () => void;
}) => {
  const [name, setName] = useState('');
  const [type, setType] = useState<'TEXT' | 'DEBATE'>('TEXT');
  const [question, setQuestion] = useState('');
  const [policies, setPolicies] = useState('');
  const [phases, setPhases] = useState<DebatePhase[]>([]);
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  const reset = () => {
    setName('');
    setType('TEXT');
    setQuestion('');
    setPolicies('');
    setPhases([]);
  };

  const close = () => {
    reset();
    onClose();
  };

  const addPhase = () => {
    if (phases.length >= MAX_PHASES) return;
    setPhases((prev) => [...prev, { name: '', perSideSeconds: 60 }]);
  };

  const updatePhase = (index: number, patch: Partial<DebatePhase>) => {
    setPhases((prev) => prev.map((p, i) => (i === index ? { ...p, ...patch } : p)));
  };

  const removePhase = (index: number) => {
    setPhases((prev) => prev.filter((_, i) => i !== index));
  };

  const create = async () => {
    if (!name.trim()) return;
    try {
      setSaving(true);
      const cleanPhases = phases.filter((p) => p.name.trim());
      await createChannel(
        spaceId,
        name,
        '',
        type,
        type === 'DEBATE'
          ? { debateQuestion: question.trim() || undefined, debatePolicies: policies.trim() || undefined, debatePhases: cleanPhases.length ? cleanPhases : undefined }
          : undefined,
      );
      close();
      onCreated();
    } catch (err: any) {
      toast({ title: err?.response?.data?.error || 'Could not create channel', status: 'error', duration: 3000, position: 'top' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={close} isCentered size="md">
      <ModalOverlay />
      <ModalContent borderRadius="xl">
        <ModalHeader fontFamily={serif}>New channel</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Stack spacing={4}>
            <FormControl>
              <FormLabel fontSize="sm" color={inkSoft}>
                Name
              </FormLabel>
              <Input size="sm" placeholder="channel-name" value={name} onChange={(e) => setName(e.target.value)} borderColor={line} />
            </FormControl>

            <RadioGroup value={type} onChange={(v) => setType(v as 'TEXT' | 'DEBATE')}>
              <HStack spacing={4}>
                <Radio size="sm" value="TEXT">
                  <HStack spacing={1.5}>
                    <Icon as={FiHash} color={inkSoft} boxSize={3.5} />
                    <Text fontSize="sm">Text</Text>
                  </HStack>
                </Radio>
                <Radio size="sm" value="DEBATE">
                  <HStack spacing={1.5}>
                    <Icon as={FiMessageSquare} color={inkSoft} boxSize={3.5} />
                    <Text fontSize="sm">Debate</Text>
                  </HStack>
                </Radio>
              </HStack>
            </RadioGroup>

            {type === 'DEBATE' && (
              <Stack spacing={4} bg={card} borderRadius="lg" p={3}>
                <FormControl>
                  <FormLabel fontSize="sm" color={inkSoft}>
                    Motion / question <Text as="span" fontWeight="400">(optional — leave blank for an open-format debate)</Text>
                  </FormLabel>
                  <Input size="sm" placeholder="e.g. Should AI tutors replace human teachers?" value={question} onChange={(e) => setQuestion(e.target.value)} borderColor={line} bg="white" />
                </FormControl>

                <FormControl>
                  <FormLabel fontSize="sm" color={inkSoft}>
                    Ground rules <Text as="span" fontWeight="400">(optional — shown to everyone before they join)</Text>
                  </FormLabel>
                  <Textarea
                    size="sm"
                    placeholder="e.g. Be respectful. No personal attacks. Stick to the motion."
                    value={policies}
                    onChange={(e) => setPolicies(e.target.value)}
                    borderColor={line}
                    bg="white"
                    rows={2}
                  />
                </FormControl>

                <FormControl>
                  <FormLabel fontSize="sm" color={inkSoft} mb={1}>
                    Formal phases <Text as="span" fontWeight="400">(optional — e.g. opening statements → rebuttal → closing)</Text>
                  </FormLabel>
                  <Stack spacing={2}>
                    {phases.map((phase, i) => (
                      <HStack key={i} spacing={2}>
                        <Input
                          size="sm"
                          placeholder={`Phase ${i + 1} name`}
                          value={phase.name}
                          onChange={(e) => updatePhase(i, { name: e.target.value })}
                          borderColor={line}
                          bg="white"
                        />
                        <Select
                          size="sm"
                          w="90px"
                          flexShrink={0}
                          value={phase.perSideSeconds}
                          onChange={(e) => updatePhase(i, { perSideSeconds: Number(e.target.value) })}
                          borderColor={line}
                          bg="white"
                        >
                          {PHASE_TIME_OPTIONS.map((s) => (
                            <option key={s} value={s}>
                              {s}s
                            </option>
                          ))}
                        </Select>
                        <IconButton aria-label="Remove phase" icon={<Icon as={FiTrash2} />} size="sm" variant="ghost" color={rose} onClick={() => removePhase(i)} />
                      </HStack>
                    ))}
                    {phases.length < MAX_PHASES && (
                      <Button size="xs" variant="ghost" leftIcon={<Icon as={FiPlus} />} alignSelf="flex-start" onClick={addPhase}>
                        Add phase
                      </Button>
                    )}
                  </Stack>
                </FormControl>
              </Stack>
            )}
          </Stack>
        </ModalBody>
        <ModalFooter>
          <Button size="sm" variant="ghost" mr={2} onClick={close}>
            Cancel
          </Button>
          <Button size="sm" bg={ink} color="white" _hover={{ bg: roseDeep }} isDisabled={!name.trim()} isLoading={saving} onClick={create}>
            Create channel
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default CreateChannelModal;
