// Pure text helpers for the Web Speech wrapper (unit tested, no browser API here).

const key = (s: string) => s.toLowerCase().replace(/[^a-z0-9' ]+/g, ' ').replace(/\s+/g, ' ').trim();

/**
 * Joins recognition results into one transcript. Chrome on Android, in continuous mode,
 * sends each new result with the previous words repeated ("I will", "I will deploy"):
 * a part that starts with what we already have replaces it instead of being appended.
 */
export function mergeTranscripts(parts: string[]): string {
  let acc: string[] = [];
  for (const raw of parts) {
    const p = raw.trim();
    const kp = key(p);
    if (!kp) continue;
    const joined = key(acc.join(' '));
    const last = key(acc[acc.length - 1] ?? '');
    if (joined && kp.startsWith(joined)) acc = [p];
    else if (last && kp.startsWith(last)) acc[acc.length - 1] = p;
    else if (joined && (joined.endsWith(kp) || last.startsWith(kp))) continue;
    else acc.push(p);
  }
  return acc.join(' ').replace(/\s+/g, ' ').trim();
}

/**
 * Splits text into short utterances: Chrome desktop stops a single utterance after about
 * 15 seconds, so long answers are read sentence by sentence (long sentences at commas).
 */
export function splitForSpeech(text: string, max = 180): string[] {
  if (text.trim().length <= max) return [text.trim()];
  // No lookbehind: older iOS Safari cannot parse it.
  const sentences = text.replace(/([.!?]["'’)\]]*)\s+/g, '$1\n').split('\n');
  const out: string[] = [];
  for (const s of sentences.map((x) => x.trim()).filter(Boolean)) {
    if (s.length <= max) { out.push(s); continue; }
    let cur = '';
    for (const piece of s.replace(/([,;:])\s+/g, '$1\n').split('\n')) {
      if (cur && cur.length + piece.length + 1 > max) { out.push(cur); cur = piece; }
      else cur = cur ? `${cur} ${piece}` : piece;
    }
    if (cur) out.push(cur);
  }
  return out.length ? out : [text];
}
