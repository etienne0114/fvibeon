export interface WordDiffToken {
  word: string;
  matched: boolean;
}

const normalize = (w: string) => w.toLowerCase().replace(/[^\p{L}\p{N}']/gu, '');

/**
 * Longest-common-subsequence diff at the WORD level: tokenizes the
 * reference text and what the user said/typed, then walks the DP table to
 * find which reference words were actually reproduced, in order, and which
 * were missed. Same technique as a character-level diff, just at word
 * granularity so it scales to whole sentences/paragraphs instead of a
 * single word.
 */
export function diffWords(reference: string, attempt: string): WordDiffToken[] {
  const refTokens = reference.split(/\s+/).filter(Boolean);
  const attTokens = attempt.split(/\s+/).filter(Boolean).map(normalize);
  const refNorm = refTokens.map(normalize);

  const m = refNorm.length;
  const n = attTokens.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 1; i <= m; i += 1) {
    for (let j = 1; j <= n; j += 1) {
      dp[i][j] = refNorm[i - 1] === attTokens[j - 1] ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1]);
    }
  }

  const result: WordDiffToken[] = [];
  let i = m;
  let j = n;
  while (i > 0 && j > 0) {
    if (refNorm[i - 1] === attTokens[j - 1]) {
      result.unshift({ word: refTokens[i - 1], matched: true });
      i -= 1;
      j -= 1;
    } else if (dp[i - 1][j] >= dp[i][j - 1]) {
      result.unshift({ word: refTokens[i - 1], matched: false });
      i -= 1;
    } else {
      j -= 1;
    }
  }
  while (i > 0) {
    result.unshift({ word: refTokens[i - 1], matched: false });
    i -= 1;
  }
  return result;
}

export function computeAccuracy(tokens: WordDiffToken[]): number {
  if (!tokens.length) return 0;
  const matched = tokens.filter((t) => t.matched).length;
  return Math.round((matched / tokens.length) * 100);
}
