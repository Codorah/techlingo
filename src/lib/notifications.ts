/**
 * Daily reminders.
 * - Web Push (when VITE_VAPID_PUBLIC_KEY is set and the API answers): the server sends the reminder
 *   at the learner's time even when the app is closed. Anonymous, see api/push and docs/push-setup.md.
 * - Fallback, silent: a local notification while the app is open in the background.
 * The single source of truth for the time is profile.reminderTime (null = reminders off).
 */
import { localDay } from '@/learning/streak';

const LAST_SENT_KEY = 'tl_reminder_last_sent'; // e.g. "2026-11-01"
const PUSH_KEY = 'tl_push_subscribed'; // "1" once the server has the subscription
const ACTIVE_KEY = 'tl_push_active_day'; // last day reported to the server as studied
const SYNC_KEY = 'tl_push_synced_day'; // last day the subscription was refreshed
const SW_TIMEOUT_MS = 3000;
const SESSION_START = Date.now();

export type NotificationStatus = 'default' | 'granted' | 'denied' | 'unsupported';

function storageGet(key: string): string | null {
  try { return typeof localStorage === 'undefined' ? null : localStorage.getItem(key); } catch { return null; }
}
function storageSet(key: string, value: string | null): void {
  try {
    if (typeof localStorage === 'undefined') return;
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch { /* storage unavailable */ }
}

export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function notificationStatus(): NotificationStatus {
  if (!isNotificationSupported()) return 'unsupported';
  return Notification.permission as NotificationStatus;
}

export async function requestNotificationPermission(): Promise<NotificationStatus> {
  if (!isNotificationSupported()) return 'unsupported';
  if (Notification.permission === 'granted') return 'granted';
  try {
    return (await Notification.requestPermission()) as NotificationStatus;
  } catch {
    return 'denied';
  }
}

function permissionGranted(): boolean {
  return isNotificationSupported() && Notification.permission === 'granted';
}

/** Reminders are on when the browser allows notifications AND the learner chose a time. */
export function notificationsEnabled(reminderTime: string | null | undefined): boolean {
  return permissionGranted() && !!reminderTime;
}

/** The active service worker, or undefined after a short wait (first load, dev server, old browser). */
async function swRegistration(): Promise<ServiceWorkerRegistration | undefined> {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<undefined>((resolve) => { timer = setTimeout(() => resolve(undefined), SW_TIMEOUT_MS); });
  try {
    return await Promise.race([navigator.serviceWorker.ready, timeout]);
  } catch {
    return undefined;
  } finally {
    clearTimeout(timer);
  }
}

export async function showLocalNotification(title: string, body: string, url = '/'): Promise<boolean> {
  if (!permissionGranted()) return false;
  const options = { body, icon: '/icons/icon-192.png', badge: '/icons/icon-192.png', tag: 'techlingo-daily', data: { url } };
  // Android Chrome forbids `new Notification()` in a page: notifications must go through the
  // service worker (public/sw-notify.js opens the app on tap). The constructor is the desktop fallback.
  const reg = await swRegistration();
  if (reg) {
    try { await reg.showNotification(title, options); return true; } catch { /* fall back below */ }
  }
  try {
    const notif = new Notification(title, options);
    notif.onclick = () => {
      window.focus();
      if (url && window.location.pathname !== url) window.location.href = url;
      notif.close();
    };
    return true;
  } catch {
    return false;
  }
}

/**
 * In-app fallback: fires a gentle local notification once a day when the reminder time comes
 * without study while the app is open in the background (never while the learner is looking at it,
 * never for a time already past when the app was opened) and only when Web Push is not handling reminders.
 */
export async function checkDailyReminder(opts: {
  reminderTime: string | null;
  studiedToday: boolean;
  today: string;
  title: string;
  body: string;
  url?: string;
}) {
  if (!notificationsEnabled(opts.reminderTime) || opts.studiedToday || !opts.reminderTime) return false;
  if (typeof document !== 'undefined' && document.visibilityState === 'visible') return false;
  if (storageGet(PUSH_KEY) === '1') return false;
  if (storageGet(LAST_SENT_KEY) === opts.today) return false;
  const [hh, mm] = opts.reminderTime.split(':').map((x) => Number.parseInt(x, 10));
  if (hh == null || mm == null || Number.isNaN(hh) || Number.isNaN(mm)) return false;
  const now = new Date();
  const due = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hh, mm).getTime();
  // Opened after the reminder time: the learner already saw the app today, no need to ping them.
  if (now.getTime() < due || due < SESSION_START) return false;
  const ok = await showLocalNotification(opts.title, opts.body, opts.url ?? '/');
  if (ok) storageSet(LAST_SENT_KEY, opts.today);
  return ok;
}

