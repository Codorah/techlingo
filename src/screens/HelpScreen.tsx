import { ChevronRight, ExternalLink, FileText, Mail, Shield } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';

const FAQ_KEYS = ['offline', 'install', 'backup', 'xp', 'speaking', 'privacy', 'content'] as const;

export function HelpScreen() {
  const { t } = useTranslation();
  return (
    <Screen title={t('help.title')} back="/settings">
      <p className="text-ink-2">{t('help.subtitle')}</p>

      <div className="mt-4 grid gap-2.5">
        {FAQ_KEYS.map((k) => (
          <details key={k} className="group rounded-2xl border-2 border-line bg-surface px-4 [&_summary::-webkit-details-marker]:hidden">
            <summary className="flex min-h-12 cursor-pointer list-none items-center gap-3 py-2.5 font-extrabold">
              <span className="min-w-0 flex-1 text-[15px] leading-snug">{t(`help.faq.${k}.q`)}</span>
              <ChevronRight size={20} className="text-ink-2 transition-transform group-open:rotate-90" aria-hidden />
            </summary>
            <p className="pb-4 text-sm leading-relaxed text-ink-2">{t(`help.faq.${k}.a`)}</p>
          </details>
        ))}
      </div>

      <Card className="mt-5 p-4">
        <h2 className="flex items-center gap-2 text-base font-extrabold"><Mail size={20} className="text-[var(--accent)]" aria-hidden />{t('help.contactTitle')}</h2>
        <p className="mt-1 text-sm text-ink-2">{t('help.contactText')}</p>
        <a href="mailto:services@codorah.com?subject=TechLingo%20-%20Support"
          className="mt-3 inline-flex min-h-12 max-w-full items-center gap-2 break-all rounded-xl bg-[var(--accent)] px-4 font-bold text-on-ocean shadow-[0_4px_0_var(--accent-press)] active:translate-y-1 active:shadow-none">
          <Mail size={18} aria-hidden />services@codorah.com
        </a>
      </Card>

      <Card className="mt-3 p-1">
        <a href="/decouvrir/" className="flex min-h-14 items-center gap-3 rounded-2xl px-3">
          <ExternalLink size={20} className="text-[var(--accent)]" aria-hidden />
          <span className="flex-1 font-bold">{t('help.about')}</span>
          <ChevronRight size={20} className="text-ink-2" aria-hidden />
        </a>
        <div className="mx-3 h-0.5 bg-line" />
        <a href="/legal/confidentialite.html" className="flex min-h-14 items-center gap-3 rounded-2xl px-3">
          <Shield size={20} className="text-[var(--accent)]" aria-hidden />
          <span className="flex-1 font-bold">{t('help.privacy')}</span>
          <ChevronRight size={20} className="text-ink-2" aria-hidden />
        </a>
        <div className="mx-3 h-0.5 bg-line" />
        <a href="/legal/conditions.html" className="flex min-h-14 items-center gap-3 rounded-2xl px-3">
          <FileText size={20} className="text-[var(--accent)]" aria-hidden />
          <span className="flex-1 font-bold">{t('settings.terms')}</span>
          <ChevronRight size={20} className="text-ink-2" aria-hidden />
        </a>
      </Card>
    </Screen>
  );
}

