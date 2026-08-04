import { useCallback, useEffect, useState } from 'react';
import { Box, Button, Collapse, HStack, Icon, Progress, Stack, Text, useDisclosure } from '@chakra-ui/react';
import { FiChevronDown, FiChevronUp, FiShield } from 'react-icons/fi';
import { castDebateVote, fetchDebateVoteTally, ChannelSummary, DebateVoteTally } from '../../api/spaces';
import { ink, inkSoft, roseDeep, roseTint, sageDeep, sageTint, line, serif } from '../../theme/brand';

const SIDES: { key: 'FOR' | 'AGAINST' | 'NEUTRAL'; label: string; color: string; tint: string }[] = [
  { key: 'FOR', label: 'For', color: sageDeep, tint: sageTint },
  { key: 'AGAINST', label: 'Against', color: roseDeep, tint: roseTint },
  { key: 'NEUTRAL', label: 'Undecided', color: inkSoft, tint: '#F0EBE3' },
];

/* The motion, ground rules, and an Oxford-style live audience vote — the structure that
   makes a debate channel more than just a themed chat room. Shown to everyone, whether
   or not they're an approved participant (voting is open to the whole audience). */
const DebateHeader = ({ channel }: { channel: ChannelSummary }) => {
  const [tally, setTally] = useState<DebateVoteTally | null>(null);
  const { isOpen: policiesOpen, onToggle: togglePolicies } = useDisclosure();

  const loadTally = useCallback(async () => {
    const result = await fetchDebateVoteTally(channel.id).catch(() => null);
    if (result) setTally(result);
  }, [channel.id]);

  useEffect(() => {
    loadTally();
  }, [loadTally]);

  const vote = async (side: 'FOR' | 'AGAINST' | 'NEUTRAL') => {
    const result = await castDebateVote(channel.id, side).catch(() => null);
    if (result) setTally(result);
  };

  if (!channel.debateQuestion && !channel.debatePolicies) return null;

  return (
    <Stack spacing={2} bg="white" border="1px solid" borderColor={line} borderRadius="xl" p={4}>
      {channel.debateQuestion && (
        <Text fontFamily={serif} fontWeight="600" fontSize="md" color={ink}>
          {channel.debateQuestion}
        </Text>
      )}

      {channel.debatePolicies && (
        <Box>
          <HStack as="button" spacing={1.5} onClick={togglePolicies}>
            <Icon as={FiShield} color={inkSoft} boxSize={3.5} />
            <Text fontSize="xs" fontWeight="700" color={inkSoft}>
              Ground rules
            </Text>
            <Icon as={policiesOpen ? FiChevronUp : FiChevronDown} color={inkSoft} boxSize={3.5} />
          </HStack>
          <Collapse in={policiesOpen}>
            <Text fontSize="sm" color={inkSoft} whiteSpace="pre-wrap" mt={1.5}>
              {channel.debatePolicies}
            </Text>
          </Collapse>
        </Box>
      )}

      {channel.debateQuestion && tally && (
        <Stack spacing={1.5} pt={1}>
          <HStack justify="space-between">
            <Text fontSize="10px" fontWeight="700" color={inkSoft} textTransform="uppercase" letterSpacing="0.05em">
              Audience vote {tally.total > 0 && `· ${tally.total} ${tally.total === 1 ? 'vote' : 'votes'}`}
            </Text>
          </HStack>
          {SIDES.map((s) => {
            const count = tally.counts[s.key];
            const pct = tally.total > 0 ? Math.round((count / tally.total) * 100) : 0;
            return (
              <Box key={s.key}>
                <HStack justify="space-between" mb={0.5}>
                  <Button
                    size="xs"
                    variant={tally.myVote === s.key ? 'solid' : 'outline'}
                    borderColor={s.color}
                    bg={tally.myVote === s.key ? s.color : 'transparent'}
                    color={tally.myVote === s.key ? 'white' : s.color}
                    borderRadius="full"
                    onClick={() => vote(s.key)}
                  >
                    {s.label}
                  </Button>
                  <Text fontSize="xs" color={inkSoft}>
                    {pct}%
                  </Text>
                </HStack>
                <Progress value={pct} size="xs" borderRadius="full" sx={{ '& > div': { background: s.color } }} bg={s.tint} />
              </Box>
            );
          })}
        </Stack>
      )}
    </Stack>
  );
};

export default DebateHeader;
