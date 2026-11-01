import { BookOpen, Check, ChevronLeft, Lock, RotateCcw, Star, Trophy } from 'lucide-react';
import { type CSSProperties, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useParams } from 'wouter';
import { DynamicIcon } from '@/components/ui/DynamicIcon';
import { nodeStates, type NodeKind, type NodeState, themeProgress } from '@/learning/path';
import { usePath } from '@/lib/usePath';

const NODE_ICON: Record<NodeKind, typeof Star> = { course: BookOpen, recap: RotateCcw, lesson: Star, challenge: Trophy };
// Horizontal offsets (px) that give the path its winding shape.
const WIND = [0, 46, 70, 46, 0, -46, -70, -46];

export const accentStyle = (domain: string): CSSProperties => (domain === 'marketing'
  ? { ['--accent' as string]: 'var(--color-coral)', ['--accent-press' as string]: 'var(--color-coral-press)', ['--accent-soft' as string]: 'var(--color-coral-soft)' }
  : { ['--accent' as string]: 'var(--color-ocean)', ['--accent-press' as string]: 'var(--color-ocean-press)', ['--accent-soft' as string]: 'var(--color-mist)' });

/** Duolingo-style map of one theme: units stacked as banners, nodes along a winding path. */
export function ThemeScreen() {
  const { t } = useTranslation();
  const [, navigate] = useLocation();
  const { category } = useParams<{ category: string }>();
  const { content, themes, progress, domain } = usePath();
  const theme = themes.find((x) => x.category === category);
  const currentRef = useRef<HTMLButtonElement>(null);

  useEffect(() => { currentRef.current?.scrollIntoView({ block: 'center' }); }, [theme?.category]);

  if (content.loading) return <main className="grid min-h-dvh place-items-center text-ink-2">{t('common.loading')}</main>;
  if (!theme) return <main className="grid min-h-dvh place-items-center p-6 text-center text-ink-2">{t('path.notFound')}</main>;

  const cat = content.categories.get(theme.category);
  const states = nodeStates(theme, progress);
  const p = themeProgress(theme, progress);
  const finished = p.done === p.total;
  let windIndex = 0;

  return (
    <div style={accentStyle(domain)} className="min-h-dvh bg-mist">
      <header className="sticky top-0 z-10 border-b-2 border-line bg-surface/95 pt-[env(safe-area-inset-top)] backdrop-blur-sm">
        <div className="mx-auto flex max-w-[640px] items-center gap-2 px-3 py-2">
          <button type="button" onClick={() => navigate('/practice')} aria-label={t('common.back')} className="grid h-11 w-11 place-items-center rounded-xl text-ink-2 active:bg-mist">
            <ChevronLeft size={26} aria-hidden />
          </button>
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent)]"><DynamicIcon name={cat?.icon ?? 'Sparkles'} size={20} /></span>
          <h1 className="flex-1 truncate text-lg font-extrabold">{cat?.name_fr ?? theme.category}</h1>
          <span className="rounded-full bg-mist px-3 py-1 text-sm font-black text-[var(--accent)]">{p.done}/{p.total}</span>
        </div>
        <div className="mx-auto h-1.5 max-w-[640px] bg-line"><div className="h-full bg-[var(--accent)] transition-[width] duration-500" style={{ width: `${p.ratio * 100}%` }} /></div>
      </header>

      <main className="mx-auto max-w-[640px] px-5 pb-16 pt-5">
        {theme.units.map((unit) => {
          const preview = unit.termIds.slice(0, 3).map((id) => content.byId.get(id)?.term_en).filter(Boolean).join(', ');
          const unitDone = unit.nodes.every((n) => states.get(n.id) === 'done');
          return (
            <section key={unit.id} aria-labelledby={`${unit.id}-title`} className="mb-6">
              <div className="flex items-center gap-3 rounded-2xl bg-[var(--accent)] px-4 py-3.5 text-on-ocean shadow-[0_4px_0_var(--accent-press)]">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold opacity-90">{t('path.unit', { n: unit.index + 1 })} · {t(`levels.${unit.level}.name`)}</p>
                  <h2 id={`${unit.id}-title`} className="truncate text-lg font-black">{preview}</h2>
                </div>
                {unitDone && <span className="grid h-9 w-9 place-items-center rounded-full bg-white/20"><Check size={20} aria-hidden /></span>}
              </div>

              <ol className="flex flex-col items-center gap-5 pt-7">
                {unit.nodes.map((node) => {
                  const state = states.get(node.id) as NodeState;
                  const offset = WIND[windIndex++ % WIND.length]!;
                  const Icon = state === 'locked' ? Lock : state === 'done' && node.kind === 'lesson' ? Check : NODE_ICON[node.kind];
                  const look = state === 'done'
                    ? 'bg-gold text-white shadow-[0_6px_0_var(--color-gold-press)]'
                    : state === 'current'
                      ? 'bg-[var(--accent)] text-on-ocean shadow-[0_6px_0_var(--accent-press)]'
                      : 'bg-line text-ink-2 shadow-[0_6px_0_color-mix(in_srgb,var(--color-ink-2)_35%,transparent)]';
                  return (
                    <li key={node.id} className={`relative ${state === 'current' ? 'mt-11' : ''}`} style={{ transform: `translateX(${offset}px)` }}>
                      {state === 'current' && (
                        <span className="absolute -top-12 left-1/2 z-[1] -translate-x-1/2">
                          <span className="block animate-[bob_2.4s_ease-in-out_infinite] whitespace-nowrap rounded-xl border-2 border-line bg-surface px-3 py-1.5 text-sm font-black text-[var(--accent)] shadow-[0_3px_0_var(--color-line)]">
                            {t(`path.kind.${node.kind}`)}
                          </span>
                        </span>
                      )}
                      {state === 'current' && <span aria-hidden className="absolute inset-0 animate-[ring_1.8s_ease-out_infinite] rounded-full" />}
                      <button type="button" ref={state === 'current' ? currentRef : undefined} disabled={state === 'locked'}
                        onClick={() => navigate(`/path/${theme.category}/${node.id}`)}
                        aria-label={`${t(`path.kind.${node.kind}`)}, ${t(`path.state.${state}`)}`}
                        className={`relative grid h-[72px] w-[72px] place-items-center rounded-full transition-transform duration-100 active:translate-y-1.5 active:shadow-none disabled:cursor-not-allowed ${look}`}>
                        <Icon size={30} strokeWidth={2.5} aria-hidden />
                      </button>
                    </li>
                  );
                })}
              </ol>
            </section>
          );
        })}

        <div className={`mx-auto mt-4 flex max-w-sm flex-col items-center rounded-2xl border-2 p-5 text-center ${finished ? 'border-gold bg-sun' : 'border-line bg-surface'}`}>
          <Trophy size={40} className={finished ? 'text-sun-ink' : 'text-ink-2'} aria-hidden />
          <p className="mt-2 font-black">{finished ? t('path.themeDone') : t('path.themeGoal')}</p>
          <p className="mt-1 text-sm text-ink-2">{t('path.themeWords', { count: theme.termIds.length })}</p>
        </div>
      </main>
    </div>
  );
}
