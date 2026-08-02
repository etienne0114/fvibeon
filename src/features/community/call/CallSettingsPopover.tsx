import { useEffect, useState } from 'react';
import {
  Button,
  FormControl,
  FormLabel,
  HStack,
  IconButton,
  Icon,
  Input,
  Popover,
  PopoverArrow,
  PopoverBody,
  PopoverCloseButton,
  PopoverContent,
  PopoverHeader,
  PopoverTrigger,
  Radio,
  RadioGroup,
  Select,
  Stack,
  Switch,
  Text,
} from '@chakra-ui/react';
import { FiSettings } from 'react-icons/fi';
import { SpeakingMode } from '../../../api/calls';
import { ink, inkSoft, line, rose, roseDeep, serif } from '../../../theme/brand';

const SPEAKER_TIME_OPTIONS = [30, 60, 90, 120, 180];

/* The gear icon — live, mid-call settings, host-only. This is what makes a call here
   configurable on the fly rather than fixed at start, the way Meet/Zoom's own host
   controls work, but scoped to what this app actually needs (turns, topic, the door). */
const CallSettingsPopover = ({
  speakingMode,
  speakerTimeSec,
  topic,
  requireApproval,
  autoMuteOnJoin,
  onSave,
}: {
  speakingMode: SpeakingMode;
  speakerTimeSec: number | null;
  topic: string | null;
  requireApproval: boolean;
  autoMuteOnJoin: boolean;
  onSave: (patch: {
    speakingMode: SpeakingMode;
    speakerTimeSec?: number;
    topic: string;
    requireApproval: boolean;
    autoMuteOnJoin: boolean;
  }) => void;
}) => {
  const [mode, setMode] = useState(speakingMode);
  const [seconds, setSeconds] = useState(speakerTimeSec || 60);
  const [topicDraft, setTopicDraft] = useState(topic || '');
  const [approval, setApproval] = useState(requireApproval);
  const [autoMute, setAutoMute] = useState(autoMuteOnJoin);

  useEffect(() => {
    setMode(speakingMode);
    setSeconds(speakerTimeSec || 60);
    setTopicDraft(topic || '');
    setApproval(requireApproval);
    setAutoMute(autoMuteOnJoin);
  }, [speakingMode, speakerTimeSec, topic, requireApproval, autoMuteOnJoin]);

  const save = (onClose: () => void) => {
    onSave({ speakingMode: mode, speakerTimeSec: seconds, topic: topicDraft, requireApproval: approval, autoMuteOnJoin: autoMute });
    onClose();
  };

  return (
    <Popover placement="bottom-end" isLazy>
      {({ onClose }) => (
        <>
          <PopoverTrigger>
            <IconButton aria-label="Call settings" icon={<Icon as={FiSettings} />} size="sm" variant="ghost" color={inkSoft} />
          </PopoverTrigger>
          <PopoverContent w="300px" borderRadius="lg">
            <PopoverArrow />
            <PopoverCloseButton />
            <PopoverHeader fontFamily={serif} fontWeight="600">
              Call settings
            </PopoverHeader>
            <PopoverBody>
              <Stack spacing={3}>
                <FormControl>
                  <FormLabel fontSize="xs" color={inkSoft} mb={1}>
                    Topic
                  </FormLabel>
                  <Input size="sm" value={topicDraft} onChange={(e) => setTopicDraft(e.target.value)} borderColor={line} placeholder="e.g. Debate: remote work" />
                </FormControl>

                <FormControl>
                  <FormLabel fontSize="xs" color={inkSoft} mb={1}>
                    Speaking mode
                  </FormLabel>
                  <RadioGroup value={mode} onChange={(v) => setMode(v as SpeakingMode)}>
                    <Stack spacing={1.5}>
                      <Radio size="sm" value="OPEN">
                        <Text fontSize="sm">Open floor</Text>
                      </Radio>
                      <Radio size="sm" value="STRUCTURED">
                        <Text fontSize="sm">Structured turns</Text>
                      </Radio>
                    </Stack>
                  </RadioGroup>
                  {mode === 'STRUCTURED' && (
                    <HStack mt={2} spacing={2}>
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
                </FormControl>

                <FormControl display="flex" alignItems="center" justifyContent="space-between">
                  <FormLabel fontSize="sm" color={ink} mb={0}>
                    Require approval to join
                  </FormLabel>
                  <Switch isChecked={approval} onChange={(e) => setApproval(e.target.checked)} colorScheme="blackAlpha" />
                </FormControl>

                <FormControl display="flex" alignItems="center" justifyContent="space-between">
                  <FormLabel fontSize="sm" color={ink} mb={0}>
                    Mute everyone on join
                  </FormLabel>
                  <Switch isChecked={autoMute} onChange={(e) => setAutoMute(e.target.checked)} colorScheme="blackAlpha" />
                </FormControl>

                <Button size="sm" bg={rose} color="white" _hover={{ bg: roseDeep }} onClick={() => save(onClose)}>
                  Save
                </Button>
              </Stack>
            </PopoverBody>
          </PopoverContent>
        </>
      )}
    </Popover>
  );
};

export default CallSettingsPopover;
