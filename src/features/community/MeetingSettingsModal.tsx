import { useState } from 'react';
import {
  Box,
  Button,
  HStack,
  Icon,
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
} from '@chakra-ui/react';
import { FiClock, FiMessageCircle } from 'react-icons/fi';
import { SpeakingMode } from '../../api/calls';
import { ink, inkSoft, rose, roseDeep, card, line, serif } from '../../theme/brand';

const SPEAKER_TIME_OPTIONS = [30, 60, 90, 120, 180];

/* Shown once, when someone starts a fresh call — the settings only apply to a
   brand-new session, so anyone joining an in-progress call skips this. This is
   the feature that makes calls here different from a plain Meet/Zoom window:
   structured speaking turns, purpose-built for practice/debate sessions. */
const MeetingSettingsModal = ({
  isOpen,
  channelName,
  onClose,
  onStart,
}: {
  isOpen: boolean;
  channelName: string;
  onClose: () => void;
  onStart: (settings: { speakingMode: SpeakingMode; speakerTimeSec?: number }) => void;
}) => {
  const [mode, setMode] = useState<SpeakingMode>('OPEN');
  const [seconds, setSeconds] = useState(60);

  const start = () => onStart(mode === 'STRUCTURED' ? { speakingMode: mode, speakerTimeSec: seconds } : { speakingMode: mode });

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered size="sm">
      <ModalOverlay />
      <ModalContent borderRadius="xl">
        <ModalHeader fontFamily={serif}>Start a call in #{channelName}</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Stack spacing={4}>
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
