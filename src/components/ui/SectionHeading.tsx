import { Box, Heading, Stack, Text } from '@chakra-ui/react';

interface SectionHeadingProps {
  title: string;
  subtitle?: string;
}

const SectionHeading = ({ title, subtitle }: SectionHeadingProps) => (
  <Stack spacing={1} mb={6}>
    <Heading size="lg" color="gray.800" fontWeight="800" letterSpacing="tight">
      {title}
    </Heading>
    {subtitle && (
      <Text fontSize="sm" color="gray.500" fontWeight="medium">
        {subtitle}
      </Text>
    )}
    <Box w="40px" h="3px" bg="learning.500" borderRadius="full" mt={1} />
  </Stack>
);

export default SectionHeading;
