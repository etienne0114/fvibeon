import {
  Box,
  Button,
  Center,
  Divider,
  Flex,
  HStack,
  Icon,
  IconButton,
  Spinner,
  Stack,
  Tag,
  Text,
  useColorModeValue,
  VStack,
  Badge,
  Progress,
} from '@chakra-ui/react';
import { useState, useCallback, useRef } from 'react';
import {
  MdCloudUpload,
  MdDescription,
  MdClose,
  MdTranslate,
  MdArticle,
  MdContentCopy,
} from 'react-icons/md';
import type { TranslatorDocumentTranslation } from '../../../../api/translator';

interface DocumentTranslationPaneProps {
  onTranslate: (file: File) => void;
  isLoading: boolean;
  result: TranslatorDocumentTranslation | null;
  onClear: () => void;
}

const ACCEPTED_TYPES = [
  '.pdf', '.docx', '.doc', '.txt', '.rtf', '.odt',
];
const ACCEPTED_MIME = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'text/plain',
  'application/rtf',
  'application/vnd.oasis.opendocument.text',
];

const DocumentTranslationPane = ({ onTranslate, isLoading, result, onClear }: DocumentTranslationPaneProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const innerBg = useColorModeValue('white', '#0b0f1b');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const hoverBg = useColorModeValue('gray.50', 'gray.800');
  const dragBg = useColorModeValue('learning.50', 'gray.700');

  const handleFileChange = useCallback((file: File) => {
    if (!file) return;
    if (!ACCEPTED_MIME.includes(file.type) && !ACCEPTED_TYPES.some(ext => file.name.endsWith(ext))) return;
    setSelectedFile(file);
    onTranslate(file);
  }, [onTranslate]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileChange(file);
  }, [handleFileChange]);

  const handleClear = () => {
    setSelectedFile(null);
    onClear();
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (result || isLoading) {
    return (
      <Box w="full" bg={innerBg} borderRadius="xl" overflow="hidden" borderWidth={1} borderColor={borderColor}>
        <Flex direction={{ base: 'column', lg: 'row' }} minH="420px">
          {/* Left: Document info + original text */}
          <Box flex={1} borderRightWidth={{ base: 0, lg: 1 }} borderColor={borderColor} p={5}>
            <HStack justify="space-between" mb={4}>
              <HStack spacing={2}>
                <Icon as={MdArticle} color="learning.500" w={5} h={5} />
                <Text fontSize="sm" fontWeight="bold" color="gray.500" textTransform="uppercase">
                  Original Document
                </Text>
              </HStack>
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

            {selectedFile && (
              <Box mb={4} p={3} bg={useColorModeValue('gray.50', 'gray.800')} borderRadius="lg" borderWidth={1} borderColor={borderColor}>
                <HStack spacing={3}>
                  <Icon as={MdDescription} w={8} h={8} color="learning.400" />
                  <VStack align="start" spacing={0}>
                    <Text fontWeight="medium" fontSize="sm" noOfLines={1}>{selectedFile.name}</Text>
                    <Text fontSize="xs" color="gray.500">{formatFileSize(selectedFile.size)}</Text>
                  </VStack>
                </HStack>
              </Box>
            )}

            {isLoading ? (
              <VStack spacing={4} py={8}>
                <Spinner size="xl" color="learning.500" thickness="4px" />
                <Text fontWeight="medium" color="gray.500">Extracting and translating document...</Text>
                <Progress size="xs" isIndeterminate colorScheme="learning" w="80%" borderRadius="full" />
              </VStack>
            ) : (
              <Box>
                <HStack mb={2} spacing={2}>
                  <Badge colorScheme="blue">
                    {result?.pages ?? 1} {(result?.pages ?? 1) === 1 ? 'page' : 'pages'}
                  </Badge>
                  {result?.confidence !== undefined && (
                    <Badge colorScheme="green">
                      Confidence: {Math.round((result.confidence) * 100)}%
                    </Badge>
                  )}
                  {result?.model && (
                    <Badge colorScheme="purple" variant="outline">{result.model}</Badge>
                  )}
                </HStack>
                <Box
                  p={3}
                  bg={useColorModeValue('gray.50', 'gray.800')}
                  borderRadius="md"
                  borderWidth={1}
                  borderColor={borderColor}
                  maxH="280px"
                  overflowY="auto"
                  fontSize="sm"
                  whiteSpace="pre-wrap"
                >
                  {result?.originalText || 'No text extracted'}
                </Box>
              </Box>
            )}
          </Box>

          {/* Right: Translation result */}
          <Box flex={1} p={5} bg={useColorModeValue('gray.50', 'gray.900')}>
            <HStack justify="space-between" mb={4}>
              <HStack spacing={2} color="purple.500">
                <Icon as={MdTranslate} w={5} h={5} />
                <Text fontSize="sm" fontWeight="bold" textTransform="uppercase">
                  Translation
                </Text>
              </HStack>
              {result?.translatedText && (
                <IconButton
                  aria-label="Copy translation"
                  icon={<MdContentCopy />}
                  size="sm"
                  variant="ghost"
                  onClick={() => handleCopy(result.translatedText)}
                />
              )}
            </HStack>

            <Box
              p={4}
              bg={isLoading ? undefined : 'purple.50'}
              _dark={{ bg: 'purple.900', borderColor: 'purple.700' }}
              borderRadius="md"
              borderWidth={1}
              borderColor={isLoading ? borderColor : 'purple.200'}
              minH="280px"
              maxH="340px"
              overflowY="auto"
              fontSize="md"
              whiteSpace="pre-wrap"
            >
              {isLoading ? (
                <Text color="gray.400" fontStyle="italic">Translating...</Text>
              ) : (
                <Text color={useColorModeValue('purple.900', 'purple.50')} fontWeight="medium">
                  {result?.translatedText || 'Translation pending'}
                </Text>
              )}
            </Box>

            {result && (
              <HStack mt={3} spacing={2} flexWrap="wrap">
                <Tag size="sm" colorScheme="gray">{result.detectedLanguage?.toUpperCase() || 'AUTO'} → {result.targetLanguage?.toUpperCase()}</Tag>
                {result.processingTime && (
                  <Tag size="sm" colorScheme="gray" variant="outline">
                    {result.processingTime.toFixed(2)}s
                  </Tag>
                )}
              </HStack>
            )}
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
      borderColor={dragOver ? 'learning.500' : borderColor}
      bg={dragOver ? dragBg : innerBg}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={onDrop}
      transition="all 0.2s"
      _hover={{ borderColor: 'learning.500', bg: hoverBg }}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
        accept={ACCEPTED_TYPES.join(',')}
        style={{ display: 'none' }}
      />

      <Center h="full" cursor="pointer" onClick={() => fileInputRef.current?.click()}>
        <VStack spacing={4}>
          <Icon as={MdCloudUpload} w={12} h={12} color="gray.400" />
          <VStack spacing={1}>
            <Text fontSize="xl" fontWeight="bold">Click or drag document to translate</Text>
            <Text color="gray.500">Supports PDF, DOCX, TXT, RTF, ODT (Max 10MB)</Text>
          </VStack>
          <Stack direction={{ base: 'column', md: 'row' }} spacing={2} flexWrap="wrap" justify="center">
            {ACCEPTED_TYPES.map((ext) => (
              <Tag key={ext} size="sm" colorScheme="gray" variant="subtle">{ext.toUpperCase()}</Tag>
            ))}
          </Stack>
          <Button colorScheme="learning" leftIcon={<MdDescription />} size="lg" mt={2}>
            Upload Document
          </Button>
        </VStack>
      </Center>
    </Box>
  );
};

export default DocumentTranslationPane;
