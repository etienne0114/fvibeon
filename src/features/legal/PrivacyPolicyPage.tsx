import { Box, Container, Flex, HStack, Icon, Link, Stack, Text } from '@chakra-ui/react';
import { FiArrowLeft } from 'react-icons/fi';
import { ink, inkSoft, cream, line, serif, rose } from '../../theme/brand';
import PrivacySections, { PRIVACY_SECTIONS } from './PrivacySections';

interface PrivacyPolicyPageProps {
  onBack: () => void;
}

const scrollToSection = (id: string) => {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

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

    <Container maxW="1100px" py={{ base: 10, md: 16 }} px={{ base: 5, md: 8 }}>
      <Stack spacing={2} mb={{ base: 8, lg: 12 }}>
        <Text fontFamily={serif} fontWeight="700" fontSize={{ base: '2xl', md: '3xl' }} color={ink}>
          Privacy Policy
        </Text>
        <Text fontSize="sm" color={inkSoft}>
          Last updated: July 2026
        </Text>
      </Stack>

      <Flex gap={{ base: 0, lg: 14 }} align="flex-start" direction={{ base: 'column', lg: 'row' }}>
        {/* On a wide screen, a sticky table of contents sits beside the full
            text — every section already expanded, not hidden behind an
            accordion click, with the TOC just for quick navigation. */}
        <Box as="nav" aria-label="Privacy policy sections" display={{ base: 'none', lg: 'block' }} w="260px" flexShrink={0} position="sticky" top="90px">
          <Text fontSize="xs" fontWeight="700" color={inkSoft} textTransform="uppercase" letterSpacing="0.08em" mb={3}>
            On this page
          </Text>
          <Stack spacing={0} borderLeft="2px solid" borderColor={line}>
            {PRIVACY_SECTIONS.map((s) => (
              <Link
                key={s.id}
                href={`#${s.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  scrollToSection(s.id);
                }}
                fontSize="sm"
                color={inkSoft}
                pl={4}
                py={1.5}
                borderLeft="2px solid transparent"
                ml="-2px"
                _hover={{ color: ink, borderColor: rose, textDecoration: 'none' }}
                transition="all 0.15s ease"
              >
                {s.title}
              </Link>
            ))}
          </Stack>
        </Box>

        <Box flex={1} minW={0}>
          <PrivacySections />
        </Box>
      </Flex>
    </Container>
  </Box>
);

export default PrivacyPolicyPage;
