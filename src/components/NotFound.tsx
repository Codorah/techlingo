import { useTranslation } from 'react-i18next';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/Button';

/** Shown when a path, theme or step does not exist for the user's roles; never a dead end. */
export function NotFound() {
  const { t } = useTranslation();
  const [, navigate] = useLocation();
  return (
    <main className="mx-auto flex min-h-dvh max-w-[640px] flex-col items-center justify-center gap-6 p-6 text-center">
      <p className="text-ink-2">{t('path.notFound')}</p>
      <Button block={false} onClick={() => navigate('/practice', { replace: true })}>{t('path.backToPaths')}</Button>
    </main>
  );
}
