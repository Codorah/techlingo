// Learner levels (mastery-based XP curve) and 16 professional badges with bronze/silver/gold tiers.
// Pure functions, tested in tests/learning.test.ts.

export interface LearnerLevel {
  level: number;
  titleKey: string;
  currentXp: number;
  levelFloorXp: number;
  nextLevelXp: number;
  progressRatio: number;
}

// Smooth quadratic progression: level 1 starts at 0 XP, level 2 at 150 XP, level 3 at 400 XP, level 4 at 750 XP...
export function xpForLevel(level: number): number {
  if (level <= 1) return 0;
  return Math.round(50 * (level - 1) * (level + 1));
}

const TITLE_KEYS = ['intern', 'junior', 'regular', 'confirmed', 'senior', 'lead', 'staff', 'principal'] as const;

export function computeLevel(xp: number): LearnerLevel {
  const safeXp = Math.max(0, Math.floor(xp));
  let level = 1;
  while (xpForLevel(level + 1) <= safeXp && level < 50) level++;
  const floor = xpForLevel(level);
  const next = xpForLevel(level + 1);
  const span = Math.max(1, next - floor);
  const idx = Math.min(TITLE_KEYS.length - 1, Math.floor((level - 1) / 2));
  return {
    level,
    titleKey: TITLE_KEYS[idx]!,
    currentXp: safeXp,
    levelFloorXp: floor,
    nextLevelXp: next,
    progressRatio: Math.min(1, (safeXp - floor) / span)
  };
}

export type BadgeTier = 'locked' | 'bronze' | 'silver' | 'gold';

export interface BadgeInput {
  xp: number;
  bestStreak: number;
  wordsLearned: number;
  wordsMastered: number;
  favoritesCount: number;
  courseNodesDone: number;
  recallsDone: number;
  interviewsDone: number;
  perfectLessons: number;
  spinsCount: number;
  speakingCount: number;
  reviewsCount: number;
  activeDaysWeek: number;
  pitchSaved: boolean;
  secondaryRolesCount: number;
  hasBackup: boolean;
}

export interface BadgeDef {
  id: string;
  icon: string;
  tiers: [number, number, number];
  value: (b: BadgeInput) => number;
}

export const BADGES: readonly BadgeDef[] = [
  { id: 'first_steps', icon: 'Compass', tiers: [1, 10, 30], value: (b) => b.courseNodesDone },
  { id: 'lexicon', icon: 'BookOpen', tiers: [10, 50, 150], value: (b) => b.wordsLearned },
  { id: 'mastery', icon: 'Trophy', tiers: [5, 25, 100], value: (b) => b.wordsMastered },
  { id: 'streak', icon: 'Flame', tiers: [3, 7, 21], value: (b) => b.bestStreak },
  { id: 'weekly', icon: 'CalendarCheck', tiers: [2, 4, 6], value: (b) => b.activeDaysWeek },
  { id: 'speaker', icon: 'Mic', tiers: [3, 15, 50], value: (b) => b.speakingCount },
  { id: 'recall', icon: 'RotateCcw', tiers: [1, 4, 12], value: (b) => b.recallsDone },
  { id: 'interview', icon: 'BriefcaseBusiness', tiers: [1, 5, 12], value: (b) => b.interviewsDone },
  { id: 'pitch', icon: 'Presentation', tiers: [1, 1, 1], value: (b) => (b.pitchSaved ? 1 : 0) },
  { id: 'precision', icon: 'Target', tiers: [1, 5, 15], value: (b) => b.perfectLessons },
  { id: 'memory', icon: 'Brain', tiers: [10, 50, 200], value: (b) => b.reviewsCount },
  { id: 'wheel', icon: 'CircleDot', tiers: [1, 7, 25], value: (b) => b.spinsCount },
  { id: 'collector', icon: 'Star', tiers: [3, 12, 30], value: (b) => b.favoritesCount },
  { id: 'polyvalent', icon: 'Globe', tiers: [1, 2, 3], value: (b) => 1 + b.secondaryRolesCount },
  { id: 'xp', icon: 'Zap', tiers: [200, 1000, 3000], value: (b) => b.xp },
  { id: 'guardian', icon: 'ShieldCheck', tiers: [1, 1, 1], value: (b) => (b.hasBackup ? 1 : 0) }
] as const;

export interface EvaluatedBadge {
  id: string;
  icon: string;
  tier: BadgeTier;
  current: number;
  nextTarget: number;
  ratio: number;
  tiers: [number, number, number];
}

export function evaluateBadges(input: BadgeInput): EvaluatedBadge[] {
  return BADGES.map((def) => {
    const current = def.value(input);
    const [b, s, g] = def.tiers;
    const tier: BadgeTier = current >= g ? 'gold' : current >= s ? 'silver' : current >= b ? 'bronze' : 'locked';
    const nextTarget = tier === 'locked' ? b : tier === 'bronze' ? s : g;
    const prevFloor = tier === 'locked' ? 0 : tier === 'bronze' ? b : tier === 'silver' ? s : g;
    const span = Math.max(1, nextTarget - prevFloor);
    const ratio = tier === 'gold' ? 1 : Math.min(1, Math.max(0, (current - prevFloor) / span));
    return { id: def.id, icon: def.icon, tier, current, nextTarget, ratio, tiers: def.tiers };
  });
}


// ---------------------------------------------------------------------------
// Rewards: detection of what the learner just earned (pure, tested).
// ---------------------------------------------------------------------------
export const TIER_RANK: Record<BadgeTier, number> = { locked: 0, bronze: 1, silver: 2, gold: 3 };
export const RANK_TIER: BadgeTier[] = ['locked', 'bronze', 'silver', 'gold'];

/** Highest tier rank reached per badge id (what the learner has already been told about). */
export type SeenRanks = Record<string, number>;

export function snapshotRanks(badges: EvaluatedBadge[], previous: SeenRanks = {}): SeenRanks {
  const out: SeenRanks = { ...previous };
  for (const b of badges) out[b.id] = Math.max(out[b.id] ?? 0, TIER_RANK[b.tier]);
  return out;
}

export interface BadgeUnlock { id: string; icon: string; tier: Exclude<BadgeTier, 'locked'> }

/** Badges whose tier is higher than the last one seen. Skipping tiers yields only the top one. */
export function newlyEarned(seen: SeenRanks, badges: EvaluatedBadge[]): BadgeUnlock[] {
  const out: BadgeUnlock[] = [];
  for (const b of badges) {
    if (TIER_RANK[b.tier] > (seen[b.id] ?? 0)) out.push({ id: b.id, icon: b.icon, tier: b.tier as BadgeUnlock['tier'] });
  }
  return out;
}

/** The new level when xp crosses a threshold above the last level announced, else null. */
export function levelReached(seenLevel: number, xp: number): number | null {
  const now = computeLevel(xp).level;
  return now > seenLevel ? now : null;
}

/** Badges closest to the next tier (not gold yet), most advanced first. */
export function nearestBadges(badges: EvaluatedBadge[], count: number): EvaluatedBadge[] {
  return badges
    .filter((b) => b.tier !== 'gold')
    .sort((a, b) => b.ratio - a.ratio || TIER_RANK[b.tier] - TIER_RANK[a.tier])
    .slice(0, count);
}
