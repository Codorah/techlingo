// POST /api/push/subscribe {subscription, time "HH:MM", tz} : creates or updates the reminder.
import { upsertSubscription } from '../_lib/db.js';
import { handle, json, readBody } from '../_lib/http.js';
import { subscribeSchema } from '../_lib/validation.js';

export const POST = handle(async (request) => {
  const { subscription, time, tz } = await readBody(request, subscribeSchema);
  await upsertSubscription({ endpoint: subscription.endpoint, p256dh: subscription.keys.p256dh, auth: subscription.keys.auth, time, tz });
  return json({ ok: true });
});
