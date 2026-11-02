import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { dueDay, isValidDay, isValidTime, isValidTimeZone, localClock, reminderPayload, SEND_WINDOW_MINUTES } from '../api/_lib/schedule';
import { PUSH_SCHEMA_SQL } from '../api/_lib/schema';
import { activeSchema, isPushEndpoint, subscribeSchema } from '../api/_lib/validation';
import { base64UrlToUint8Array } from '@/lib/notifications';

const sub = (over: Partial<{ reminder_time: string; tz: string; last_active_day: string | null; last_sent_day: string | null }> = {}) => ({
  reminder_time: '18:30', tz: 'Europe/Paris', last_active_day: null, last_sent_day: null, ...over
});

describe('push schedule', () => {
  // 2026-11-02 is winter time in Paris (UTC+1).
  it('reads the local clock in the learner time zone', () => {
    expect(localClock(new Date('2026-11-02T17:45:00Z'), 'Europe/Paris')).toEqual({ day: '2026-11-02', minutes: 18 * 60 + 45 });
    expect(localClock(new Date('2026-11-02T17:45:00Z'), 'Africa/Abidjan')).toEqual({ day: '2026-11-02', minutes: 17 * 60 + 45 });
    expect(localClock(new Date('2026-11-02T23:30:00Z'), 'Asia/Tokyo')).toEqual({ day: '2026-11-03', minutes: 8 * 60 + 30 });
    expect(localClock(new Date('2026-11-02T00:10:00Z'), 'America/Montreal').day).toBe('2026-11-01');
  });

  it('is due once the reminder time has passed today', () => {
    expect(dueDay(sub(), new Date('2026-11-02T17:29:00Z'))).toBeNull(); // 18:29 Paris
    expect(dueDay(sub(), new Date('2026-11-02T17:30:00Z'))).toBe('2026-11-02'); // 18:30 Paris
    expect(dueDay(sub(), new Date('2026-11-02T18:15:00Z'))).toBe('2026-11-02');
  });

  it('uses each learner time zone, not the server clock', () => {
    const now = new Date('2026-11-02T17:35:00Z');
    expect(dueDay(sub({ tz: 'Europe/Paris' }), now)).toBe('2026-11-02'); // 18:35
    expect(dueDay(sub({ tz: 'Africa/Dakar' }), now)).toBeNull(); // 17:35
    expect(dueDay(sub({ tz: 'America/Montreal' }), now)).toBeNull(); // 12:35
    expect(dueDay(sub({ reminder_time: '08:00', tz: 'Asia/Tokyo' }), new Date('2026-11-02T23:30:00Z'))).toBe('2026-11-03');
  });

  it('follows daylight saving time', () => {
    // 2026-07-01: Paris is UTC+2, so 18:30 local is 16:30 UTC.
    expect(dueDay(sub(), new Date('2026-07-01T16:30:00Z'))).toBe('2026-07-01');
    expect(dueDay(sub(), new Date('2026-07-01T16:29:00Z'))).toBeNull();
  });

  it('never sends twice the same day, and sends again the next day', () => {
    const now = new Date('2026-11-02T18:00:00Z');
    expect(dueDay(sub({ last_sent_day: '2026-11-02' }), now)).toBeNull();
    expect(dueDay(sub({ last_sent_day: '2026-11-01' }), now)).toBe('2026-11-02');
  });

  it('skips the day when the learner already studied', () => {
    const now = new Date('2026-11-02T18:00:00Z');
    expect(dueDay(sub({ last_active_day: '2026-11-02' }), now)).toBeNull();
    expect(dueDay(sub({ last_active_day: '2026-11-01' }), now)).toBe('2026-11-02');
  });

  it('does not send hours after the chosen time', () => {
    const at = (minutesLate: number) => new Date(Date.parse('2026-11-02T17:30:00Z') + minutesLate * 60_000);
    expect(dueDay(sub(), at(SEND_WINDOW_MINUTES))).toBe('2026-11-02');
    expect(dueDay(sub(), at(SEND_WINDOW_MINUTES + 1))).toBeNull();
    expect(dueDay(sub({ reminder_time: '08:00' }), new Date('2026-11-02T22:00:00Z'))).toBeNull(); // 23:00 Paris
  });

  it('ignores corrupted rows', () => {
    const now = new Date('2026-11-02T18:00:00Z');
    expect(dueDay(sub({ tz: 'Mars/Olympus' }), now)).toBeNull();
    expect(dueDay(sub({ reminder_time: '25:00' }), now)).toBeNull();
  });

  it('writes kind reminders without emoji', () => {
    for (const day of ['2026-11-01', '2026-11-02', '2026-11-03']) {
      const p = reminderPayload(day);
      expect(p.title.length).toBeGreaterThan(0);
      expect(`${p.title}${p.body}`).not.toMatch(/\p{Extended_Pictographic}|—/u);
      expect(p.url.startsWith('/')).toBe(true);
    }
  });
});

