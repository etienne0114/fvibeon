import { Box, IconButton, Popover, PopoverBody, PopoverContent, PopoverTrigger, SimpleGrid, Text } from '@chakra-ui/react';
import { CallReaction } from '../../../hooks/useWebRTCCall';
import { ink, line } from '../../../theme/brand';

const QUICK_EMOJI = ['👍', '❤️', '😂', '👏', '🎉', '✋'];

/* The picker button — quick, unobtrusive, no popover backdrop stealing focus from the call. */
export const ReactionPicker = ({ onSend }: { onSend: (emoji: string) => void }) => (
  <Popover placement="top" isLazy>
    {({ onClose }) => (
      <>
        <PopoverTrigger>
          <IconButton
            aria-label="Send a reaction"
            icon={<Text fontSize="lg">😊</Text>}
            borderRadius="full"
            size="lg"
            bg="white"
            border="1px solid"
            borderColor={line}
          />
        </PopoverTrigger>
        <PopoverContent w="auto" borderRadius="full" p={1}>
          <PopoverBody p={1}>
            <SimpleGrid columns={QUICK_EMOJI.length} spacing={1}>
              {QUICK_EMOJI.map((emoji) => (
                <IconButton
                  key={emoji}
                  aria-label={`React with ${emoji}`}
                  icon={<Text fontSize="xl">{emoji}</Text>}
                  variant="ghost"
                  size="sm"
                  borderRadius="full"
                  onClick={() => {
                    onSend(emoji);
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
);

/* Floating emoji + name that drifts up and fades out — layered over the video grid.
   Each reaction is a fire-and-forget DOM element; the hook already expires it from
   state after a few seconds, so this component just needs to render whatever's live. */
export const ReactionOverlay = ({ reactions }: { reactions: CallReaction[] }) => (
  <Box position="absolute" inset={0} pointerEvents="none" overflow="hidden">
    {reactions.map((r, i) => (
      <Box
        key={r.id}
        position="absolute"
        bottom="8%"
        left={`${12 + ((i * 17) % 70)}%`}
        textAlign="center"
        sx={{
          animation: 'callReactionFloat 3s ease-out forwards',
          '@keyframes callReactionFloat': {
            '0%': { transform: 'translateY(0) scale(0.6)', opacity: 0 },
            '15%': { transform: 'translateY(-10px) scale(1.1)', opacity: 1 },
            '80%': { transform: 'translateY(-90px) scale(1)', opacity: 1 },
            '100%': { transform: 'translateY(-120px) scale(0.9)', opacity: 0 },
          },
        }}
      >
        <Text fontSize="3xl" lineHeight={1}>
          {r.emoji}
        </Text>
        <Text fontSize="9px" color={ink} bg="white" borderRadius="full" px={1.5} py={0.5} mt={1} display="inline-block" boxShadow="sm">
          {r.username}
        </Text>
      </Box>
    ))}
  </Box>
);
