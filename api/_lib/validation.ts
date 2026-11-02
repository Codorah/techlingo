// Input schemas for the push endpoints. Pure, so tests can cover them.
import { z } from 'zod';
import { isValidDay, isValidTime, isValidTimeZone } from './schedule.js';

/**
 * The server POSTs to the stored endpoint once a day, so only real browser push services are
 * accepted (Chrome/Android/Samsung/Opera via FCM, Firefox, Edge/Windows, Safari/iOS).
 */
const PUSH_HOST_SUFFIXES = ['fcm.googleapis.com', 'android.googleapis.com', 'push.services.mozilla.com', 'notify.windows.com', 'push.apple.com'];

export function isPushEndpoint(value: string): boolean {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return false;
  }
  if (url.protocol !== 'https:' || url.username || url.password || (url.port && url.port !== '443')) return false;
  const host = url.hostname.toLowerCase();
  return PUSH_HOST_SUFFIXES.some((s) => host === s || host.endsWith(`.${s}`));
}

const base64url = (max: number) => z.string().min(8).max(max).regex(/^[A-Za-z0-9_-]+={0,2}$/);

export const endpointSchema = z.string().max(1024).refine(isPushEndpoint);
export const timeSchema = z.string().refine(isValidTime);
export const tzSchema = z.string().refine(isValidTimeZone);
export const daySchema = z.string().refine(isValidDay);

export const subscribeSchema = z.object({
  subscription: z.object({
    endpoint: endpointSchema,
    keys: z.object({ p256dh: base64url(200), auth: base64url(64) })
  }),
  time: timeSchema,
  tz: tzSchema
});

export const unsubscribeSchema = z.object({ endpoint: endpointSchema });

export const activeSchema = z.object({ endpoint: endpointSchema, day: daySchema });
