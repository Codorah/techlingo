// The learning path. Home lists the user's themes (categories of their roles' words);
// opening a theme shows a Duolingo-style map of units. Each unit = a reminder (the
// theme's mini-course for the first unit, a quick review of the previous unit after),
// lessons of a few words, then a test. Deterministic for a given content version, so
// progress stored by node id stays valid.
import { LEVELS, type Level } from '@/content/levels';
import type { Term } from '@/content/schema';

export type NodeKind = 'course' | 'recap' | 'lesson' | 'challenge';
export interface PathNode { id: string; kind: NodeKind; unitIndex: number; index: number; termIds: string[] }
export interface PathUnit { id: string; index: number; level: Level; termIds: string[]; nodes: PathNode[] }
export interface PathTheme { category: string; level: Level; termIds: string[]; units: PathUnit[] }
export type PathProgress = Record<string, { at: string; score?: number }>;

export const PATH = { minWords: 6, wordsPerUnit: 10, maxUnits: 5, wordsPerLesson: 5, challengePass: 0.7 } as const;

const levelIndex = (l: Level) => LEVELS.indexOf(l);
const meanLevel = (ts: Term[]) => ts.reduce((s, t) => s + levelIndex(t.level), 0) / ts.length;

/** Splits ids into chunks of at most `size`, keeping every chunk at least 3 long. */
function chunk(ids: string[], size: number): string[][] {
  const out: string[][] = [];
  for (let i = 0; i < ids.length; i += size) out.push(ids.slice(i, i + size));
  if (out.length > 1 && out.at(-1)!.length < 3) out[out.length - 2]!.push(...out.pop()!);
  return out;
}

/** Spreads n items over k groups as evenly as possible, in order. */
function spread<T>(items: T[], k: number): T[][] {
  const out: T[][] = [];
  let start = 0;
  for (let g = 0; g < k; g++) {
    const end = start + Math.round((items.length - start) / (k - g));
    out.push(items.slice(start, end));
    start = end;
  }
  return out;
}

/** `roles` weights words of the primary role over secondary ones when ordering themes. */
export function buildThemes(terms: Term[], roles: string[]): PathTheme[] {
  const weightOf = (t: Term) => Math.max(0, ...t.roles.filter((r) => roles.includes(r.role)).map((r) => r.priority * (r.role === roles[0] ? 1 : 0.6)));
  const groups = new Map<string, Term[]>();
  for (const t of terms) {
    const category = t.categories[0];
    if (t.status === 'deprecated' || !category || !weightOf(t)) continue;
    groups.set(category, [...(groups.get(category) ?? []), t]);
  }

  return [...groups.entries()]
    .filter(([, ts]) => ts.length >= PATH.minWords)
    .map(([category, ts]) => ({ category, ts, weight: ts.reduce((s, t) => s + weightOf(t), 0) / Math.sqrt(ts.length) }))
    .sort((a, b) => meanLevel(a.ts) - meanLevel(b.ts) || b.weight - a.weight || a.category.localeCompare(b.category))
    .map(({ category, ts }) => {
      const words = [...ts].sort((a, b) => levelIndex(a.level) - levelIndex(b.level) || weightOf(b) - weightOf(a) || a.id.localeCompare(b.id));
      const unitCount = Math.min(PATH.maxUnits, Math.max(1, Math.round(words.length / PATH.wordsPerUnit)));
      const units = spread(words, unitCount).map((unitWords, u): PathUnit => {
        const id = `${category}:u${u + 1}`;
        const termIds = unitWords.map((t) => t.id);
        const kinds: { kind: NodeKind; termIds: string[] }[] = [
          { kind: u === 0 ? 'course' : 'recap', termIds },
          ...chunk(termIds, PATH.wordsPerLesson).map((ids) => ({ kind: 'lesson' as const, termIds: ids })),
          { kind: 'challenge', termIds }
        ];
        return {
          id, index: u, termIds,
          level: LEVELS[Math.round(meanLevel(unitWords))] ?? 'B1',
          nodes: kinds.map((k, i) => ({ id: `${id}:${k.kind}-${i}`, unitIndex: u, index: i, ...k }))
        };
      });
      return { category, level: LEVELS[Math.round(meanLevel(words))] ?? 'B1', termIds: words.map((t) => t.id), units };
    });
}

export type NodeState = 'done' | 'current' | 'locked';

/** Inside a theme, nodes unlock one after another. */
export function nodeStates(theme: PathTheme, progress: PathProgress): Map<string, NodeState> {
  const states = new Map<string, NodeState>();
  let currentGiven = false;
  for (const node of theme.units.flatMap((u) => u.nodes)) {
    if (progress[node.id]) states.set(node.id, 'done');
    else if (!currentGiven) { states.set(node.id, 'current'); currentGiven = true; }
    else states.set(node.id, 'locked');
  }
  return states;
}

export function themeProgress(theme: PathTheme, progress: PathProgress) {
  const nodes = theme.units.flatMap((u) => u.nodes);
  const done = nodes.filter((n) => progress[n.id]).length;
  return { done, total: nodes.length, ratio: nodes.length ? done / nodes.length : 0 };
}

/** The theme to suggest on Home: the one in progress, else the first not finished. */
export function nextTheme(themes: PathTheme[], progress: PathProgress): PathTheme | undefined {
  const started = themes.find((t) => { const p = themeProgress(t, progress); return p.done > 0 && p.done < p.total; });
  return started ?? themes.find((t) => themeProgress(t, progress).done < themeProgress(t, progress).total);
}
