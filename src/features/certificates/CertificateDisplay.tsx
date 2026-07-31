import { Box, HStack, Icon, Stack, Text } from '@chakra-ui/react';
import { FiAward } from 'react-icons/fi';
import { ink, inkSoft, cream, rose, roseDeep, serif } from '../../theme/brand';

export interface CertificateData {
  recipient: string;
  title: string;
  course?: string;
  issueDate: string;
  issuer: string;
  verifyCode: string;
}

// The printable/shareable certificate itself — used both inside the app
// (course completion, profile) and on the public, unauthenticated verify
// page, so its look is the single source of truth for "what a Vibeon Learn
// certificate is."
const CertificateDisplay = ({ data }: { data: CertificateData }) => (
  <Box
    id="certificate-printable"
    bg={cream}
    border="3px double"
    borderColor={roseDeep}
    borderRadius="lg"
    p={{ base: 6, md: 10 }}
    textAlign="center"
    position="relative"
  >
    <style>{`
      @media print {
        body * { visibility: hidden; }
        #certificate-printable, #certificate-printable * { visibility: visible; }
        #certificate-printable { position: absolute; top: 0; left: 0; width: 100%; border-width: 4px; }
      }
    `}</style>
    <Icon as={FiAward} boxSize={10} color={rose} mb={3} />
    <Text fontSize="xs" letterSpacing="0.2em" textTransform="uppercase" color={inkSoft} fontWeight="600">
      Certificate of Completion
    </Text>
    <Text fontFamily={serif} fontWeight="700" fontSize={{ base: 'xl', md: '2xl' }} color={ink} mt={4}>
      {data.recipient}
    </Text>
    <Text color={inkSoft} fontSize="sm" mt={1}>
      has successfully completed
    </Text>
    <Text fontFamily={serif} fontWeight="700" fontSize={{ base: 'lg', md: 'xl' }} color={roseDeep} mt={2}>
      {data.course || data.title}
    </Text>
    <HStack justify="center" spacing={8} mt={6} fontSize="xs" color={inkSoft}>
      <Stack spacing={0} align="center">
        <Text fontWeight="600" color={ink}>
          {new Date(data.issueDate).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
        </Text>
        <Text>Date issued</Text>
      </Stack>
      <Stack spacing={0} align="center">
        <Text fontWeight="600" color={ink}>
          {data.issuer}
        </Text>
        <Text>Issued by</Text>
      </Stack>
    </HStack>
    <Text mt={6} fontSize="10px" color={inkSoft} letterSpacing="0.05em">
      Verification code: <Text as="span" fontWeight="700" color={ink}>{data.verifyCode}</Text>
    </Text>
  </Box>
);

export default CertificateDisplay;
