-- Daily Web Push reminders (anonymous). The API also runs this statement on first use.
-- Stored per browser: the push endpoint and its two encryption keys, the chosen time,
-- the time zone, the last day the learner studied and the last day a reminder was sent.
CREATE TABLE IF NOT EXISTS push_subscriptions (
  endpoint TEXT PRIMARY KEY,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  reminder_time TEXT NOT NULL,
  tz TEXT NOT NULL,
  last_active_day TEXT,
  last_sent_day TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
