import { ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'wouter';
import { DynamicIcon } from '@/components/ui/DynamicIcon';
import type { Category } from '@/content/schema';
import { type PathProgress, type PathTheme, themeProgress } from '@/learning/path';

/** One theme of the path: icon, name, units, progress. Links to its Duolingo-style map. */
export function ThemeRow({ theme, category, progress, mastered }: { theme: PathTheme; category?: Category; progress: PathProgress; mastered?: number }) {
  const { t } = useTranslation();
  const p = themeProgress(theme, progress);
  const done = p.done === p.total;
  return (
    <Link href={`/path/${theme.category}`}
      className="flex min-h-[76px] items-center gap-3.5 rounded-[var(--radius-card)] border-2 border-line bg-surface p-3.5 shadow-[0_4px_0_var(--color-line)] active:translate-y-1 active:shadow-none">
      <span className={`grid h-12 w-12 flex-none place-items-center rounded-2xl ${done ? 'bg-gold text-white' : 'bg-mist text-[var(--accent,var(--color-ocean))]'}`}>
        <DynamicIcon name={category?.icon ?? 'Sparkles'} size={24} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-baseline justify-between gap-2">
          <span className="truncate font-extrabold">{category?.name_fr ?? theme.category}</span>
          <span className="flex-none text-xs font-bold text-ink-2">{t('path.units', { count: theme.units.length })}</span>
        </span>
        <span className="mt-1.5 block h-2 overflow-hidden rounded-full bg-line" aria-hidden>
          <span className={`block h-full rounded-full ${done ? 'bg-gold' : 'bg-[var(--accent,var(--color-ocean))]'}`} style={{ width: `${Math.max(p.ratio * 100, p.done ? 6 : 0)}%` }} />
        </span>
        <span className="mt-1 block text-xs text-ink-2">
          {t('path.progress', { done: p.done, total: p.total })}{mastered != null ? ` · ${t('path.mastered', { count: mastered, total: theme.termIds.length })}` : ''}
        </span>
      </span>
      <ChevronRight size={20} className="flex-none text-ink-2" aria-hidden />
    </Link>
  );
}
