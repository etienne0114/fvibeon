import { useEffect, useState } from 'react';
import { Alert, AlertIcon, Box, Container, Flex, HStack, Icon, Stack, Text } from '@chakra-ui/react';
import { FiArrowLeft } from 'react-icons/fi';
import client from '../../api/client';
import CertificateDisplay, { CertificateData } from './CertificateDisplay';
import { ink, inkSoft, cream, line, serif } from '../../theme/brand';

interface VerifyPageProps {
  code: string;
  onBack: () => void;
}

// Public, unauthenticated page — anyone with a verification code (e.g. an
// employer checking a resume claim) can confirm a certificate is real
// without needing a Vibeon Learn account.
const CertificateVerifyPage = ({ code, onBack }: VerifyPageProps) => {
  const [state, setState] = useState<'loading' | 'valid' | 'invalid'>('loading');
  const [certificate, setCertificate] = useState<CertificateData | null>(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    client
      .get(`/certificates/verify/${encodeURIComponent(code)}`)
      .then((res) => {
        if (res.data.valid) {
          setCertificate(res.data.certificate);
          setState('valid');
        } else {
          setMessage(res.data.message || 'Certificate not found.');
          setState('invalid');
        }
      })
      .catch(() => {
        setMessage('Could not verify this certificate right now. Please try again shortly.');
        setState('invalid');
      });
  }, [code]);

  return (
    <Box bg={cream} minH="100dvh">
      <Flex as="header" align="center" px={{ base: 4, md: 8 }} py={4} borderBottom="1px solid" borderColor={line}>
        <HStack as="button" onClick={onBack} spacing={2} color={inkSoft} _hover={{ color: ink }}>
          <Icon as={FiArrowLeft} boxSize={4} />
          <Text fontSize="sm" fontWeight="600">
            Back to Vibeon Learn
          </Text>
        </HStack>
      </Flex>

      <Container maxW="600px" py={{ base: 10, md: 16 }} px={{ base: 5, md: 8 }}>
        <Stack spacing={2} mb={8} textAlign="center">
          <Text fontFamily={serif} fontWeight="700" fontSize={{ base: 'xl', md: '2xl' }} color={ink}>
            Certificate Verification
          </Text>
          <Text fontSize="sm" color={inkSoft}>
            Confirming the authenticity of a Vibeon Learn certificate.
          </Text>
        </Stack>

        {state === 'loading' && (
          <Text textAlign="center" color={inkSoft}>
            Checking code {code}...
          </Text>
        )}

        {state === 'invalid' && (
          <Alert status="error" borderRadius="lg">
            <AlertIcon />
            {message}
          </Alert>
        )}

        {state === 'valid' && certificate && (
          <Stack spacing={4}>
            <CertificateDisplay
              data={{
                recipient: certificate.recipient,
                title: certificate.title,
                course: certificate.course,
                issueDate: certificate.issueDate,
                issuer: certificate.issuer,
                verifyCode: code,
              }}
            />
            <Text textAlign="center" fontSize="xs" color={inkSoft}>
              This certificate is valid and was issued by Vibeon Learn.
            </Text>
          </Stack>
        )}
      </Container>
    </Box>
  );
};

export default CertificateVerifyPage;
