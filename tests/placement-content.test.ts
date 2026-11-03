import { readFileSync, readdirSync } from 'node:fs';
import { expect, it } from 'vitest';
import { baseTerm, buildPlacementQuestion } from '@/learning/placement';
it('never leaks the English term in a placement question built from the real dictionary', () => {
  const terms: any[] = [];
  for (const f of readdirSync('content/roles')) { const d = JSON.parse(readFileSync(`content/roles/${f}`, 'utf8')); terms.push(...(Array.isArray(d) ? d : d.terms)); }
  let leak = 0, nulls = 0, n = 0;
  for (let i = 0; i < 200; i++) {
    const q = buildPlacementQuestion(terms, (['A1', 'A2', 'B1', 'B2', 'C1'] as const)[i % 5]!, new Set(), i);
    if (!q) { nulls++; continue; } n++;
    const t = baseTerm(q.term.term_en).toLowerCase();
    if (q.kind === 'meaning' && t.length > 3 && q.choices.some((c) => c.toLowerCase().includes(t))) leak++;
  }
  expect({ nulls, leak, n }).toEqual({ nulls: 0, leak: 0, n: 200 });
}, 60000);
