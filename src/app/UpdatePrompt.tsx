import { Sparkles, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'wouter';
import { useRegisterSW } from 'virtual:pwa-register/react';

/** Screens holding unsaved in-memory state: an update waits until the user leaves them. */
const BUSY_ROUTES = [/^\/lesson\//, /^\/practice\/(?!$)/, /^\/career\/(q|pitch)/, /^\/spin/];
const CHECK_EVERY_MS = 30 * 60 * 1000;
const UPDATED_KEY = 'techlingo.justUpdated';

const remember = () => { try { localStorage.setItem(UPDATED_KEY, '1'); } catch { /* private mode */ } };
const consume = () => {
  try { const v = localStorage.getItem(UPDATED_KEY); localStorage.removeItem(UPDATED_KEY); return v === '1'; } catch { return false; }
};

/**
 * Keeps the installed app on the latest deployed version. A new version is applied
 * automatically (progress lives in IndexedDB, so a reload loses nothing), except in
 * the middle of a lesson or session, where it waits for the next navigation.
 * After the reload the user is told: a banner in the app, plus a system notification
 * when notifications are allowed.
 */
export function UpdatePrompt() {
  const { t } = useTranslation();
  const [location] = useLocation();
  const [notice, setNotice] = useState(false);
  const { needRefresh: [needRefresh], updateServiceWorker } = useRegisterSW({
    onRegisteredSW(_url, registration) {
      if (!registration) return;
      const check = () => { if (navigator.onLine) void registration.update().catch(() => {}); };
      setInterval(check, CHECK_EVERY_MS);
      document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') check(); });
    }
  });

  useEffect(() => {
    if (!consume()) return;
    setNotice(true);
    if ('Notification' in window && Notification.permission === 'granted' && 'serviceWorker' in navigator) {
      void navigator.serviceWorker.ready
        .then((reg) => reg.showNotification(t('update.doneTitle'), { body: t('update.done'), icon: '/icons/icon-192.png', badge: '/icons/icon-192.png', tag: 'techlingo-update', data: { url: '/' } }))
        .catch(() => {});
    }
    const timer = setTimeout(() => setNotice(false), 12_000);
    return () => clearTimeout(timer);
  }, [t]);

  useEffect(() => {
    if (needRefresh && !BUSY_ROUTES.some((r) => r.test(location))) { remember(); void updateServiceWorker(true); }
  }, [needRefresh, location, updateServiceWorker]);

  if (!notice) return null;
  return (
    <div role="status" className="fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-[calc(env(safe-area-inset-top)+10px)]">
      <p className="flex w-full max-w-[520px] items-center gap-3 rounded-2xl border-2 border-line bg-surface p-3 shadow-[0_3px_0_var(--color-line)]">
        <Sparkles size={22} className="flex-none text-[var(--accent)]" aria-hidden />
        <span className="min-w-0 flex-1">
          <span className="block font-extrabold">{t('update.doneTitle')}</span>
          <span className="block text-sm text-ink-2">{t('update.done')}</span>
        </span>
        <button type="button" onClick={() => setNotice(false)} aria-label={t('common.close')} className="grid h-11 w-11 flex-none place-items-center rounded-xl text-ink-2 active:scale-95">
          <X size={20} aria-hidden />
        </button>
      </p>
    </div>
  );
}
