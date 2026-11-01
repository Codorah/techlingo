// Learning-path progress. Completed nodes live in one settings row (no schema change);
// each answered word is also scheduled with FSRS so the path feeds the review queue.
import { useLiveQuery } from 'dexie-react-hooks';
import { db, getDeviceId, nowIso, uuid } from '@/db/db';
import type { PathProgress } from '@/learning/path';
import { review, stateOf } from '@/learning/srs';
import { addXP, getRetention, getSetting, setSetting } from './progress';

const KEY = 'pathProgress';

export function usePathProgress(): PathProgress {
  const row = useLiveQuery(() => db.settings.get(KEY), []);
  return (row?.value as PathProgress | undefined) ?? {};
}

// XP rewards mastery, not volume: a replayed node earns far less than a first pass.
export const PATH_XP = { course: 5, recap: 10, lessonBase: 10, perCorrect: 5, challengePass: 30, replayPerCorrect: 1 } as const;

export interface WordResult { termId: string; correct: number; total: number }

/** Records a finished node and returns the XP earned. `score` overrides the word results when a step is not about single words (situations). */
export async function completeNode(nodeId: string, kind: 'course' | 'recap' | 'lesson' | 'challenge', results: WordResult[] = [], score?: { correct: number; total: number }): Promise<{ xp: number; firstTime: boolean }> {
  const progress = await getSetting<PathProgress>(KEY, {});
  const firstTime = !progress[nodeId];
  const correct = score?.correct ?? results.reduce((s, r) => s + r.correct, 0);
  const total = score?.total ?? results.reduce((s, r) => s + r.total, 0);
  const ratio = total ? correct / total : 1;

  const xp = !firstTime ? correct * PATH_XP.replayPerCorrect
    : kind === 'course' ? PATH_XP.course
    : kind === 'recap' ? PATH_XP.recap
    : kind === 'challenge' ? PATH_XP.challengePass
    : PATH_XP.lessonBase + correct * PATH_XP.perCorrect;

  if (results.length) await scheduleWords(results);
  if (firstTime) await setSetting(KEY, { ...progress, [nodeId]: { at: nowIso(), score: ratio } });
  await logSession(results[0]?.termId ?? nodeId, ratio, xp);
  await addXP(xp);
  return { xp, firstTime };
}

async function scheduleWords(results: WordResult[]) {
  const deviceId = await getDeviceId();
  const retention = await getRetention();
  const now = new Date();
  const iso = now.toISOString();
  await db.transaction('rw', [db.userTerms, db.reviewLog], async () => {
    for (const r of results) {
      const ratio = r.total ? r.correct / r.total : 0;
      const rating = ratio >= 1 ? 3 : ratio >= 0.5 ? 2 : 1;
      const existing = await db.userTerms.get(r.termId);
      const card = review(existing?.card ?? null, rating, now, retention);
      await db.reviewLog.put({ id: uuid(), termId: r.termId, rating, reviewedAt: iso, cardBefore: existing?.card ?? null, updatedAt: iso, deviceId });
      await db.userTerms.put({ termId: r.termId, card, state: stateOf(card), favorite: existing?.favorite ?? false, notes: existing?.notes ?? '', updatedAt: iso, deviceId });
    }
  });
}

// Home's daily tasks and weekly goal count completed lesson sessions.
async function logSession(termId: string, score: number, xp: number) {
  const deviceId = await getDeviceId();
  const now = nowIso();
  await db.lessonSessions.put({ id: uuid(), termId, step: 0, score, xpEarned: xp, startedAt: now, completedAt: now, updatedAt: now, deviceId });
}
