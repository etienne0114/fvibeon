import { HStack, IconButton, Popover, PopoverBody, PopoverContent, PopoverTrigger, SimpleGrid, Text } from '@chakra-ui/react';
import { MessageReactionSummary } from '../../api/spaces';
import { inkSoft, rose, roseTint, line } from '../../theme/brand';

const QUICK_EMOJI = ['👍', '❤️', '😂', '👏', '🎉', '🤔'];

/* Persistent, counted reaction pills under a chat message — distinct from the calls
   feature's floating-burst reactions (those are ephemeral; these are a running tally,
   the way WhatsApp/Slack/Instagram all do it). */
const MessageReactionBar = ({ reactions, onToggle }: { reactions: MessageReactionSummary[]; onToggle: (emoji: string) => void }) => (
  <HStack spacing={1} mt={1} flexWrap="wrap">
    {reactions.map((r) => (
      <HStack
        key={r.emoji}
        as="button"
        spacing={1}
        px={1.5}
        py={0.5}
        borderRadius="full"
        border="1px solid"
        borderColor={r.reactedByMe ? rose : line}
        bg={r.reactedByMe ? roseTint : 'white'}
        onClick={() => onToggle(r.emoji)}
      >
        <Text fontSize="xs">{r.emoji}</Text>
        <Text fontSize="10px" fontWeight="700" color={r.reactedByMe ? rose : inkSoft}>
          {r.count}
        </Text>
      </HStack>
    ))}
    <Popover placement="top" isLazy>
      {({ onClose }) => (
        <>
          <PopoverTrigger>
            <IconButton aria-label="Add a reaction" icon={<Text fontSize="xs">🙂+</Text>} size="xs" variant="ghost" borderRadius="full" opacity={0.6} _hover={{ opacity: 1 }} />
          </PopoverTrigger>
          <PopoverContent w="auto" borderRadius="full" p={1}>
            <PopoverBody p={1}>
              <SimpleGrid columns={QUICK_EMOJI.length} spacing={1}>
                {QUICK_EMOJI.map((emoji) => (
                  <IconButton
                    key={emoji}
                    aria-label={`React with ${emoji}`}
                    icon={<Text fontSize="md">{emoji}</Text>}
                    variant="ghost"
                    size="xs"
                    borderRadius="full"
                    onClick={() => {
                      onToggle(emoji);
                      onClose();
                    }}
                  />
                ))}
              </SimpleGrid>
            </PopoverBody>
          </PopoverContent>
        </>
      )}
    </Popover>
  </HStack>
);

export default MessageReactionBar;
