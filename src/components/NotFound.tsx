import { ArrowLeft, Compass } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/Button';

/** Shown when a route, path, theme or step does not exist for the user's roles; never a dead end. */
export function NotFound() {
  const { t } = useTranslation();
  const [, navigate] = useLocation();

  return (
    <main className="mx-auto flex min-h-dvh max-w-[640px] flex-col items-center justify-center gap-6 px-6 py-12 text-center">
      <div className="grid h-20 w-20 place-items-center rounded-3xl bg-mist text-ocean ring-4 ring-sky/30">
        <Compass size={44} aria-hidden />
      </div>

      <div className="space-y-2">
        <h1 className="text-2xl font-black text-ink">Page introuvable</h1>
        <p className="max-w-xs text-sm text-ink-2">
          {t('path.notFound', 'Cette page ou ce parcours n’existe pas ou n’est plus disponible.')}
        </p>
      </div>

      <div className="flex w-full max-w-xs flex-col gap-2.5">
        <Button onClick={() => navigate('/', { replace: true })}>
          Retour à l'accueil
        </Button>
        <Button
          variant="secondary"
          icon={<ArrowLeft size={18} aria-hidden />}
          onClick={() => {
            if (window.history.length > 1) {
              window.history.back();
            } else {
              navigate('/');
            }
          }}
        >
          Page précédente
        </Button>
      </div>
    </main>
  );
}
