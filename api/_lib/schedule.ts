// Pure scheduling rules for the daily Web Push reminder (no I/O, unit-tested in tests/push.test.ts).
// Files under api/_lib are helpers: Vercel does not expose them as endpoints.

/** "HH:MM", 24-hour clock. */
export const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
/** "YYYY-MM-DD". */
export const DAY_RE = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

/**
 * The scheduler runs every 30 minutes and can be late, but a reminder must never arrive hours
 * after the chosen time (for example right after subscribing at 23:00 for an 08:00 reminder).
 */
export const SEND_WINDOW_MINUTES = 180;

export function isValidTime(value: string): boolean {
  return TIME_RE.test(value);
}

export function isValidDay(value: string): boolean {
  if (!DAY_RE.test(value)) return false;
  const d = new Date(`${value}T12:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

export function isValidTimeZone(tz: string): boolean {
  if (!tz || tz.length > 64 || !/^[A-Za-z0-9_+\-/]+$/.test(tz)) return false;
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

export function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map((x) => Number.parseInt(x, 10));
  return (h ?? 0) * 60 + (m ?? 0);
}

/** Calendar day and minutes since midnight of `now` in the given IANA time zone. */
export function localClock(now: Date, tz: string): { day: string; minutes: number } {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
  }).formatToParts(now);
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)?.value ?? '00';
  const hour = Number.parseInt(get('hour'), 10) % 24;
  return { day: `${get('year')}-${get('month')}-${get('day')}`, minutes: hour * 60 + Number.parseInt(get('minute'), 10) };
}

export interface ReminderState {
  reminder_time: string;
  tz: string;
  last_active_day: string | null;
  last_sent_day: string | null;
}

/**
 * Returns the learner's local day when a reminder is due now, otherwise null.
 * Due means: the chosen time has passed today (within the send window), nothing was sent today,
 * and the learner has not studied today.
 */
export function dueDay(sub: ReminderState, now: Date): string | null {
  if (!isValidTime(sub.reminder_time) || !isValidTimeZone(sub.tz)) return null;
  const { day, minutes } = localClock(now, sub.tz);
  const late = minutes - timeToMinutes(sub.reminder_time);
  if (late < 0 || late > SEND_WINDOW_MINUTES) return null;
  if (sub.last_sent_day === day || sub.last_active_day === day) return null;
  return day;
}

/** Kind, never guilt-tripping copy. One message per day, chosen from the day so it varies. */
const MESSAGES = [
  { title: 'C’est l’heure de ton anglais pro', body: 'Tes 5 minutes d’anglais pro t’attendent.' },
  { title: 'Ton mot du jour t’attend', body: 'Un mot de ton métier, deux minutes, et c’est fait.' },
  { title: 'Une petite pause en anglais ?', body: 'Une leçon courte pour avancer à ton rythme.' }
] as const;

export function reminderPayload(day: string): { title: string; body: string; url: string } {
  const n = day.split('').reduce((s, c) => s + c.charCodeAt(0), 0);
  const msg = MESSAGES[n % MESSAGES.length] ?? MESSAGES[0];
  return { title: msg.title, body: msg.body, url: '/?source=reminder' };
}
