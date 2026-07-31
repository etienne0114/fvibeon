import { useEffect, useState } from 'react';
import {
  Alert,
  AlertIcon,
  Button,
  HStack,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalOverlay,
  Skeleton,
  useToast,
} from '@chakra-ui/react';
import { FiCopy, FiPrinter } from 'react-icons/fi';
import CertificateDisplay from './CertificateDisplay';
import { fetchCourseCertificate, type Certificate } from '../../api/learn';
import { ink, inkSoft, line } from '../../theme/brand';

const CertificateModal = ({
  isOpen,
  onClose,
  courseId,
  certificate: certificateProp,
  recipient,
}: {
  isOpen: boolean;
  onClose: () => void;
  courseId?: string;
  certificate?: Certificate;
  recipient: string;
}) => {
  const [certificate, setCertificate] = useState<Certificate | null>(certificateProp ?? null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const toast = useToast();

  useEffect(() => {
    if (!isOpen) return;
    if (certificateProp) {
      setCertificate(certificateProp);
      return;
    }
    if (!courseId) return;
    setLoading(true);
    setError('');
    fetchCourseCertificate(courseId)
      .then(setCertificate)
      .catch((err) => setError(err?.response?.data?.error || 'Could not load your certificate.'))
      .finally(() => setLoading(false));
  }, [isOpen, courseId, certificateProp]);

  const copyVerifyLink = () => {
    if (!certificate) return;
    const link = `${window.location.origin}/#verify-certificate?code=${encodeURIComponent(certificate.verifyCode)}`;
    navigator.clipboard.writeText(link);
    toast({ title: 'Verification link copied', status: 'success', duration: 2000, position: 'top' });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" isCentered>
      <ModalOverlay />
      <ModalContent borderRadius="xl">
        <ModalCloseButton />
        <ModalBody pt={10} pb={4}>
          {loading && <Skeleton h="320px" borderRadius="lg" />}
          {!loading && error && (
            <Alert status="error" borderRadius="lg">
              <AlertIcon />
              {error}
            </Alert>
          )}
          {!loading && certificate && (
            <CertificateDisplay
              data={{
                recipient,
                title: certificate.title,
                course: certificate.metadata?.courseTitle,
                issueDate: certificate.issueDate,
                issuer: certificate.issuerName,
                verifyCode: certificate.verifyCode,
              }}
            />
          )}
        </ModalBody>
        {!loading && certificate && (
          <ModalFooter borderTop="1px solid" borderColor={line}>
            <HStack spacing={3} w="full" justify="center">
              <Button
                size="sm"
                variant="outline"
                borderColor={line}
                color={inkSoft}
                leftIcon={<FiCopy />}
                onClick={copyVerifyLink}
              >
                Copy verification link
              </Button>
              <Button size="sm" bg={ink} color="white" leftIcon={<FiPrinter />} _hover={{ bg: '#463039' }} onClick={() => window.print()}>
                Print / Save as PDF
              </Button>
            </HStack>
          </ModalFooter>
        )}
      </ModalContent>
    </Modal>
  );
};

export default CertificateModal;
