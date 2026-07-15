import { Text } from '@chakra-ui/react';
import { WordDiffToken } from '../../../utils/textDiff';
import { roseDeep, sageDeep } from '../../../theme/brand';

// Plain colored text, not background pills — matches the fix applied to
// GrammarHighlight after boxed pills overflowed on mobile: color scales to
// any length of text and wraps normally at any word boundary.
const WordDiffDisplay = ({ tokens, fontSize = 'md' }: { tokens: WordDiffToken[]; fontSize?: string }) => (
  <Text fontSize={fontSize} lineHeight="1.9" whiteSpace="normal" wordBreak="break-word">
    {tokens.map((t, i) => (
      <Text
        as="span"
        key={i}
        color={t.matched ? sageDeep : roseDeep}
        fontWeight={t.matched ? '400' : '700'}
        textDecoration={t.matched ? 'none' : 'underline'}
      >
        {t.word}
        {i < tokens.length - 1 ? ' ' : ''}
      </Text>
    ))}
  </Text>
);

export default WordDiffDisplay;
