// Captures the browser's install prompt so we can offer it at a good moment
// (end of the first lesson, spec §5.1.7) instead of on arrival.
interface InstallPromptEvent extends Event { prompt(): Promise<void>; userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }> }

let deferred: InstallPromptEvent | null = null;
const listeners = new Set<() => void>();

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferred = e as InstallPromptEvent; listeners.forEach((l) => l()); });
  window.addEventListener('appinstalled', () => { deferred = null; listeners.forEach((l) => l()); });
}

export const isStandalone = () => matchMedia('(display-mode: standalone)').matches || (navigator as { standalone?: boolean }).standalone === true;
export const canPromptInstall = () => !!deferred && !isStandalone();
export const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

export async function promptInstall(): Promise<boolean> {
  if (!deferred) return false;
  await deferred.prompt();
  const { outcome } = await deferred.userChoice;
  deferred = null;
  return outcome === 'accepted';
}

export function onInstallChange(fn: () => void) { listeners.add(fn); return () => listeners.delete(fn); }
