import { useLiveQuery } from 'dexie-react-hooks';
import { useEffect, useMemo, useState } from 'react';
import { lastBackupAt } from '@/data/backup';
import { usePathProgress } from '@/data/path';
import { db } from '@/db/db';
import { type EvaluatedBadge, evaluateBadges } from '@/learning/badges';
import { displayedStreak, localDay } from '@/learning/streak';

/** Everything the profile and the reward watcher need: raw counters and evaluated badges. `ready` once all tables are read. */
export function useBadgeState() {
  const profile = useLiveQuery(() => db.profile.get('me'));
  const words = useLiveQuery(() => db.userTerms.filter((u) => !!u.card).toArray());
  const sessions = useLiveQuery(() => db.lessonSessions.filter((l) => !!l.completedAt).toArray());
  const spins = useLiveQuery(() => db.spins.count());
  const speaking = useLiveQuery(() => db.speakingAttempts.count());
  const reviews = useLiveQuery(() => db.reviewLog.count());
  const drafts = useLiveQuery(() => db.answerDrafts.toArray());
  const pathProgress = usePathProgress();
  const [hasBackup, setHasBackup] = useState<boolean | null>(null);

  useEffect(() => { void lastBackupAt(db).then((d) => setHasBackup(!!d)); }, []);

  const today = localDay();
  const ready = !!profile && !!words && !!sessions && spins !== undefined && speaking !== undefined && reviews !== undefined && !!drafts && hasBackup !== null;

  return useMemo(() => {
    if (!ready || !profile || !words || !sessions || !drafts) return { ready: false as const };
    const streak = displayedStreak(profile, today);
    const mastered = words.filter((w) => w.state === 'mastered').length;
    const favorites = words.filter((w) => w.favorite).length;
    const week = new Set(Array.from({ length: 7 }, (_, i) => localDay(new Date(Date.now() - i * 86_400_000))));
    const activeDaysWeek = new Set(
      sessions.filter((s) => s.completedAt && (s.xpEarned || 0) > 0).map((s) => localDay(new Date(s.completedAt!))).filter((d) => week.has(d))
    ).size;
    const pathKeys = Object.keys(pathProgress);
    const recallsDone = pathKeys.filter((k) => k.startsWith('rap:')).length;
    const interviewsDone = drafts.filter((d) => d.checklist?.practiced).length + pathKeys.filter((k) => k.startsWith('itw:')).length;
    const evaluated: EvaluatedBadge[] = evaluateBadges({
      xp: profile.xp,
      bestStreak: Math.max(profile.bestStreak, streak),
      wordsLearned: words.length,
      wordsMastered: mastered,
      favoritesCount: favorites,
      courseNodesDone: pathKeys.length,
      recallsDone,
      interviewsDone,
      perfectLessons: sessions.filter((s) => (s.score ?? 0) >= 1).length,
      spinsCount: spins ?? 0,
      speakingCount: speaking ?? 0,
      reviewsCount: reviews ?? 0,
      activeDaysWeek,
      pitchSaved: drafts.some((d) => d.id === 'pitch' && d.text.trim().length > 10),
      secondaryRolesCount: profile.secondaryRoles.length,
      hasBackup: !!hasBackup
    });
    return { ready: true as const, profile, today, streak, wordsCount: words.length, mastered, favorites, sessions, evaluated, hasBackup: !!hasBackup };
  }, [ready, profile, words, sessions, drafts, spins, speaking, reviews, pathProgress, hasBackup, today]);
}