// ---------------------------------------------------------------------------------------------
// Web Push

const VAPID_PUBLIC_KEY = (import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined)?.trim() ?? '';

/** Web Push is possible here: a key is configured and the browser has a push manager. */
export function isPushAvailable(): boolean {
  return !!VAPID_PUBLIC_KEY && typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window;
}

/** True once the server holds this browser's subscription (the local fallback then stays quiet). */
export function isPushSubscribed(): boolean {
  return storageGet(PUSH_KEY) === '1';
}

/** VAPID keys are base64url; the push manager wants raw bytes. */
export function base64UrlToUint8Array(value: string): Uint8Array<ArrayBuffer> {
  const padded = (value + '='.repeat((4 - (value.length % 4)) % 4)).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(padded);
  const out = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

async function postJson(path: string, body: unknown): Promise<boolean> {
  try {
    const res = await fetch(path, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body), keepalive: true });
    return res.ok;
  } catch {
    return false;
  }
}

async function pushSubscription(create: boolean): Promise<PushSubscription | null> {
  const reg = await swRegistration();
  if (!reg) return null;
  const existing = await reg.pushManager.getSubscription();
  if (!create) return existing;
  const key = base64UrlToUint8Array(VAPID_PUBLIC_KEY);
  if (existing) {
    if (sameKey(existing.options.applicationServerKey, key)) return existing;
    // Made with an older VAPID key: the server could not send to it, start over.
    await existing.unsubscribe().catch(() => false);
  }
  try {
    return await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: key });
  } catch {
    return null;
  }
}

function sameKey(current: ArrayBuffer | null, wanted: Uint8Array): boolean {
  if (!current) return true; // browser does not expose it: assume it matches
  const a = new Uint8Array(current);
  return a.length === wanted.length && a.every((b, i) => b === wanted[i]);
}

function timeZone(): string {
  try { return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'; } catch { return 'UTC'; }
}

/**
 * Subscribes this browser (or updates the time) on the server. Returns false, without throwing,
 * when push is not available here or the API fails: the in-app reminder then stays the fallback.
 */
export async function subscribePush(time: string): Promise<boolean> {
  try {
    if (!isPushAvailable() || !permissionGranted()) return false;
    const sub = await pushSubscription(true);
    if (!sub) { storageSet(PUSH_KEY, null); return false; }
    const ok = await postJson('/api/push/subscribe', { subscription: sub.toJSON(), time, tz: timeZone() });
    storageSet(PUSH_KEY, ok ? '1' : null);
    if (ok) storageSet(SYNC_KEY, localDay());
    return ok;
  } catch {
    storageSet(PUSH_KEY, null);
    return false;
  }
}

/** Turning reminders off deletes the subscription on the server and in the browser. */
export async function unsubscribePush(): Promise<void> {
  storageSet(PUSH_KEY, null);
  storageSet(ACTIVE_KEY, null);
  storageSet(SYNC_KEY, null);
  try {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;
    const sub = await pushSubscription(false);
    if (!sub) return;
    await postJson('/api/push/unsubscribe', { endpoint: sub.endpoint });
    await sub.unsubscribe();
  } catch { /* nothing else to clean up */ }
}

/**
 * Refreshes the subscription once a day while reminders are on, so a new time zone or a
 * subscription renewed by the browser reaches the server. Fire-and-forget.
 */
export function syncPushSubscription(reminderTime: string | null | undefined): void {
  if (!reminderTime || !isPushAvailable() || !permissionGranted()) return;
  if (storageGet(SYNC_KEY) === localDay()) return;
  void subscribePush(reminderTime);
}

/** Tells the server the learner studied today, so today's reminder is skipped. Never throws, never blocks. */
export function markPushActive(day = localDay()): void {
  if (!isPushSubscribed() || storageGet(ACTIVE_KEY) === day) return;
  void (async () => {
    try {
      const sub = await pushSubscription(false);
      if (!sub) return;
      if (await postJson('/api/push/active', { endpoint: sub.endpoint, day })) storageSet(ACTIVE_KEY, day);
    } catch { /* best effort */ }
  })();
}
