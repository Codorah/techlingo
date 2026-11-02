import { describe, expect, it } from 'vitest';
import {
  BADGES,
  type BadgeInput,
  computeLevel,
  evaluateBadges,
  levelReached,
  nearestBadges,
  newlyEarned,
  snapshotRanks,
  xpForLevel
} from '@/learning/badges';

const empty: BadgeInput = {
  xp: 0, bestStreak: 0, wordsLearned: 0, wordsMastered: 0, favoritesCount: 0, courseNodesDone: 0, recallsDone: 0,
  interviewsDone: 0, perfectLessons: 0, spinsCount: 0, speakingCount: 0, reviewsCount: 0, activeDaysWeek: 0,
  pitchSaved: false, secondaryRolesCount: 0, hasBackup: false
};

describe('level curve', () => {
  it('starts at 0 XP and grows quadratically', () => {
    expect([1, 2, 3, 4].map(xpForLevel)).toEqual([0, 150, 400, 750]);
  });
  it('levels up exactly on the threshold', () => {
    expect(computeLevel(149).level).toBe(1);
    expect(computeLevel(150).level).toBe(2);
    expect(computeLevel(399).level).toBe(2);
    expect(computeLevel(400).level).toBe(3);
  });
  it('reports a progress ratio inside the level', () => {
    const l = computeLevel(275);
    expect(l.levelFloorXp).toBe(150);
    expect(l.nextLevelXp).toBe(400);
    expect(l.progressRatio).toBeCloseTo(0.5, 5);
  });
  it('announces a level only once it is above the last one seen', () => {
    expect(levelReached(1, 100)).toBeNull();
    expect(levelReached(1, 150)).toBe(2);
    expect(levelReached(2, 150)).toBeNull();
    expect(levelReached(1, 400)).toBe(3);
  });
});

describe('newly earned badges', () => {
  it('nothing new when the snapshot already matches', () => {
    const ev = evaluateBadges({ ...empty, xp: 250, wordsLearned: 12 });
    expect(newlyEarned(snapshotRanks(ev), ev)).toEqual([]);
  });
  it('detects a first bronze tier', () => {
    const before = evaluateBadges(empty);
    const after = evaluateBadges({ ...empty, wordsLearned: 10 });
    const fresh = newlyEarned(snapshotRanks(before), after);
    expect(fresh).toHaveLength(1);
    expect(fresh[0]).toMatchObject({ id: 'lexicon', tier: 'bronze' });
  });
  it('detects a tier upgrade and reports only the top tier when tiers are skipped', () => {
    const seen = snapshotRanks(evaluateBadges({ ...empty, wordsLearned: 10 }));
    const fresh = newlyEarned(seen, evaluateBadges({ ...empty, wordsLearned: 150 }));
    expect(fresh).toEqual([{ id: 'lexicon', icon: 'BookOpen', tier: 'gold' }]);
  });
  it('never re-announces a tier after the value drops, and ranks never decrease', () => {
    const high = snapshotRanks(evaluateBadges({ ...empty, bestStreak: 7 }));
    const low = evaluateBadges({ ...empty, bestStreak: 0 });
    expect(newlyEarned(high, low)).toEqual([]);
    expect(snapshotRanks(low, high).streak).toBe(2);
  });
  it('treats a missing snapshot entry as locked', () => {
    const ev = evaluateBadges({ ...empty, hasBackup: true });
    expect(newlyEarned({}, ev).map((u) => u.id)).toContain('guardian');
  });
});

describe('nearest badges', () => {
  it('returns unfinished badges, most advanced first', () => {
    const ev = evaluateBadges({ ...empty, wordsLearned: 9, xp: 3000 });
    const near = nearestBadges(ev, 3);
    expect(near).toHaveLength(3);
    expect(near.some((b) => b.id === 'xp')).toBe(false);
    expect(near[0]!.id).toBe('lexicon');
    expect(near[0]!.ratio).toBeGreaterThanOrEqual(near[1]!.ratio);
  });
  it('exposes the three tier targets of each badge', () => {
    for (const b of evaluateBadges(empty)) expect(b.tiers).toEqual(BADGES.find((d) => d.id === b.id)!.tiers);
  });
});
