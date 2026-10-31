import { CheckCircle2, Download, EllipsisVertical, Feather, Lock, Plus, Share, Smartphone, WifiOff } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';
import { canPromptInstall, isIOS, isStandalone, onInstallChange, promptInstall } from '@/lib/install';

const DISMISS_KEY = 'techlingo.installDismissedAt';
const APK_URL = '/download/techlingo-android.apk';
const isAndroid = () => /android/i.test(navigator.userAgent);
const isNativeShell = () => !!(window as { Capacitor?: unknown }).Capacitor;

/** Install card shown on the first web visit (PWA prompt, iPhone steps, optional APK). */
export function InstallSheet() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [, force] = useState(0);
  const [apk, setApk] = useState(false);

  useEffect(() => {
    if (isStandalone() || isNativeShell()) return;
    try { if (Date.now() - Number(localStorage.getItem(DISMISS_KEY) ?? 0) < 3 * 86_400_000) return; } catch { /* storage unavailable */ }
    if (isAndroid()) {
      fetch(APK_URL, { method: 'HEAD', cache: 'no-store' })
        .then((r) => setApk(r.ok && !(r.headers.get('content-type') ?? '').includes('text/html')))
        .catch(() => setApk(false));
    }
    const timer = setTimeout(() => setOpen(true), 2500);
    const off = onInstallChange(() => force((n) => n + 1));
    return () => { clearTimeout(timer); off(); };
  }, []);

  const close = () => {
    try { localStorage.setItem(DISMISS_KEY, String(Date.now())); } catch { /* storage unavailable */ }
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
      <div className="fixed inset-0 z-40 animate-[enter_.2s_ease-out] bg-ink/40" onClick={close} aria-hidden />
      <div role="dialog" aria-modal="true" aria-labelledby="install-title"
        className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-[520px] animate-[sheet_.3s_var(--ease-out-quart)] rounded-t-3xl bg-surface px-5 pb-[calc(env(safe-area-inset-bottom)+18px)] pt-3 shadow-[0_-8px_32px_rgba(15,34,56,0.18)]">
        <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-line" />
        <div className="flex items-center gap-3.5">
          <img src="/icons/icon-192.png" width={60} height={60} alt="" className="rounded-2xl" />
          <div>
            <h2 id="install-title" className="text-xl font-black">{t('install.title')}</h2>
            <p className="text-sm text-ink-2">{t('install.text')}</p>
          </div>
        </div>
        <div className="my-4 flex flex-wrap gap-2">
          {[{ Icon: Feather, k: 'light' }, { Icon: WifiOff, k: 'offline' }, { Icon: Lock, k: 'private' }].map(({ Icon, k }) => (
            <span key={k} className="inline-flex items-center gap-1.5 rounded-full bg-mist px-3 py-1.5 text-sm font-bold text-ocean"><Icon size={16} aria-hidden />{t(`install.perks.${k}`)}</span>
          ))}
        </div>
        {canPromptInstall() ? (
          <Button icon={<Download size={20} aria-hidden />} onClick={() => void promptInstall().then(close)}>{t('install.cta')}</Button>
        ) : (
          <ol className="mb-2">
            {steps.map(({ text, Icon }, i) => (
              <li key={text} className={`flex min-h-12 items-center gap-3 ${i ? 'border-t-2 border-line' : ''}`}>
                <span className="grid h-7 w-7 flex-none place-items-center rounded-full bg-ocean text-sm font-bold text-white">{i + 1}</span>
                <span className="flex-1">{text}</span>
                <Icon size={22} className="text-ocean" aria-hidden />
              </li>
            ))}
          </ol>
        )}
        {apk && (
          <>
            <a href={APK_URL} download className="mt-2 flex min-h-[52px] items-center justify-center gap-2 rounded-2xl border-2 border-line font-bold text-ocean">
              <Smartphone size={20} aria-hidden />{t('install.apk')}
            </a>
            <p className="mt-1.5 text-center text-xs text-ink-2">{t('install.apkNote')}</p>
          </>
        )}
        <button type="button" onClick={close} className="mt-2 min-h-11 w-full font-bold text-ocean">{t('install.later')}</button>
      </div>
    </>
  );
}