describe('push input validation', () => {
  it('validates time, day and time zone', () => {
    expect(isValidTime('08:00')).toBe(true);
    expect(isValidTime('23:59')).toBe(true);
    for (const bad of ['24:00', '8:00', '08:60', '08:00:00', '']) expect(isValidTime(bad)).toBe(false);
    expect(isValidDay('2026-11-02')).toBe(true);
    expect(isValidDay('2026-02-30')).toBe(false);
    expect(isValidDay('2026-11-2')).toBe(false);
    expect(isValidTimeZone('Europe/Paris')).toBe(true);
    expect(isValidTimeZone('UTC')).toBe(true);
    expect(isValidTimeZone('Not/AZone')).toBe(false);
    expect(isValidTimeZone("Europe/Paris'; DROP TABLE x")).toBe(false);
  });

  it('accepts only browser push services as endpoints', () => {
    expect(isPushEndpoint('https://fcm.googleapis.com/fcm/send/abc')).toBe(true);
    expect(isPushEndpoint('https://updates.push.services.mozilla.com/wpush/v2/abc')).toBe(true);
    expect(isPushEndpoint('https://web.push.apple.com/abc')).toBe(true);
    expect(isPushEndpoint('https://wns2-par02p.notify.windows.com/w/?token=abc')).toBe(true);
    expect(isPushEndpoint('http://fcm.googleapis.com/fcm/send/abc')).toBe(false);
    expect(isPushEndpoint('https://evil.example/fcm.googleapis.com')).toBe(false);
    expect(isPushEndpoint('https://fcm.googleapis.com.evil.example/x')).toBe(false);
    expect(isPushEndpoint('https://localhost/x')).toBe(false);
  });

  it('parses a subscribe body and rejects bad ones', () => {
    const good = {
      subscription: { endpoint: 'https://fcm.googleapis.com/fcm/send/abc', keys: { p256dh: 'BNcRdreALRFXTkOOUHK1EtK2wtaz5Ry4YfYCA_0QTpQtUbVlUls0VJXg7A8u-Ts1XbjhazAkj7I99e8QcYP7DkM', auth: 'tBHItJI5svbpez7KI4CCXg' } },
      time: '18:30',
      tz: 'Europe/Paris'
    };
    expect(subscribeSchema.safeParse(good).success).toBe(true);
    expect(subscribeSchema.safeParse({ ...good, time: '7pm' }).success).toBe(false);
    expect(subscribeSchema.safeParse({ ...good, tz: 'Nowhere/Land' }).success).toBe(false);
    expect(subscribeSchema.safeParse({ ...good, subscription: { ...good.subscription, keys: { p256dh: 'x', auth: 'y' } } }).success).toBe(false);
    expect(activeSchema.safeParse({ endpoint: good.subscription.endpoint, day: '2026-11-02' }).success).toBe(true);
    expect(activeSchema.safeParse({ endpoint: good.subscription.endpoint, day: 'today' }).success).toBe(false);
  });

  it('keeps the migration file and the runtime schema identical', () => {
    const file = readFileSync(new URL('../db/migrations/001_push.sql', import.meta.url), 'utf8');
    const norm = (s: string) => s.replace(/--.*$/gm, '').replace(/\s+/g, ' ').replace(/;/g, '').trim();
    expect(norm(file)).toBe(norm(PUSH_SCHEMA_SQL));
  });
});

describe('client helpers', () => {
  it('decodes a base64url VAPID key', () => {
    expect(Array.from(base64UrlToUint8Array('AQID_-8'))).toEqual([1, 2, 3, 255, 239]);
  });
});
