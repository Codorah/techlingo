// Neon Postgres over HTTP (one short query per call, fits serverless functions).
import { neon, type NeonQueryFunction } from '@neondatabase/serverless';
import { HttpError } from './http.js';
import { PUSH_SCHEMA_SQL } from './schema.js';

export interface SubscriptionRow {
  endpoint: string;
  p256dh: string;
  auth: string;
  reminder_time: string;
  tz: string;
  last_active_day: string | null;
  last_sent_day: string | null;
}

let client: NeonQueryFunction<false, false> | null = null;
let schemaReady: Promise<void> | null = null;

function sql(): NeonQueryFunction<false, false> {
  const url = process.env.DATABASE_URL;
  if (!url) throw new HttpError(503, 'push_not_configured');
  client ??= neon(url);
  return client;
}

/** Creates the table on first use (same statement as db/migrations/001_push.sql). */
async function ready(): Promise<NeonQueryFunction<false, false>> {
  const q = sql();
  schemaReady ??= q.query(PUSH_SCHEMA_SQL).then(() => undefined, (err: unknown) => { schemaReady = null; throw err; });
  await schemaReady;
  return q;
}

export async function upsertSubscription(s: { endpoint: string; p256dh: string; auth: string; time: string; tz: string }) {
  const q = await ready();
  await q.query(
    `INSERT INTO push_subscriptions (endpoint, p256dh, auth, reminder_time, tz)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (endpoint) DO UPDATE
       SET p256dh = EXCLUDED.p256dh, auth = EXCLUDED.auth, reminder_time = EXCLUDED.reminder_time, tz = EXCLUDED.tz`,
    [s.endpoint, s.p256dh, s.auth, s.time, s.tz]
  );
}

export async function deleteSubscription(endpoint: string) {
  const q = await ready();
  await q.query('DELETE FROM push_subscriptions WHERE endpoint = $1', [endpoint]);
}

export async function markActive(endpoint: string, day: string) {
  const q = await ready();
  await q.query('UPDATE push_subscriptions SET last_active_day = $2 WHERE endpoint = $1', [endpoint, day]);
}

export async function allSubscriptions(): Promise<SubscriptionRow[]> {
  const q = await ready();
  return (await q.query(
    'SELECT endpoint, p256dh, auth, reminder_time, tz, last_active_day, last_sent_day FROM push_subscriptions'
  )) as SubscriptionRow[];
}

/** Atomically claims today's reminder so two overlapping runs never send it twice. */
export async function claimSend(endpoint: string, day: string): Promise<boolean> {
  const q = await ready();
  const rows = await q.query(
    `UPDATE push_subscriptions SET last_sent_day = $2
     WHERE endpoint = $1 AND last_sent_day IS DISTINCT FROM $2 AND last_active_day IS DISTINCT FROM $2
     RETURNING endpoint`,
    [endpoint, day]
  );
  return rows.length > 0;
}

/** Gives the reminder back after a temporary push failure, so the next run retries. */
export async function releaseSend(endpoint: string, day: string, previous: string | null) {
  const q = await ready();
  await q.query('UPDATE push_subscriptions SET last_sent_day = $3 WHERE endpoint = $1 AND last_sent_day = $2', [endpoint, day, previous]);
}
