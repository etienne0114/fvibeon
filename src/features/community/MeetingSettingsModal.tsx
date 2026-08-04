import { useState } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  HStack,
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
  Switch,
  Text,
} from '@chakra-ui/react';
import { FiClock, FiMessageCircle } from 'react-icons/fi';
import { SpeakingMode, StartCallSettings } from '../../api/calls';
import { DebatePhase } from '../../api/spaces';
import { ink, inkSoft, rose, roseDeep, sageDeep, sageTint, card, line, serif } from '../../theme/brand';

const SPEAKER_TIME_OPTIONS = [30, 60, 90, 120, 180];

/* Shown once, when someone starts a fresh call — the settings only apply to a
   brand-new session, so anyone joining an in-progress call skips this. This is
   the feature that makes calls here different from a plain Meet/Zoom window:
   structured speaking turns and a real front door, purpose-built for practice
   and debate sessions rather than a copy of a generic video-call window. */
const MeetingSettingsModal = ({
  isOpen,
  channelName,
  debatePhases,
  onClose,
  onStart,
}: {
  isOpen: boolean;
  channelName: string;
  /** When the channel has formal phases set, the call starts straight into phase 1 —
   * no point offering an open-floor/structured choice that would just be overridden. */
  debatePhases?: DebatePhase[] | null;
  onClose: () => void;
  onStart: (settings: StartCallSettings) => void;
}) => {
  const [mode, setMode] = useState<SpeakingMode>('OPEN');
  const [seconds, setSeconds] = useState(60);
  const [topic, setTopic] = useState('');
  const [requireApproval, setRequireApproval] = useState(false);
  const [autoMuteOnJoin, setAutoMuteOnJoin] = useState(false);

  const start = () =>
    onStart({
      speakingMode: mode,
      ...(mode === 'STRUCTURED' ? { speakerTimeSec: seconds } : {}),
      ...(topic.trim() ? { topic: topic.trim() } : {}),
      requireApproval,
      autoMuteOnJoin,
    });

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered size="sm">
      <ModalOverlay />
      <ModalContent borderRadius="xl">
        <ModalHeader fontFamily={serif}>Start a call in #{channelName}</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Stack spacing={4}>
            <FormControl>
              <FormLabel fontSize="sm" color={inkSoft} mb={1}>
                Topic <Text as="span" color={inkSoft} fontWeight="400">(optional)</Text>
              </FormLabel>
              <Input size="sm" value={topic} onChange={(e) => setTopic(e.target.value)} borderColor={line} placeholder="e.g. Debate: remote work" />
            </FormControl>

            {debatePhases && debatePhases.length > 0 ? (
              <Box bg={sageTint} borderRadius="lg" p={3}>
                <Text fontSize="sm" fontWeight="600" color={sageDeep} mb={1.5}>
                  This debate has formal phases
                </Text>
                <Stack spacing={1}>
                  {debatePhases.map((p, i) => (
                    <HStack key={i} spacing={2}>
                      <Text fontSize="xs" fontWeight="700" color={sageDeep} w="16px">
                        {i + 1}.
                      </Text>
                      <Text fontSize="xs" color={ink}>
                        {p.name}
                      </Text>
                      <Text fontSize="xs" color={inkSoft}>
                        · {p.perSideSeconds}s/speaker
                      </Text>
                    </HStack>
                  ))}
                </Stack>
                <Text fontSize="xs" color={inkSoft} mt={2}>
                  Starting begins phase 1. You'll be able to advance through the rest as host.
                </Text>
              </Box>
            ) : (
              <>
                <Text fontSize="sm" color={inkSoft}>
                  Choose how the conversation flows. This applies for everyone in the call.
                </Text>
                <RadioGroup value={mode} onChange={(v) => setMode(v as SpeakingMode)}>
                  <Stack spacing={3}>
                    <Box borderWidth="1px" borderColor={mode === 'OPEN' ? rose : line} bg={mode === 'OPEN' ? 'rgba(214,110,120,0.06)' : card} borderRadius="lg" p={3}>
                      <Radio value="OPEN">
                        <HStack spacing={2}>
                          <Icon as={FiMessageCircle} color={inkSoft} />
                          <Text fontSize="sm" fontWeight="600" color={ink}>
                            Open floor
                          </Text>
                        </HStack>
                        <Text fontSize="xs" color={inkSoft} mt={0.5} ml={6}>
                          Everyone can speak freely, like a normal call.
                        </Text>
                      </Radio>
                    </Box>
                    <Box borderWidth="1px" borderColor={mode === 'STRUCTURED' ? rose : line} bg={mode === 'STRUCTURED' ? 'rgba(214,110,120,0.06)' : card} borderRadius="lg" p={3}>
                      <Radio value="STRUCTURED">
                        <HStack spacing={2}>
                          <Icon as={FiClock} color={inkSoft} />
                          <Text fontSize="sm" fontWeight="600" color={ink}>
                            Structured turns
                          </Text>
                        </HStack>
                        <Text fontSize="xs" color={inkSoft} mt={0.5} ml={6}>
                          Raise a hand to join the queue — one speaker at a time, on a timer. Built for practice and debate.
                        </Text>
                      </Radio>
                      {mode === 'STRUCTURED' && (
                        <HStack mt={3} ml={6} spacing={2}>
                          <Text fontSize="xs" color={inkSoft}>
                            Time per speaker:
                          </Text>
                          <Select size="xs" w="90px" value={seconds} onChange={(e) => setSeconds(Number(e.target.value))} borderColor={line}>
                            {SPEAKER_TIME_OPTIONS.map((s) => (
                              <option key={s} value={s}>
                                {s}s
                              </option>
                            ))}
                          </Select>
                        </HStack>
                      )}
                    </Box>
                  </Stack>
                </RadioGroup>
              </>
            )}

            <FormControl display="flex" alignItems="center" justifyContent="space-between">
              <FormLabel fontSize="sm" color={ink} mb={0}>
                Require approval to join
              </FormLabel>
              <Switch isChecked={requireApproval} onChange={(e) => setRequireApproval(e.target.checked)} colorScheme="blackAlpha" />
            </FormControl>

            <FormControl display="flex" alignItems="center" justifyContent="space-between">
              <FormLabel fontSize="sm" color={ink} mb={0}>
                Mute everyone on join
              </FormLabel>
              <Switch isChecked={autoMuteOnJoin} onChange={(e) => setAutoMuteOnJoin(e.target.checked)} colorScheme="blackAlpha" />
            </FormControl>
          </Stack>
        </ModalBody>
        <ModalFooter>
          <Button size="sm" variant="ghost" mr={2} onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" bg={rose} color="white" _hover={{ bg: roseDeep }} onClick={start}>
            Start call
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default MeetingSettingsModal;
