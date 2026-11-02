import { CheckCircle2, Download, EllipsisVertical, Feather, Lock, Plus, Share, WifiOff } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';
import { canPromptInstall, isIOS, isStandalone, onInstallChange, promptInstall } from '@/lib/install';

const SHOWN_KEY = 'techlingo.install.shown';
const LATER_KEY = 'techlingo.install.later';
const FIRST_KEY = 'techlingo.install.first';
const MAX_SHOWN = 3; // first visit + two offers after a finished step
const MAX_LATER = 2;
const isAndroid = () => /android/i.test(navigator.userAgent);
const isNativeShell = () => !!(window as { Capacitor?: unknown }).Capacitor;

const readCount = (key: string) => { try { return Number(localStorage.getItem(key)) || 0; } catch { return MAX_SHOWN; } };
const bump = (key: string) => { try { localStorage.setItem(key, String(readCount(key) + 1)); } catch { /* storage unavailable */ } };

/** Open the install bottom sheet on demand (settings button). Ignores the automatic-offer limits. */
export function openInstallSheet() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('techlingo:open-install'));
  }
}

/** Tells the sheet a step was just completed: the one moment it may offer itself on its own. */
export function notifyStepCompleted() {
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('techlingo:step-completed'));
}

/** Install sheet: opens on the first visit, then after a finished step (3 offers in total), never after "Plus tard" twice. */
export function InstallSheet() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [, force] = useState(0);
  const offeredThisSession = useRef(false);

  useEffect(() => {
    const manual = () => setOpen(true);
    const auto = () => {
      if (offeredThisSession.current || isStandalone() || isNativeShell()) return;
      if (readCount(SHOWN_KEY) >= MAX_SHOWN || readCount(LATER_KEY) >= MAX_LATER) return;
      offeredThisSession.current = true;
      bump(SHOWN_KEY);
      // Let the result screen settle before the sheet slides in.
      window.setTimeout(() => setOpen(true), 1500);
    };
    // First visit: this component only mounts once onboarding is over, so this is the first Home display.
    let firstTimer = 0;
    let seenFirst = true;
    try { seenFirst = localStorage.getItem(FIRST_KEY) === '1'; } catch { /* storage unavailable: never auto-open */ }
    if (!seenFirst && !isStandalone() && !isNativeShell()) {
      try { localStorage.setItem(FIRST_KEY, '1'); } catch { /* ignore */ }
      offeredThisSession.current = true;
      bump(SHOWN_KEY);
      firstTimer = window.setTimeout(() => setOpen(true), 1500);
    }
    window.addEventListener('techlingo:open-install', manual);
    window.addEventListener('techlingo:step-completed', auto);
    const off = onInstallChange(() => force((n) => n + 1));
    return () => {
      window.clearTimeout(firstTimer);
      off();
      window.removeEventListener('techlingo:open-install', manual);
      window.removeEventListener('techlingo:step-completed', auto);
    };
  }, []);

  const close = (later = true) => {
    if (later) bump(LATER_KEY);
    setOpen(false);
  };

  if (!open || isStandalone()) return null;

  const steps = isIOS()
    ? [{ text: t('install.ios.share'), Icon: Share }, { text: t('install.ios.add'), Icon: Plus }, { text: t('install.ios.confirm'), Icon: CheckCircle2 }]
    : isAndroid()
      ? [{ text: t('install.android.menu'), Icon: EllipsisVertical }, { text: t('install.android.install'), Icon: Download }]
      : [{ text: t('install.desktop.icon'), Icon: Download }, { text: t('install.desktop.confirm'), Icon: CheckCircle2 }];

  return (
    <>
      <div className="fixed inset-0 z-50 animate-[enter_.2s_ease-out] bg-ink/40" onClick={() => close()} aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="install-title"
        className="fixed inset-x-0 bottom-0 z-50 mx-auto max-h-[85dvh] max-w-[520px] animate-[sheet_.3s_var(--ease-out-quart)] overflow-y-auto overscroll-contain rounded-t-3xl bg-surface px-5 pb-[calc(env(safe-area-inset-bottom)+14px)] pt-3 shadow-[0_-8px_32px_rgba(15,34,56,0.22)]"
      >
        <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-line" />
        <div className="flex items-center gap-3.5">
          <img src="/icons/icon-192.png" width={48} height={48} alt="" className="flex-none rounded-xl shadow-xs" />
          <div>
            <h2 id="install-title" className="text-xl font-black">{t('install.title')}</h2>
            <p className="text-sm text-ink-2">{t('install.text')}</p>
          </div>
        </div>

        <div className="my-3 flex flex-wrap gap-1.5">
          {[{ Icon: Feather, k: 'light' }, { Icon: WifiOff, k: 'offline' }, { Icon: Lock, k: 'private' }].map(({ Icon, k }) => (
            <span key={k} className="inline-flex items-center gap-1.5 rounded-full bg-mist px-2.5 py-1 text-sm font-bold text-[var(--accent)]">
              <Icon size={16} aria-hidden />{t(`install.perks.${k}`)}
            </span>
          ))}
        </div>

        {canPromptInstall() ? (
          <Button icon={<Download size={20} aria-hidden />} onClick={() => void promptInstall().then(() => close(false))}>
            {t('install.cta')}
          </Button>
        ) : (
          <ol className="mb-2">
            {steps.map(({ text, Icon }, i) => (
              <li key={text} className={`flex min-h-12 items-center gap-3 ${i ? 'border-t-2 border-line' : ''}`}>
                <span className="grid h-7 w-7 flex-none place-items-center rounded-full bg-[var(--accent)] text-sm font-bold text-on-ocean">
                  {i + 1}
                </span>
                <span className="flex-1 font-semibold text-sm">{text}</span>
                <Icon size={22} className="text-[var(--accent)]" aria-hidden />
              </li>
            ))}
          </ol>
        )}

        <button type="button" onClick={() => close()} className="mt-1 min-h-11 w-full font-bold text-[var(--accent)]">
          {t('install.later')}
        </button>
      </div>
    </>
  );
}
