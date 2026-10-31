import { ChevronLeft } from 'lucide-react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'wouter';

/** Full-height mobile screen with safe-area padding and an optional back button. */
export function Screen({ title, back, children }: { title?: string; back?: string; children: ReactNode }) {
  const [, navigate] = useLocation();
  const { t } = useTranslation();
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[640px] flex-col px-5 pb-8 pt-[calc(env(safe-area-inset-top)+12px)]">
      {(title || back) && (
        <header className="mb-4 grid min-h-11 grid-cols-[44px_1fr_44px] items-center">
          {back ? (
            <button type="button" onClick={() => navigate(back)} aria-label={t('common.back')} className="grid h-11 w-11 place-items-center rounded-xl text-ink-2 active:bg-surface">
              <ChevronLeft size={26} aria-hidden />
            </button>
          ) : <span />}
          {title && <h1 className="text-center text-lg font-extrabold">{title}</h1>}
        </header>
      )}
      {children}
    </main>
  );
}
