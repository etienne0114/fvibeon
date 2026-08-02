import { Button, Modal, ModalBody, ModalCloseButton, ModalContent, ModalFooter, ModalHeader, ModalOverlay, Text } from '@chakra-ui/react';
import { inkSoft, rose, roseDeep, serif } from '../../theme/brand';

export const blobToBase64 = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1] || '');
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });

export const MAX_UPLOAD_BYTES = 350 * 1024;

/* Confirm dialog for destructive actions, shared across Spaces/Channels/Messages. */
export const ConfirmModal = ({
  isOpen,
  title,
  body,
  confirmLabel = 'Confirm',
  isLoading,
  onConfirm,
  onClose,
}: {
  isOpen: boolean;
  title: string;
  body: string;
  confirmLabel?: string;
  isLoading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) => (
  <Modal isOpen={isOpen} onClose={onClose} isCentered size="sm">
    <ModalOverlay />
    <ModalContent borderRadius="xl">
      <ModalHeader fontFamily={serif}>{title}</ModalHeader>
      <ModalCloseButton />
      <ModalBody>
        <Text fontSize="sm" color={inkSoft}>
          {body}
        </Text>
      </ModalBody>
      <ModalFooter>
        <Button size="sm" variant="ghost" mr={2} onClick={onClose}>
          Cancel
        </Button>
        <Button size="sm" bg={rose} color="white" _hover={{ bg: roseDeep }} isLoading={isLoading} onClick={onConfirm}>
          {confirmLabel}
        </Button>
      </ModalFooter>
    </ModalContent>
  </Modal>
);
