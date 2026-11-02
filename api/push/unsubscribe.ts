// POST /api/push/unsubscribe {endpoint} : turning reminders off deletes the row.
import { deleteSubscription } from '../_lib/db.js';
import { handle, json, readBody } from '../_lib/http.js';
import { unsubscribeSchema } from '../_lib/validation.js';

export const POST = handle(async (request) => {
  const { endpoint } = await readBody(request, unsubscribeSchema);
  await deleteSubscription(endpoint);
  return json({ ok: true });
});
