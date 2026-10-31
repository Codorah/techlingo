import { useTranslation } from 'react-i18next';
import { useRegisterSW } from 'virtual:pwa-register/react';

/** "New version" prompt (spec §5.18): the app never reloads under the user's feet. */
export function UpdatePrompt() {
  const { t } = useTranslation();
  const { needRefresh: [needRefresh, setNeedRefresh], updateServiceWorker } = useRegisterSW();
  if (!needRefresh) return null;
  return (
    <div role="status" className="fixed inset-x-4 bottom-[calc(env(safe-area-inset-bottom)+16px)] z-30 mx-auto flex max-w-md items-center gap-3 rounded-2xl bg-ink px-4 py-3 text-mist shadow-lg">
      <span className="flex-1 font-bold">{t('update.available')}</span>
      <button type="button" className="min-h-11 rounded-xl px-3 font-bold text-sky" onClick={() => setNeedRefresh(false)}>{t('common.close')}</button>
      <button type="button" className="min-h-11 rounded-xl bg-sky px-4 font-bold text-ink" onClick={() => void updateServiceWorker(true)}>{t('update.reload')}</button>
    </div>
  );
}
