// Adaptive placement test (spec §5.1): 10 questions, a staircase that moves one level up
// after a correct answer and one down after a mistake. The result is the level where the
// user answered correctly at least twice, starting from the top.
import { LEVELS, type Level } from '@/content/levels';
import type { Term } from '@/content/schema';

export const PLACEMENT_QUESTIONS = 10;
export const PLACEMENT_START: Level = 'B1';

export interface PlacementAnswer { level: Level; correct: boolean }

export function nextPlacementLevel(current: Level, correct: boolean): Level {
  const i = LEVELS.indexOf(current) + (correct ? 1 : -1);
  return LEVELS[Math.max(0, Math.min(LEVELS.length - 1, i))]!;
}

export function placementResult(answers: PlacementAnswer[]): Level {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    const level = LEVELS[i]!;
    const correctHere = answers.filter((a) => a.level === level && a.correct).length;
    if (correctHere >= 2) return level;
  }
  return answers.some((a) => a.correct) ? 'A2' : 'A1';
}

/** Picks a not-yet-asked term at the requested level, falling back to the closest level. */
export function pickPlacementTerm(terms: Term[], level: Level, asked: Set<string>, random = Math.random): Term | null {
  const order = [...LEVELS].sort((a, b) => Math.abs(LEVELS.indexOf(a) - LEVELS.indexOf(level)) - Math.abs(LEVELS.indexOf(b) - LEVELS.indexOf(level)));
  for (const l of order) {
    const pool = terms.filter((t) => t.level === l && !asked.has(t.id));
    if (pool.length) return pool[Math.floor(random() * pool.length)]!;
  }
  return null;
}
