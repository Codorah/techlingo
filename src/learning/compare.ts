// Compares what the speech recognizer heard with the target sentence, word by word.
// It measures "recognized by the machine", never pronunciation quality (spec §5.5).

const CONTRACTIONS: Record<string, string> = {
  "it's": 'it is', "that's": 'that is', "there's": 'there is', "what's": 'what is', "let's": 'let us',
  "i'm": 'i am', "you're": 'you are', "we're": 'we are', "they're": 'they are', "he's": 'he is', "she's": 'she is',
  "i've": 'i have', "we've": 'we have', "you've": 'you have', "they've": 'they have',
  "i'll": 'i will', "we'll": 'we will', "you'll": 'you will', "it'll": 'it will', "they'll": 'they will',
  "i'd": 'i would', "we'd": 'we would', "don't": 'do not', "doesn't": 'does not', "didn't": 'did not',
  "can't": 'cannot', "won't": 'will not', "isn't": 'is not', "aren't": 'are not', "wasn't": 'was not',
  "weren't": 'were not', "shouldn't": 'should not', "couldn't": 'could not', "wouldn't": 'would not', "haven't": 'have not', "hasn't": 'has not'
};

export function normalizeWords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[’`]/g, "'")
    .split(/\s+/)
    .flatMap((w) => (CONTRACTIONS[w.replace(/[^a-z']/g, '')] ?? w).split(' '))
    .map((w) => w.replace(/[^a-z0-9+#]/g, ''))
    .filter(Boolean)
    .map((w) => (w === 'cannot' ? 'can not' : w))
    .flatMap((w) => w.split(' '));
}

/**
 * Words for loose matching of free answers (key phrases, spoken recall): contractions
 * expanded ("we'll" = "we will"), accents dropped, hyphens and slashes split like spaces.
 */
export function matchWords(text: string): string[] {
  return normalizeWords(text.normalize('NFD').replace(/\p{M}/gu, '').replace(/[\p{Pd}/_.,;:!?()[\]"«»…]/gu, ' '));
}

function editDistance(a: string, b: string): number {
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array<number>(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) dp[0]![j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i]![j] = Math.min(dp[i - 1]![j]! + 1, dp[i]![j - 1]! + 1, dp[i - 1]![j - 1]! + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
  }
  return dp[a.length]![b.length]!;
}

/** Long words tolerate one recognition slip ("deploy" / "deploys"). */
const close = (a: string, b: string) => a === b || (a.length >= 5 && b.length >= 5 && editDistance(a, b) <= 1);

export interface WordResult { word: string; recognized: boolean }
export interface CompareResult { words: WordResult[]; recognizedRatio: number; score: number }

/** Longest-common-subsequence alignment of target words against the transcript. */
export function compareSentence(target: string, transcript: string): CompareResult {
  const display = target.split(/\s+/).filter(Boolean);
  const t = normalizeWords(target);
  const h = normalizeWords(transcript);
  const lcs = Array.from({ length: t.length + 1 }, () => Array<number>(h.length + 1).fill(0));
  for (let i = t.length - 1; i >= 0; i--) {
    for (let j = h.length - 1; j >= 0; j--) {
      lcs[i]![j] = close(t[i]!, h[j]!) ? lcs[i + 1]![j + 1]! + 1 : Math.max(lcs[i + 1]![j]!, lcs[i]![j + 1]!);
    }
  }
  const hit = new Array<boolean>(t.length).fill(false);
  for (let i = 0, j = 0; i < t.length && j < h.length;) {
    if (close(t[i]!, h[j]!)) { hit[i] = true; i++; j++; }
    else if (lcs[i + 1]![j]! >= lcs[i]![j + 1]!) i++;
    else j++;
  }
  const ratio = t.length ? hit.filter(Boolean).length / t.length : 0;
  // Map normalized hits back onto the displayed words (contractions expand to several words).
  let k = 0;
  const words = display.map((word) => {
    const parts = normalizeWords(word).length || 1;
    const ok = hit.slice(k, k + parts).every(Boolean);
    k += parts;
    return { word, recognized: ok };
  });
  return { words, recognizedRatio: ratio, score: Math.round(ratio * 10) };
}
