/** Local daily reminders using standard Web Notifications API (0 external dependency, 100% offline). */

const REMINDER_PREF_KEY = 'tl_reminder_time'; // e.g. "18:30"
const LAST_SENT_KEY = 'tl_reminder_last_sent'; // e.g. "2026-11-01"

export type NotificationStatus = 'default' | 'granted' | 'denied' | 'unsupported';

export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function notificationStatus(): NotificationStatus {
  if (!isNotificationSupported()) return 'unsupported';
  return Notification.permission as NotificationStatus;
}

export function getNotificationPermission(): NotificationPermission {
  if (!isNotificationSupported()) return 'denied';
  return Notification.permission;
}

export async function requestNotificationPermission(): Promise<NotificationStatus> {
  if (!isNotificationSupported()) return 'unsupported';
  if (Notification.permission === 'granted') return 'granted';
  try {
    const res = await Notification.requestPermission();
    return res as NotificationStatus;
  } catch {
    return 'denied';
  }
}

export function getSavedReminderTime(): string | null {
  try {
    return localStorage.getItem(REMINDER_PREF_KEY) || '18:30';
  } catch {
    return '18:30';
  }
}

export function setSavedReminderTime(time: string | null): void {
  try {
    if (!time) localStorage.removeItem(REMINDER_PREF_KEY);
    else localStorage.setItem(REMINDER_PREF_KEY, time);
  } catch {
    // Ignore storage errors
  }
}

export function setNotificationsEnabled(enabled: boolean): void {
  try {
    if (!enabled) localStorage.removeItem(REMINDER_PREF_KEY);
    else localStorage.setItem(REMINDER_PREF_KEY, '18:30');
  } catch {
    // Ignore storage errors
  }
}

export function notificationsEnabled(): boolean {
  return isNotificationSupported() && Notification.permission === 'granted';
}

export async function showLocalNotification(title: string, body: string, url = '/'): Promise<boolean> {
  if (!notificationsEnabled()) return false;
  const options = { body, icon: '/icons/icon-192.png', badge: '/icons/icon-192.png', tag: 'techlingo-daily', data: { url } };
  // Android Chrome forbids `new Notification()` in a page: notifications must go through the
  // service worker (public/sw-notify.js opens the app on tap). The constructor is the desktop fallback.
  try {
    const reg = 'serviceWorker' in navigator ? await navigator.serviceWorker.getRegistration() : undefined;
    if (reg) { await reg.showNotification(title, options); return true; }
  } catch { /* fall back below */ }
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

/** Checks once per session if the daily reminder time has passed today without study, and fires a gentle local notification. */
export async function checkDailyReminder(opts: {
  reminderTime: string | null;
  studiedToday: boolean;
  today: string;
  title: string;
  body: string;
  url?: string;
}) {
  if (!notificationsEnabled() || !opts.reminderTime || opts.studiedToday) return false;
  try {
    if (localStorage.getItem(LAST_SENT_KEY) === opts.today) return false;
    const parts = opts.reminderTime.split(':').map((x) => Number.parseInt(x, 10));
    const hh = parts[0];
    const mm = parts[1];
    if (hh == null || mm == null || Number.isNaN(hh) || Number.isNaN(mm)) return false;
    const now = new Date();
    if (now.getHours() * 60 + now.getMinutes() < hh * 60 + mm) return false;
    const ok = await showLocalNotification(opts.title, opts.body, opts.url ?? '/');
    if (ok) localStorage.setItem(LAST_SENT_KEY, opts.today);
    return ok;
  } catch {
    return false;
  }
}
