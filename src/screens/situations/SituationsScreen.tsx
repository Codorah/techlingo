import { BookOpen, Briefcase, Check, MessagesSquare, Mic } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'wouter';
import { PathMap } from '@/components/PathMap';
import { situationNodes, situationStates } from '@/learning/situations';
import { accentStyle } from '@/screens/path/ThemeScreen';
import { useSituations } from './useSituations';

/** Duolingo-style map of the hand-written path: one unit per work situation. */
export function SituationsScreen() {
  const { t } = useTranslation();
  const { path, missing, progress, domain } = useSituations();

  if (missing) return <main className="grid min-h-dvh place-items-center p-6 text-center text-ink-2">{t('situations.soon')}</main>;
  if (!path) return <main className="grid min-h-dvh place-items-center text-ink-2">{t('common.loading')}</main>;

  const nodes = situationNodes(path);
  const states = situationStates(nodes, progress);
  const done = nodes.filter((n) => states.get(n.id) === 'done').length;
  const allDone = done === nodes.length;

  return (
    <div style={accentStyle(domain)}>
      <PathMap title={path.title_fr} icon={<Briefcase size={20} aria-hidden />} back="/practice" done={done} total={nodes.length}
        units={path.units.map((unit, u) => ({
          id: unit.id,
          kicker: t('path.unit', { n: u + 1 }),
          title: unit.title_fr,
          subtitle: unit.situation_fr,
          nodes: nodes.filter((n) => n.unitIndex === u).map((n) => {
            const state = states.get(n.id)!;
            const lesson = n.kind === 'lesson' ? unit.lessons[n.lessonIndex]! : null;
            return {
              id: n.id, state, href: `/situations/${encodeURIComponent(n.id)}`,
              label: lesson ? lesson.title_fr : t('situations.guide'),
              Icon: n.kind === 'guide' ? BookOpen : state === 'done' ? Check : MessagesSquare
            };
          })
        }))}
        footer={
          <Link href="/career" className={`mx-auto mt-4 flex max-w-sm flex-col items-center rounded-2xl border-2 p-5 text-center ${allDone ? 'border-gold bg-sun' : 'border-line bg-surface'}`}>
            <Mic size={36} className={allDone ? 'text-sun-ink' : 'text-[var(--accent)]'} aria-hidden />
            <p className="mt-2 font-black">{t('path.interview')}</p>
            <p className="mt-1 text-sm text-ink-2">{t('path.interviewText')}</p>
          </Link>
        } />
    </div>
  );
}
