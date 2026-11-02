// GET|POST /api/push/send, called every 30 minutes by .github/workflows/reminders.yml.
// Protected by `Authorization: Bearer ${CRON_SECRET}`. Sends today's reminder to every learner
// whose chosen time has passed in their own time zone, who has not studied today and has not
// already received it, then deletes subscriptions the push service reports as gone (404/410).
import { createHash, timingSafeEqual } from 'node:crypto';
import webpush from 'web-push';
import { allSubscriptions, claimSend, deleteSubscription, releaseSend, type SubscriptionRow } from '../_lib/db.js';
import { handle, HttpError, json } from '../_lib/http.js';
import { dueDay, reminderPayload } from '../_lib/schedule.js';

const CONCURRENCY = 20;
const TTL_SECONDS = 3 * 60 * 60;

function authorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) throw new HttpError(503, 'push_not_configured');
  const given = request.headers.get('authorization') ?? '';
  const digest = (s: string) => createHash('sha256').update(s).digest();
  return timingSafeEqual(digest(given), digest(`Bearer ${secret}`));
}

function configureVapid() {
  const { VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY } = process.env;
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) throw new HttpError(503, 'push_not_configured');
  webpush.setVapidDetails(process.env.VAPID_SUBJECT || 'mailto:services@codorah.com', VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
}

type Outcome = 'sent' | 'removed' | 'failed' | 'skipped';

async function sendOne(sub: SubscriptionRow, day: string): Promise<Outcome> {
  if (!(await claimSend(sub.endpoint, day))) return 'skipped';
  try {
    await webpush.sendNotification(
      { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
      JSON.stringify(reminderPayload(day)),
      { TTL: TTL_SECONDS, urgency: 'normal', topic: 'techlingo-daily' }
    );
    return 'sent';
  } catch (err) {
    const status = (err as { statusCode?: number }).statusCode;
    if (status === 404 || status === 410) {
      await deleteSubscription(sub.endpoint);
      return 'removed';
    }
    await releaseSend(sub.endpoint, day, sub.last_sent_day);
    return 'failed';
  }
}

async function run(request: Request): Promise<Response> {
  if (!authorized(request)) return json({ error: 'unauthorized' }, 401);
  configureVapid();
  const now = new Date();
  const due = (await allSubscriptions())
    .map((sub) => ({ sub, day: dueDay(sub, now) }))
    .filter((x): x is { sub: SubscriptionRow; day: string } => x.day !== null);

  const counts: Record<Outcome, number> = { sent: 0, removed: 0, failed: 0, skipped: 0 };
  for (let i = 0; i < due.length; i += CONCURRENCY) {
    const outcomes = await Promise.all(due.slice(i, i + CONCURRENCY).map(({ sub, day }) => sendOne(sub, day).catch((): Outcome => 'failed')));
    for (const o of outcomes) counts[o]++;
  }
  return json({ due: due.length, ...counts });
}

export const GET = handle(run);
export const POST = handle(run);
