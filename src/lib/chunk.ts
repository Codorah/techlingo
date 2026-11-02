/** Splits a French paragraph into short cards: whole sentences, grouped up to `max` characters. */
export function chunkSentences(text: string, max = 220): string[] {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (!clean) return [];
  const sentences = clean.split(/(?<=[.!?…])\s+(?=[A-ZÀ-ÖØ-Þ«“"(0-9])/u);
  const out: string[] = [];
  let current = '';
  for (const s of sentences) {
    if (!current) current = s;
    else if (current.length + 1 + s.length <= max) current += ` ${s}`;
    else { out.push(current); current = s; }
  }
  if (current) out.push(current);
  return out;
}
