import { Fragment } from 'react';
import { Box, Stack, Text } from '@chakra-ui/react';

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
  /** Base text color — the highlight/correction colors adapt around it, since
   * this renders inside both light (assistant) and dark (user) bubbles. */
  color?: string;
}

const MISTAKE_COLOR = '#FBBF6B'; // amber — reads clearly on both cream and dark-ink bubbles

// Inline strikethrough highlight on the mistake, matched by character index
// against the exact text that was sent — plus a compact correction line
// below (no hover/tooltip reliance, so it works on touch devices too).
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
    parts.push(
      <Box as="span" key={`e-${i}`} color={MISTAKE_COLOR} textDecoration="line-through" fontWeight="700">
        {text.slice(err.startIndex, err.endIndex)}
      </Box>,
    );
    cursor = err.endIndex;
  });
  if (cursor < text.length) parts.push(<Fragment key="t-last">{text.slice(cursor)}</Fragment>);

  const correctionColor = color === 'white' ? '#BEE3D2' : '#4E7A6A';

  return (
    <Stack spacing={1.5}>
      <Text fontSize="sm" color={color}>
        {parts}
      </Text>
      <Stack spacing={0.5}>
        {sorted.map((err, i) => (
          <Text key={i} fontSize="xs" color={correctionColor}>
            → <Box as="span" fontWeight="700">{err.correction}</Box>
            {err.explanation ? ` · ${err.explanation}` : ''}
          </Text>
        ))}
      </Stack>
    </Stack>
  );
};

export default GrammarHighlight;
