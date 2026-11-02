// POST /api/push/active {endpoint, day "YYYY-MM-DD"} : the learner studied today, skip today's reminder.
import { markActive } from '../_lib/db.js';
import { handle, json, readBody } from '../_lib/http.js';
import { activeSchema } from '../_lib/validation.js';

export const POST = handle(async (request) => {
  const { endpoint, day } = await readBody(request, activeSchema);
  await markActive(endpoint, day);
  return json({ ok: true });
});
