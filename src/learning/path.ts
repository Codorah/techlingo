// The learning path: a Duolingo-style sequence of units built from the role's words.
// One unit per theme (category), easiest first; each unit = mini-course, lessons of a few
// words and a challenge. The last unit is a mock interview. Deterministic for a given
// content version, so progress stored by node id stays valid.
import { LEVELS, type Level } from '@/content/levels';
import type { Term } from '@/content/schema';

export type NodeKind = 'course' | 'lesson' | 'challenge' | 'interview';
export interface PathNode { id: string; kind: NodeKind; unitId: string; index: number; termIds: string[]; questionIds: string[] }
export interface PathUnit { id: string; index: number; category: string | null; level: Level; termIds: string[]; nodes: PathNode[] }
export type PathProgress = Record<string, { at: string; score?: number }>;

export const PATH = { maxUnits: 6, wordsPerLesson: 5, lessonsPerUnit: 3, interviewQuestions: 5, challengePass: 0.7 } as const;

const levelIndex = (l: Level) => LEVELS.indexOf(l);

export function buildPath(terms: Term[], role: string, questionIds: string[] = []): PathUnit[] {
  const priority = (t: Term) => t.roles.find((r) => r.role === role)?.priority ?? 0;
  const groups = new Map<string, Term[]>();
  for (const t of terms) {
    if (t.status === 'deprecated' || !priority(t) || !t.categories[0]) continue;
    const g = groups.get(t.categories[0]) ?? [];
    g.push(t);
    groups.set(t.categories[0], g);
  }

  const meanLevel = (ts: Term[]) => ts.reduce((s, t) => s + levelIndex(t.level), 0) / ts.length;
  const byLevel = (a: Term, b: Term) => levelIndex(a.level) - levelIndex(b.level) || priority(b) - priority(a) || a.id.localeCompare(b.id);
  const perUnit = PATH.wordsPerLesson * PATH.lessonsPerUnit;

  // A big theme (e.g. "security" for a security analyst) is split by level into several units.
  const blocks: { key: string; category: string; ts: Term[]; weight: number }[] = [];
  for (const [category, ts] of groups) {
    if (ts.length < PATH.wordsPerLesson) continue;
    const sorted = [...ts].sort(byLevel);
    const parts = Math.max(1, Math.floor(sorted.length / perUnit));
    for (let k = 0; k < parts; k++) {
      const chunk = sorted.slice(k * perUnit, k === parts - 1 ? Math.min(sorted.length, (k + 1) * perUnit) : (k + 1) * perUnit);
      blocks.push({ key: parts > 1 ? `${category}-${k + 1}` : category, category, ts: chunk, weight: chunk.reduce((s, t) => s + priority(t), 0) });
    }
  }
  const chosen = blocks
    .sort((a, b) => b.weight - a.weight || a.key.localeCompare(b.key))
    .slice(0, PATH.maxUnits)
    .sort((a, b) => meanLevel(a.ts) - meanLevel(b.ts) || b.weight - a.weight);

  const units: PathUnit[] = chosen.map(({ key, category, ts }, u) => {
    const words = [...ts].sort(byLevel).slice(0, perUnit);
    const lessons: string[][] = [];
    for (let i = 0; i < words.length; i += PATH.wordsPerLesson) lessons.push(words.slice(i, i + PATH.wordsPerLesson).map((t) => t.id));
    // A short last lesson joins the previous one rather than standing alone.
    if (lessons.length > 1 && lessons.at(-1)!.length < 3) lessons[lessons.length - 2]!.push(...lessons.pop()!);
    const id = `${role}:${key}`;
    const termIds = lessons.flat();
    const kinds: { kind: NodeKind; termIds: string[] }[] = [
      { kind: 'course', termIds },
      ...lessons.map((ids) => ({ kind: 'lesson' as const, termIds: ids })),
      { kind: 'challenge', termIds }
    ];
    return {
      id, index: u, category, termIds,
      level: LEVELS[Math.round(meanLevel(words))] ?? 'B1',
      nodes: kinds.map((k, i) => ({ id: `${id}:${k.kind}-${i}`, unitId: id, index: i, questionIds: [], ...k }))
    };
  });

  if (questionIds.length) {
    const id = `${role}:interview`;
    units.push({
      id, index: units.length, category: null, level: units.at(-1)?.level ?? 'B1', termIds: [],
      nodes: [{ id: `${id}:interview-0`, unitId: id, index: 0, kind: 'interview', termIds: [], questionIds: questionIds.slice(0, PATH.interviewQuestions) }]
    });
  }
  return units;
}

export type NodeState = 'done' | 'current' | 'locked';

/** Nodes unlock one after another across the whole path. */
export function nodeStates(units: PathUnit[], progress: PathProgress): Map<string, NodeState> {
  const states = new Map<string, NodeState>();
  let currentGiven = false;
  for (const node of units.flatMap((u) => u.nodes)) {
    if (progress[node.id]) states.set(node.id, 'done');
    else if (!currentGiven) { states.set(node.id, 'current'); currentGiven = true; }
    else states.set(node.id, 'locked');
  }
  return states;
}
