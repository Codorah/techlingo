import { Briefcase, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'wouter';
import { situationNodes, situationStates } from '@/learning/situations';
import { useSituations } from '@/screens/situations/useSituations';

/** Entry to the hand-written path, with its next step. Hidden when the domain has none yet. */
export function SituationsCard() {
  const { t } = useTranslation();
  const { path, progress, domain } = useSituations();
  if (!path) return null;
  const nodes = situationNodes(path);
  const states = situationStates(nodes, progress);
  const done = nodes.filter((n) => states.get(n.id) === 'done').length;
  const next = nodes.find((n) => states.get(n.id) === 'current');
  const nextTitle = !next ? null : next.kind === 'guide' ? path.units[next.unitIndex]!.title_fr : path.units[next.unitIndex]!.lessons[next.lessonIndex]!.title_fr;
  return (
    <Link href="/situations" className="relative flex items-center gap-4 overflow-hidden rounded-[var(--radius-card)] bg-[var(--accent)] p-5 text-on-ocean shadow-[0_4px_0_var(--accent-press)] active:translate-y-1 active:shadow-none">
      <Briefcase size={110} className="absolute -right-4 -top-4 opacity-15" aria-hidden />
      <div className="relative min-w-0 flex-1">
        <p className="text-sm font-bold opacity-90">{t('situations.title')} · {done}/{nodes.length}</p>
        <p className="mt-1 text-lg font-black leading-snug">{path.title_fr}</p>
        <p className="mt-1 text-sm opacity-90">{nextTitle ? t('situations.next', { title: nextTitle }) : t('situations.finished')}</p>
        {done === 0 && <p className="mt-2 text-sm opacity-90">{domain === 'marketing' ? t('situations.cardTextMarketing') : t('situations.cardText')}</p>}
      </div>
      <ChevronRight size={24} className="relative flex-none" aria-hidden />
    </Link>
  );
}
