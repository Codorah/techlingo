// Keep in sync with db/migrations/001_push.sql (tests/push.test.ts checks it).
// Only what the reminder needs: no IP address, no user agent, no account.
export const PUSH_SCHEMA_SQL = `CREATE TABLE IF NOT EXISTS push_subscriptions (
  endpoint TEXT PRIMARY KEY,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  reminder_time TEXT NOT NULL,
  tz TEXT NOT NULL,
  last_active_day TEXT,
  last_sent_day TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
)`;
