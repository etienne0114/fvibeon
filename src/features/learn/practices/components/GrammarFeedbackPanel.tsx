import React from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Badge,
  Icon,
  Divider,
  useColorModeValue,
} from '@chakra-ui/react';
import { MdErrorOutline, MdCheckCircle, MdInfoOutline } from 'react-icons/md';

interface GrammarError {
  incorrectText: string;
  correction: string;
  startIndex: number;
  endIndex: number;
  explanation?: string;
}

interface GrammarFeedbackPanelProps {
  errors: GrammarError[];
  pronunciationScore?: number | null;
}

/**
 * GrammarFeedbackPanel Component
 * Displays a professional summary of identified grammar mistakes.
 */
const GrammarFeedbackPanel: React.FC<GrammarFeedbackPanelProps> = ({ errors, pronunciationScore }) => {
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('learning.100', 'gray.700');
  const headerBg = useColorModeValue('learning.500', 'learning.600');

  if ((!errors || errors.length === 0) && (pronunciationScore === undefined || pronunciationScore === null)) {
    return null;
  }

  return (
    <Box
      borderWidth="1px"
      borderColor={borderColor}
      borderRadius="2xl"
      overflow="hidden"
      bg={bgColor}
      boxShadow="lg"
      transition="all 0.3s"
      _hover={{ boxShadow: 'xl' }}
    >
      <Box bg={headerBg} px={4} py={2}>
        <HStack justify="space-between">
          <Text color="white" fontWeight="bold" fontSize="xs" letterSpacing="wider">
            MISTAKE IDENTIFIED
          </Text>
          {pronunciationScore !== undefined && pronunciationScore !== null && (
            <Badge colorScheme={pronunciationScore > 80 ? 'green' : 'orange'} variant="solid" borderRadius="full" px={2}>
               PRONUNCIATION: {pronunciationScore}%
            </Badge>
          )}
        </HStack>
      </Box>

      <VStack align="stretch" p={4} spacing={4} divider={<Divider />}>
        {errors.map((error, idx) => (
          <VStack key={idx} align="left" spacing={2}>
            <HStack align="start" spacing={3}>
              <Icon as={MdErrorOutline} color="red.500" mt={1} />
              <VStack align="left" spacing={0}>
                <Text fontSize="xs" color="gray.500" textDecoration="line-through">
                  {error.incorrectText}
                </Text>
                <HStack spacing={2}>
                   <Icon as={MdCheckCircle} color="green.500" />
                   <Text fontSize="sm" fontWeight="bold" color="green.600">
                     {error.correction}
                   </Text>
                </HStack>
              </VStack>
            </HStack>
            
            {error.explanation && (
              <HStack align="start" spacing={2} bg="gray.50" p={2} borderRadius="md" borderLeftWidth={3} borderLeftColor="blue.300">
                <Icon as={MdInfoOutline} color="blue.400" mt={0.5} size="12px" />
                <Text fontSize="2xs" color="gray.600" fontStyle="italic">
                  {error.explanation}
                </Text>
              </HStack>
            )}
          </VStack>
        ))}

        {errors.length === 0 && pronunciationScore !== null && (
          <Text fontSize="xs" color="gray.500" textAlign="center">
            Grammar looks great! Keep up the good work.
          </Text>
        )}
      </VStack>
    </Box>
  );
};

export default GrammarFeedbackPanel;
