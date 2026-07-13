import { Fragment } from 'react';
import { Text, Tooltip } from '@chakra-ui/react';
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

// Colored, underlined TEXT — no pill/badge background box. A solid-fill box
// forces `display: inline-flex` + `whiteSpace: nowrap` to keep its icon and
// label glued together, which is exactly what broke mobile: when a
// correction is a whole rewritten clause (not a single word), that
// unbreakable unit can't wrap and blows out past the bubble edge. Plain
// inline text has no such constraint — it wraps at any word boundary like
// the rest of the sentence, at any length, on any screen.
const MISTAKE_COLOR = '#FF9CB3'; // bright rose — reads clearly on the dark user bubble
const CORRECTION_COLOR = '#6EE7B7'; // clear mint green — reads clearly on the dark user bubble

const MistakeText = ({ error }: { error: GrammarError }) => (
  <Tooltip
    label={error.explanation || `Should be "${error.correction}"`}
    bg={ink}
    color="white"
    borderRadius="lg"
    px={3}
    py={2}
    fontSize="xs"
    maxW="240px"
    hasArrow
    placement="top"
    openDelay={100}
  >
    <Text
      as="span"
      color={MISTAKE_COLOR}
      textDecoration="line-through"
      textDecorationThickness="1.5px"
      fontWeight="600"
      cursor="help"
      tabIndex={0}
    >
      {error.incorrectText}
    </Text>
  </Tooltip>
);

const CorrectionText = ({ text }: { text: string }) => (
  <Text
    as="span"
    color={CORRECTION_COLOR}
    textDecoration="underline"
    textDecorationThickness="1.5px"
    textUnderlineOffset="3px"
    fontWeight="700"
  >
    {text}
  </Text>
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
    parts.push(<MistakeText key={`e-${i}`} error={err} />);
    parts.push(
      <Text as="span" key={`a-${i}`} color="whiteAlpha.600" fontWeight="500" mx="4px">
        →
      </Text>,
    );
    parts.push(<CorrectionText key={`c-${i}`} text={err.correction} />);
    cursor = err.endIndex;
  });
  if (cursor < text.length) parts.push(<Fragment key="t-last">{text.slice(cursor)}</Fragment>);

  return (
    <Text fontSize="sm" color={color} lineHeight="1.9" whiteSpace="normal" wordBreak="break-word">
      {parts}
    </Text>
  );
};

export default GrammarHighlight;
