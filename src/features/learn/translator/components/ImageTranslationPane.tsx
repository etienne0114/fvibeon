import {
  Box,
  Button,
  Center,
  Flex,
  Icon,
  Image,
  Stack,
  Text,
  useColorModeValue,
  VStack,
  Spinner,
  IconButton,
  HStack,
  Divider,
  Tag,
  Badge,
} from '@chakra-ui/react';
import { useState, useCallback, useRef } from 'react';
import { MdCloudUpload, MdImage, MdClose, MdTranslate, MdDescription } from 'react-icons/md';
import type { TranslatorImageTranslation } from '../../../../api/translator';

interface ImageTranslationPaneProps {
  onTranslate: (file: File) => void;
  isLoading: boolean;
  result: TranslatorImageTranslation | null;
  onClear: () => void;
}

const ImageTranslationPane = ({ onTranslate, isLoading, result, onClear }: ImageTranslationPaneProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const innerBg = useColorModeValue('white', '#0b0f1b');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const hoverBg = useColorModeValue('gray.50', 'gray.800');

  const handleFileChange = useCallback((file: File) => {
    if (!file || !file.type.startsWith('image/')) return;
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    onTranslate(file);
  }, [onTranslate]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFileChange(file);
  }, [handleFileChange]);

  const handleClear = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    onClear();
  };

  if (result || isLoading) {
    return (
      <Box w="full" bg={innerBg} borderRadius="xl" overflow="hidden" borderWidth={1} borderColor={borderColor}>
        <Flex direction={{ base: 'column', lg: 'row' }} minH="400px">
          {/* Left Side: Image Preview */}
          <Box flex={1} borderRightWidth={{ base: 0, lg: 1 }} borderColor={borderColor} p={4} position="relative">
            <HStack justify="space-between" mb={3}>
              <Text fontSize="sm" fontWeight="bold" color="gray.500">ORIGINAL IMAGE</Text>
              {!isLoading && (
                <IconButton
                  aria-label="Clear"
                  icon={<MdClose />}
                  size="sm"
                  variant="ghost"
                  onClick={handleClear}
                />
              )}
            </HStack>
            <Center h="300px" bg="gray.900" borderRadius="lg" overflow="hidden">
              {isLoading ? (
                <VStack spacing={4}>
                  <Spinner size="xl" color="learning.500" thickness="4px" />
                  <Text color="white" fontWeight="medium">Extracting text...</Text>
                </VStack>
              ) : (
                <Image 
                  src={result?.annotatedImage ? `data:image/jpeg;base64,${result.annotatedImage}` : previewUrl || ''} 
                  alt="Source" 
                  maxH="100%" 
                  objectFit="contain"
                />
              )}
            </Center>
            {result && (
              <HStack mt={3} spacing={2}>
                <Badge colorScheme="green">OCR: {Math.round(result.ocrConfidence * 100)}%</Badge>
                <Badge colorScheme="blue">Trans: {Math.round(result.translationConfidence * 100)}%</Badge>
              </HStack>
            )}
          </Box>

          {/* Right Side: Translation Result */}
          <Box flex={1} p={6} bg={useColorModeValue('gray.50', 'gray.900')}>
             <VStack align="stretch" spacing={6}>
                <Box>
                   <HStack mb={2} color="learning.500">
                      <Icon as={MdDescription} />
                      <Text fontWeight="bold" fontSize="sm" textTransform="uppercase">Extracted Text</Text>
                   </HStack>
                   <Box p={3} bg={innerBg} borderRadius="md" borderWidth={1} borderColor={borderColor}>
                      <Text fontSize="md" minH="50px">
                        {isLoading ? 'Processing...' : result?.originalText || 'No text detected'}
                      </Text>
                   </Box>
                </Box>

                <Divider />

                <Box>
                   <HStack mb={2} color="purple.500">
                      <Icon as={MdTranslate} />
                      <Text fontWeight="bold" fontSize="sm" textTransform="uppercase">Translation</Text>
                   </HStack>
                   <Box p={4} bg="purple.50" _dark={{ bg: 'purple.900', borderColor: 'purple.700' }} borderRadius="md" borderWidth={1} borderColor="purple.200">
                      <Text fontSize="lg" fontWeight="medium" color="purple.900" _dark={{ color: 'purple.50' }}>
                        {isLoading ? 'Translating...' : result?.translatedText || 'Translation pending'}
                      </Text>
                   </Box>
                </Box>
             </VStack>
          </Box>
        </Flex>
      </Box>
    );
  }

  return (
    <Box
      w="full"
      h="400px"
      borderRadius="xl"
      borderWidth={2}
      borderStyle="dashed"
      borderColor={borderColor}
      bg={innerBg}
      onDragOver={(e) => e.preventDefault()}
      onDrop={onDrop}
      transition="all 0.2s"
      _hover={{ borderColor: 'learning.500', bg: hoverBg }}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
        accept="image/*"
        style={{ display: 'none' }}
      />
      
      <Center h="full" cursor="pointer" onClick={() => fileInputRef.current?.click()}>
        <VStack spacing={4}>
          <Icon as={MdCloudUpload} w={12} h={12} color="gray.400" />
          <VStack spacing={1}>
            <Text fontSize="xl" fontWeight="bold">Click or drag image to translate</Text>
            <Text color="gray.500">Supports JPG, PNG, WEBP (Max 10MB)</Text>
          </VStack>
          <Button colorScheme="learning" leftIcon={<MdImage />} size="lg" mt={4}>
            Upload Image
          </Button>
        </VStack>
      </Center>
    </Box>
  );
};

export default ImageTranslationPane;
