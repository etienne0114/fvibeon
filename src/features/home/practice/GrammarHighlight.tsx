import { Fragment } from 'react';
import { HStack, Icon, Text, Tooltip } from '@chakra-ui/react';
import { FiXCircle, FiCheckCircle, FiInfo } from 'react-icons/fi';
import { ink, roseDeep, sageDeep } from '../../../theme/brand';

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

// A mistake/correction pair rendered as two small pills right where the
// mistake occurred — the correction is visible immediately (no hover
// needed), and hovering (or tapping, on touch) the mistake pill reveals the
// full explanation via tooltip.
const MistakePair = ({ error }: { error: GrammarError }) => (
  <HStack as="span" spacing={1} display="inline-flex" verticalAlign="middle" mx={0.5}>
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
      <HStack
        as="span"
        spacing={1}
        bg="rgba(217,83,111,0.14)"
        color={roseDeep}
        px={2}
        py={0.5}
        borderRadius="md"
        cursor="help"
        display="inline-flex"
      >
        <Icon as={FiXCircle} boxSize={2.5} />
        <Text as="span" fontSize="sm" textDecoration="line-through" fontWeight="600">
          {error.incorrectText}
        </Text>
      </HStack>
    </Tooltip>
    <HStack as="span" spacing={1} bg="rgba(127,169,155,0.18)" color={sageDeep} px={2} py={0.5} borderRadius="md" display="inline-flex">
      <Icon as={FiCheckCircle} boxSize={2.5} />
      <Text as="span" fontSize="sm" fontWeight="700">
        {error.correction}
      </Text>
    </HStack>
  </HStack>
);

const GrammarHighlight = ({ text, errors, color }: GrammarHighlightProps) => {
  if (!errors || errors.length === 0) {
    return (
      <Text fontSize="sm" color={color}>
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
    parts.push(<MistakePair key={`e-${i}`} error={err} />);
    cursor = err.endIndex;
  });
  if (cursor < text.length) parts.push(<Fragment key="t-last">{text.slice(cursor)}</Fragment>);

  return (
    <Text fontSize="sm" color={color} lineHeight="1.9">
      {parts}
    </Text>
  );
};

export default GrammarHighlight;
