import { Box, Stack } from '@chakra-ui/react';

/* Wraps the featured tile in a TV-on-a-stand frame — the "screen everyone's watching" for
   this call: whoever's speaking, or the organizer by default when no one is. Purely a
   decorative shell; the actual video/avatar/badges are still VideoTile's existing logic. */
const TvFrame = ({ children }: { children: React.ReactNode }) => (
  <Stack align="center" spacing={0}>
    <Box
      border="10px solid #0e0b16"
      borderRadius="18px"
      overflow="hidden"
      bg="black"
      w={{ base: '260px', sm: '360px', md: '440px' }}
      boxShadow="0 0 70px 12px rgba(147,112,219,0.28)"
    >
      {children}
    </Box>
    <Box w="110px" h="10px" bg="#0e0b16" borderRadius="0 0 6px 6px" />
    <Box w="180px" h="4px" bg="#0e0b16" borderRadius="full" mt="2px" opacity={0.7} />
  </Stack>
);

export default TvFrame;
