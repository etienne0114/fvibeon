import { Box, Container, Flex, HStack, Icon, Stack, Text } from '@chakra-ui/react';
import { FiArrowLeft } from 'react-icons/fi';
import { ink, inkSoft, cream, line, serif } from '../../theme/brand';
import PrivacySections from './PrivacySections';

interface PrivacyPolicyPageProps {
  onBack: () => void;
}

const PrivacyPolicyPage = ({ onBack }: PrivacyPolicyPageProps) => (
  <Box bg={cream} minH="100dvh">
    <Flex
      as="header"
      align="center"
      px={{ base: 4, md: 8 }}
      py={4}
      borderBottom="1px solid"
      borderColor={line}
      position="sticky"
      top={0}
      bg="rgba(251,243,233,0.92)"
      backdropFilter="blur(12px)"
      zIndex={10}
    >
      <HStack as="button" onClick={onBack} spacing={2} color={inkSoft} _hover={{ color: ink }}>
        <Icon as={FiArrowLeft} boxSize={4} />
        <Text fontSize="sm" fontWeight="600">
          Back
        </Text>
      </HStack>
    </Flex>

    <Container maxW="720px" py={{ base: 10, md: 16 }} px={{ base: 5, md: 8 }}>
      <Stack spacing={8}>
        <Stack spacing={2}>
          <Text fontFamily={serif} fontWeight="700" fontSize={{ base: '2xl', md: '3xl' }} color={ink}>
            Privacy Policy
          </Text>
          <Text fontSize="sm" color={inkSoft}>
            Last updated: July 2026
          </Text>
        </Stack>
        <PrivacySections />
      </Stack>
    </Container>
  </Box>
);

export default PrivacyPolicyPage;
