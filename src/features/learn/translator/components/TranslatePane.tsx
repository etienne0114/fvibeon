import { Box, Flex, IconButton, Text, Textarea, useColorModeValue, HStack, Tooltip } from '@chakra-ui/react';
import { MdVolumeUp, MdMic, MdClose, MdContentCopy } from 'react-icons/md';

interface TranslatePaneProps {
  value: string;
  onChange?: (val: string) => void;
  placeholder?: string;
  isReadOnly?: boolean;
  onClear?: () => void;
  onCopy?: () => void;
  onSpeak?: () => void;
  onMic?: () => void;
  phonetics?: string;
  count?: number;
}

const TranslatePane = ({
  value,
  onChange,
  placeholder,
  isReadOnly = false,
  onClear,
  onCopy,
  onSpeak,
  onMic,
  phonetics,
  count,
}: TranslatePaneProps) => {
  const bgColor = useColorModeValue('white', 'gray.900');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const textColor = useColorModeValue('gray.800', 'white');
  const phoneticColor = useColorModeValue('learning.500', 'learning.300');

  return (
    <Flex
      direction="column"
      flex={1}
      minH="240px"
      bg={isReadOnly ? useColorModeValue('gray.50', 'gray.800') : bgColor}
      borderRadius="xl"
      borderWidth="1px"
      borderColor={borderColor}
      boxShadow="sm"
      p={5}
      position="relative"
      transition="all 0.2s"
      _focusWithin={{ borderColor: 'learning.500', boxShadow: 'md' }}
    >
      <Box flex={1} position="relative">
        <Textarea
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder={placeholder}
          variant="unstyled"
          fontSize="xl"
          fontWeight="medium"
          color={textColor}
          resize="none"
          readOnly={isReadOnly}
          minH="140px"
          _placeholder={{ color: 'gray.400' }}
        />
        {phonetics && value && (
          <Text fontSize="sm" color={phoneticColor} mt={0} mb={2} fontStyle="italic">
            {phonetics}
          </Text>
        )}
        {!isReadOnly && onClear && value && (
          <IconButton
            aria-label="Clear text"
            icon={<MdClose />}
            size="sm"
            variant="ghost"
            position="absolute"
            top={0}
            right={0}
            onClick={onClear}
            borderRadius="full"
          />
        )}
      </Box>

      <HStack spacing={2} pt={4} justify="space-between" align="center">
        <HStack spacing={1}>
          {onMic && !isReadOnly && (
            <Tooltip label="Translate by voice">
              <IconButton
                aria-label="Voice input"
                icon={<MdMic />}
                variant="ghost"
                colorScheme="learning"
                onClick={onMic}
                borderRadius="full"
              />
            </Tooltip>
          )}
          {onSpeak && value && (
            <Tooltip label="Listen">
              <IconButton
                aria-label="Listen"
                icon={<MdVolumeUp />}
                variant="ghost"
                onClick={onSpeak}
                borderRadius="full"
              />
            </Tooltip>
          )}
        </HStack>

        <HStack spacing={4}>
          {count !== undefined && !isReadOnly && (
            <Text fontSize="xs" color="gray.400">
              {count} / 5000
            </Text>
          )}
          {onCopy && value && (
            <Tooltip label="Copy translation">
              <IconButton
                aria-label="Copy"
                icon={<MdContentCopy />}
                variant="ghost"
                onClick={onCopy}
                borderRadius="full"
              />
            </Tooltip>
          )}
        </HStack>
      </HStack>
    </Flex>
  );
};

export default TranslatePane;
