import { BookOpen, Check, RotateCcw, Star, Trophy } from 'lucide-react';
import type { CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'wouter';
import { PathMap } from '@/components/PathMap';
import { DynamicIcon } from '@/components/ui/DynamicIcon';
import { type NodeKind, nodeStates, themeProgress } from '@/learning/path';
import { usePath } from '@/lib/usePath';

const NODE_ICON: Record<NodeKind, typeof Star> = { course: BookOpen, recap: RotateCcw, lesson: Star, challenge: Trophy };

export const accentStyle = (domain: string): CSSProperties => (domain === 'marketing'
  ? { ['--accent' as string]: 'var(--color-coral)', ['--accent-press' as string]: 'var(--color-coral-press)', ['--accent-soft' as string]: 'var(--color-coral-soft)' }
  : { ['--accent' as string]: 'var(--color-ocean)', ['--accent-press' as string]: 'var(--color-ocean-press)', ['--accent-soft' as string]: 'var(--color-mist)' });

/** Duolingo-style map of one theme of the user's job. */
export function ThemeScreen() {
  const { t } = useTranslation();
  const { category } = useParams<{ category: string }>();
  const { content, themes, progress, domain } = usePath();
  const theme = themes.find((x) => x.category === category);

  if (content.loading) return <main className="grid min-h-dvh place-items-center text-ink-2">{t('common.loading')}</main>;
  if (!theme) return <main className="grid min-h-dvh place-items-center p-6 text-center text-ink-2">{t('path.notFound')}</main>;

  const cat = content.categories.get(theme.category);
  const states = nodeStates(theme, progress);
  const p = themeProgress(theme, progress);
  const finished = p.done === p.total;

  return (
    <div style={accentStyle(domain)}>
      <PathMap title={cat?.name_fr ?? theme.category} icon={<DynamicIcon name={cat?.icon ?? 'Sparkles'} size={20} />}
        back="/practice" done={p.done} total={p.total}
        units={theme.units.map((unit) => ({
          id: unit.id,
          kicker: `${t('path.unit', { n: unit.index + 1 })} · ${t(`levels.${unit.level}.name`)}`,
          title: unit.termIds.slice(0, 3).map((id) => content.byId.get(id)?.term_en).filter(Boolean).join(', '),
          nodes: unit.nodes.map((node) => {
            const state = states.get(node.id)!;
            return {
              id: node.id, state, href: `/path/${theme.category}/${node.id}`, label: t(`path.kind.${node.kind}`),
              Icon: state === 'done' && node.kind === 'lesson' ? Check : NODE_ICON[node.kind]
            };
          })
        }))}
        footer={
          <div className={`mx-auto mt-4 flex max-w-sm flex-col items-center rounded-2xl border-2 p-5 text-center ${finished ? 'border-gold bg-sun' : 'border-line bg-surface'}`}>
            <Trophy size={40} className={finished ? 'text-sun-ink' : 'text-ink-2'} aria-hidden />
            <p className="mt-2 font-black">{finished ? t('path.themeDone') : t('path.themeGoal')}</p>
            <p className="mt-1 text-sm text-ink-2">{t('path.themeWords', { count: theme.termIds.length })}</p>
          </div>
        } />
    </div>
  );
}
