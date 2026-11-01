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

// A unit holds about 8 words split into 2 to 4 lessons; a theme has up to 5 units.
export const PATH = { minWords: 6, wordsPerUnit: 8, maxUnits: 5, wordsPerLesson: 4, maxLessons: 4, challengePass: 0.7 } as const;

const levelIndex = (l: Level) => LEVELS.indexOf(l);
const meanLevel = (ts: Term[]) => ts.reduce((s, t) => s + levelIndex(t.level), 0) / ts.length;

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

/** `roles` = primary, secondary roles, then the domain's general role (weighted lower). */
export function buildThemes(terms: Term[], roles: string[], generalRole?: string): PathTheme[] {
  const factor = (role: string) => (role === roles[0] ? 1 : role === generalRole ? 0.15 : 0.6);
  const all = generalRole && !roles.includes(generalRole) ? [...roles, generalRole] : roles;
  const weightOf = (t: Term) => Math.max(0, ...t.roles.filter((r) => all.includes(r.role)).map((r) => r.priority * factor(r.role)));
  const groups = new Map<string, Term[]>();
  for (const t of terms) {
    const category = t.categories[0];
    if (t.status === 'deprecated' || !category || !weightOf(t)) continue;
    groups.set(category, [...(groups.get(category) ?? []), t]);
  }

  return [...groups.entries()]
    .filter(([, ts]) => ts.length >= PATH.minWords)
    // The themes that matter most for the user's job come first.
    .map(([category, ts]) => ({ category, ts, weight: ts.reduce((s, t) => s + weightOf(t), 0) }))
    .sort((a, b) => b.weight - a.weight || a.category.localeCompare(b.category))
    .map(({ category, ts }) => {
      const words = [...ts].sort((a, b) => levelIndex(a.level) - levelIndex(b.level) || weightOf(b) - weightOf(a) || a.id.localeCompare(b.id));
      const unitCount = Math.min(PATH.maxUnits, Math.max(1, Math.round(words.length / PATH.wordsPerUnit)));
      const units = spread(words, unitCount).map((unitWords, u): PathUnit => {
        const id = `${category}:u${u + 1}`;
        const termIds = unitWords.map((t) => t.id);
        const kinds: { kind: NodeKind; termIds: string[] }[] = [
          { kind: u === 0 ? 'course' : 'recap', termIds },
          ...spread(termIds, Math.min(PATH.maxLessons, Math.max(1, Math.round(termIds.length / PATH.wordsPerLesson)))).map((ids) => ({ kind: 'lesson' as const, termIds: ids })),
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
