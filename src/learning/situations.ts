// Hand-written path (work situations). Each unit = a guide then 3-4 lessons; everything
// unlocks in order across the whole path. Progress shares the path progress row.
import type { PathFile } from '@/content/schema';
import { matchWords } from './compare';
import type { NodeState, PathProgress } from './path';

export type SituationNode =
  | { id: string; kind: 'guide'; unitIndex: number }
  | { id: string; kind: 'lesson'; unitIndex: number; lessonIndex: number };

export const guideId = (unitId: string) => `sit:${unitId}:guide`;
export const lessonNodeId = (lessonId: string) => `sit:${lessonId}`;

export function situationNodes(path: Pick<PathFile, 'units'>): SituationNode[] {
  return path.units.flatMap((u, unitIndex): SituationNode[] => [
    { id: guideId(u.id), kind: 'guide', unitIndex },
    ...u.lessons.map((l, lessonIndex): SituationNode => ({ id: lessonNodeId(l.id), kind: 'lesson', unitIndex, lessonIndex }))
  ]);
}

export function situationStates(nodes: SituationNode[], progress: PathProgress): Map<string, NodeState> {
  const states = new Map<string, NodeState>();
  let currentGiven = false;
  for (const n of nodes) {
    if (progress[n.id]) states.set(n.id, 'done');
    else if (!currentGiven) { states.set(n.id, 'current'); currentGiven = true; }
    else states.set(n.id, 'locked');
  }
  return states;
}

/** Which key phrases a written or spoken answer contains (case, accents, punctuation and contractions ignored). */
export function phraseHits(answer: string, phrases: string[]): boolean[] {
  const a = ` ${matchWords(answer).join(' ')} `;
  return phrases.map((p) => {
    const words = matchWords(p);
    return words.length > 0 && a.includes(` ${words.join(' ')} `);
  });
}
