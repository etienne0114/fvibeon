import { Fragment } from 'react';
import { Box, HStack, Icon, Text, Tooltip } from '@chakra-ui/react';
import { FiXCircle, FiCheckCircle, FiInfo } from 'react-icons/fi';
import { ink } from '../../../theme/brand';

export interface GrammarError {
  incorrectText: string;
  correction: string;
  startIndex: number;
  endIndex: number;
  errorType: string;
  explanation?: string;
}

interface GrammarHighlightProps {
  text: string;
  errors?: GrammarError[];
  /** Base text color — this renders inside both light (assistant) and dark
   * (user) bubbles, so the surrounding plain text needs to adapt. */
  color?: string;
}

// Solid, opaque pill colors — a semi-transparent tint read as a muddy smear
// on top of the dark user-message bubble. White text on a saturated fill is
// legible everywhere the highlight can appear.
const WRONG_BG = '#C24560'; // roseDeep, solid
const RIGHT_BG = '#2F9E64'; // a clear, unambiguous success green (brand sage read too muted at badge size)

// Mistake and correction render as two SEPARATE inline pills (not one fused
// unit) so the browser can wrap between them on narrow screens — a single
// non-breaking flex group around both was overflowing mobile bubbles.
const MistakePill = ({ error }: { error: GrammarError }) => (
  <Tooltip
    label={
      <HStack spacing={1.5} maxW="220px">
        <Icon as={FiInfo} boxSize={3} flexShrink={0} />
        <Text fontSize="xs">{error.explanation || `Should be "${error.correction}"`}</Text>
      </HStack>
    }
    bg={ink}
    color="white"
    borderRadius="lg"
    px={3}
    py={2}
    hasArrow
    placement="top"
    openDelay={100}
  >
    <Box
      as="span"
      display="inline-flex"
      alignItems="center"
      gap="3px"
      bg={WRONG_BG}
      color="white"
      px={2}
      py="1px"
      my="2px"
      borderRadius="md"
      cursor="help"
      whiteSpace="nowrap"
    >
      <Icon as={FiXCircle} boxSize={2.5} />
      <Text as="span" fontSize="sm" textDecoration="line-through" fontWeight="600">
        {error.incorrectText}
      </Text>
    </Box>
  </Tooltip>
);

const CorrectionPill = ({ text }: { text: string }) => (
  <Box
    as="span"
    display="inline-flex"
    alignItems="center"
    gap="3px"
    bg={RIGHT_BG}
    color="white"
    px={2}
    py="1px"
    my="2px"
    ml="4px"
    borderRadius="md"
    whiteSpace="nowrap"
  >
    <Icon as={FiCheckCircle} boxSize={2.5} />
    <Text as="span" fontSize="sm" fontWeight="700">
      {text}
    </Text>
  </Box>
);

const GrammarHighlight = ({ text, errors, color }: GrammarHighlightProps) => {
  if (!errors || errors.length === 0) {
    return (
      <Text fontSize="sm" color={color} whiteSpace="normal" wordBreak="break-word">
        {text}
      </Text>
    );
  }

  const sorted = [...errors].sort((a, b) => a.startIndex - b.startIndex);
  const parts: React.ReactNode[] = [];
  let cursor = 0;

  sorted.forEach((err, i) => {
    if (err.startIndex < cursor || err.startIndex >= text.length) return;
    if (err.startIndex > cursor) {
      parts.push(<Fragment key={`t-${i}`}>{text.slice(cursor, err.startIndex)}</Fragment>);
    }
    parts.push(<MistakePill key={`e-${i}`} error={err} />);
    parts.push(<CorrectionPill key={`c-${i}`} text={err.correction} />);
    cursor = err.endIndex;
  });
  if (cursor < text.length) parts.push(<Fragment key="t-last">{text.slice(cursor)}</Fragment>);

  return (
    <Text fontSize="sm" color={color} lineHeight="2.1" whiteSpace="normal" wordBreak="break-word">
      {parts}
    </Text>
  );
};

export default GrammarHighlight;
