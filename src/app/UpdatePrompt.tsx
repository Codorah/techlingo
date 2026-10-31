import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useRegisterSW } from 'virtual:pwa-register/react';

/** Screens holding unsaved in-memory state: an update waits until the user leaves them. */
const BUSY_ROUTES = [/^\/lesson\//, /^\/practice\/(?!$)/, /^\/career\/(q|pitch)/, /^\/spin/];
const CHECK_EVERY_MS = 30 * 60 * 1000;

/**
 * Keeps the installed app on the latest deployed version. A new version is applied
 * automatically (progress lives in IndexedDB, so a reload loses nothing), except in
 * the middle of a lesson or session, where it waits for the next navigation.
 */
export function UpdatePrompt() {
  const [location] = useLocation();
  const { needRefresh: [needRefresh], updateServiceWorker } = useRegisterSW({
    onRegisteredSW(_url, registration) {
      if (!registration) return;
      const check = () => { if (navigator.onLine) void registration.update().catch(() => {}); };
      setInterval(check, CHECK_EVERY_MS);
      document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') check(); });
    }
  });

  useEffect(() => {
    if (needRefresh && !BUSY_ROUTES.some((r) => r.test(location))) void updateServiceWorker(true);
  }, [needRefresh, location, updateServiceWorker]);

  return null;
}
