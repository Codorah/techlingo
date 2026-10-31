// Daily Spin selection (spec §5.3). Pure: every input is passed in, randomness included,
// so it is fully testable and runs offline.
import { LEVELS, type Level } from '@/content/levels';
import type { Term } from '@/content/schema';
import type { FsrsCard, UserTerm } from '@/db/db';

export interface SpinInput {
  terms: Term[];
  progress: Map<string, Pick<UserTerm, 'state' | 'card'>>;
  primaryRole: string;
  secondaryRoles: string[];
  level: Level;
  category?: string;
  recentSpins: { termId: string; day: string }[];
  today: string; // YYYY-MM-DD
  now?: Date;
  random?: () => number;
}

const RECENT_MASTERED_DAYS = 30;
const DAY = 86_400_000;

export function nextLevel(level: Level): Level {
  return LEVELS[Math.min(LEVELS.indexOf(level) + 1, LEVELS.length - 1)]!;
}

function previousDay(day: string): string {
  const d = new Date(`${day}T12:00:00Z`);
  return new Date(d.getTime() - DAY).toISOString().slice(0, 10);
}

/** Candidate terms with their weight; weight 0 means excluded. */
export function spinCandidates(input: SpinInput): { term: Term; weight: number }[] {
  const now = input.now ?? new Date();
  const maxLevel = LEVELS.indexOf(nextLevel(input.level));
  const yesterday = previousDay(input.today);
  const blocked = new Set(input.recentSpins.filter((s) => s.day === input.today || s.day === yesterday).map((s) => s.termId));
  const roles = new Map<string, number>([[input.primaryRole, 1], ...input.secondaryRoles.map((r) => [r, 0.6] as [string, number])]);

  return input.terms.map((term) => {
    if (term.status === 'deprecated' || term.deprecated) return { term, weight: 0 };
    if (LEVELS.indexOf(term.level) > maxLevel) return { term, weight: 0 };
    if (input.category && !term.categories.includes(input.category)) return { term, weight: 0 };
    if (blocked.has(term.id)) return { term, weight: 0 }; // never the same word two days in a row
    const roleWeight = Math.max(0, ...term.roles.map((r) => (roles.get(r.role) ?? 0) * (r.priority + 10)));
    if (roleWeight === 0) return { term, weight: 0 };

    const p = input.progress.get(term.id);
    if (!p || p.state === 'new' || !p.card) return { term, weight: roleWeight * 3 }; // new words first
    if (p.state === 'mastered') {
      const last = p.card.lastReview ? new Date(p.card.lastReview).getTime() : 0;
      if (now.getTime() - last < RECENT_MASTERED_DAYS * DAY) return { term, weight: 0 };
      return { term, weight: roleWeight * 0.3 };
    }
    const due = new Date((p.card as FsrsCard).due) <= now;
    return { term, weight: roleWeight * (due ? 2 : 0.2) }; // then learning words that are due
  });
}

export function pickSpinTerm(input: SpinInput): Term | null {
  const random = input.random ?? Math.random;
  const pool = spinCandidates(input).filter((c) => c.weight > 0);
  const total = pool.reduce((s, c) => s + c.weight, 0);
  if (!total) return null;
  let r = random() * total;
  for (const c of pool) { r -= c.weight; if (r <= 0) return c.term; }
  return pool[pool.length - 1]!.term;
}

/** Categories available to the user, ordered by how many words they hold. */
export function roleCategories(terms: Term[], roles: string[]): { id: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const t of terms) {
    if (!t.roles.some((r) => roles.includes(r.role))) continue;
    for (const c of t.categories) counts.set(c, (counts.get(c) ?? 0) + 1);
  }
  return [...counts].map(([id, count]) => ({ id, count })).sort((a, b) => b.count - a.count);
}
