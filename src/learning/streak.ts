// Streak and calendar days, computed locally in the device's timezone (spec §3.3).
// Rules: never punish the user for a clock or timezone change; one missed day can be covered
// by a streak freeze.

/** YYYY-MM-DD in the device's local timezone. */
export function localDay(d = new Date()): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function daysBetween(a: string, b: string): number {
  return Math.round((Date.parse(`${b}T12:00:00Z`) - Date.parse(`${a}T12:00:00Z`)) / 86_400_000);
}

export interface StreakState { streak: number; bestStreak: number; lastActiveDay: string | null; streakFreezes: number }

/** Called when the user completes an activity today. */
export function recordActivity(s: StreakState, today: string): StreakState & { usedFreeze: boolean } {
  if (!s.lastActiveDay) return { ...s, streak: 1, bestStreak: Math.max(1, s.bestStreak), lastActiveDay: today, usedFreeze: false };
  const gap = daysBetween(s.lastActiveDay, today);
  if (gap <= 0) {
    // Same day, or the clock went backwards (travel, manual change): keep everything as is.
    return { ...s, usedFreeze: false };
  }
  let streak: number;
  let freezes = s.streakFreezes;
  let usedFreeze = false;
  if (gap === 1) streak = s.streak + 1;
  else if (gap === 2 && freezes > 0) { streak = s.streak + 1; freezes--; usedFreeze = true; }
  else streak = 1;
  return { streak, bestStreak: Math.max(s.bestStreak, streak), lastActiveDay: today, streakFreezes: freezes, usedFreeze };
}

/** Streak to display: 0 if the user missed more days than a freeze can cover. */
export function displayedStreak(s: StreakState, today: string): number {
  if (!s.lastActiveDay) return 0;
  const gap = daysBetween(s.lastActiveDay, today);
  if (gap <= 1) return s.streak;
  if (gap === 2 && s.streakFreezes > 0) return s.streak;
  return 0;
}

/** Days since the last activity, used by the "welcome back" message. */
export function daysAway(s: StreakState, today: string): number {
  return s.lastActiveDay ? Math.max(0, daysBetween(s.lastActiveDay, today)) : 0;
}
