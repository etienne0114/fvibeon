import React from 'react';
import {
  Text,
  Box,
  Tooltip,
  useColorModeValue,
  chakra,
  VStack,
  HStack,
  Badge,
  Icon,
} from '@chakra-ui/react';
import { MdErrorOutline, MdCheckCircle } from 'react-icons/md';

interface GrammarError {
  incorrectText: string;
  correction: string;
  startIndex: number;
  endIndex: number;
  explanation?: string;
}

interface GrammarCorrectionProps {
  text: string;
  errors: GrammarError[];
}

/**
 * GrammarCorrection Component
 * Renders text with professional highlights for grammar mistakes.
 * Hovering or clicking a mistake provides detailed feedback.
 */
const GrammarCorrection: React.FC<GrammarCorrectionProps> = ({ text, errors }) => {
  const errorColor = useColorModeValue('red.600', 'red.400');
  const errorBg = useColorModeValue('red.50', 'red.900');
  const errorBorder = useColorModeValue('red.300', 'red.700');

  if (!errors || errors.length === 0) return <Text as="span">{text}</Text>;

  // Sort errors by start index
  const sortedErrors = [...errors].sort((a, b) => a.startIndex - b.startIndex);

  const parts: React.ReactNode[] = [];
  let lastIndex = 0;

  sortedErrors.forEach((error, idx) => {
    // Basic overlap handling
    if (error.startIndex < lastIndex) return;

    // Add text before the error
    if (error.startIndex > lastIndex) {
      parts.push(
        <Text as="span" key={`text-${idx}`}>
          {text.substring(lastIndex, error.startIndex)}
        </Text>
      );
    }

    // Add highlighted error with professional tooltip
    const actualText = text.substring(error.startIndex, error.endIndex);
    
    parts.push(
      <Tooltip
        key={`err-${idx}`}
        hasArrow
        label={
          <VStack align="left" p={2} spacing={1}>
            <HStack spacing={1}>
              <Icon as={MdErrorOutline} color="red.300" />
              <Text fontWeight="bold" fontSize="xs" color="white">MISTAKE</Text>
            </HStack>
            <Text fontSize="xs" textDecoration="line-through" color="gray.300">{error.incorrectText}</Text>
            <HStack spacing={1}>
              <Icon as={MdCheckCircle} color="green.300" />
              <Text fontWeight="bold" fontSize="xs" color="green.200">{error.correction}</Text>
            </HStack>
            {error.explanation && (
              <Text fontSize="2xs" color="gray.200" fontStyle="italic" mt={1}>
                {error.explanation}
              </Text>
            )}
          </VStack>
        }
        bg="gray.800"
        borderRadius="xl"
        boxShadow="2xl"
        p={0}
      >
        <chakra.span
          cursor="help"
          bg={errorBg}
          px={1}
          mx={0.5}
          borderRadius="md"
          borderBottom="2px solid"
          borderBottomColor={errorBorder}
          color={errorColor}
          fontWeight="semibold"
          transition="all 0.2s"
          _hover={{ bg: 'red.100', color: 'red.700' }}
        >
          {actualText}
        </chakra.span>
      </Tooltip>
    );

    lastIndex = error.endIndex;
  });

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(
      <Text as="span" key="text-last">
        {text.substring(lastIndex)}
      </Text>
    );
  }

  return <Text as="span" lineHeight="tall">{parts}</Text>;
};

export default GrammarCorrection;
