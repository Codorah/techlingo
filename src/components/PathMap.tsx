import { Check, ChevronLeft, Lock, type LucideIcon } from 'lucide-react';
import { type ReactNode, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'wouter';
import type { NodeState } from '@/learning/path';

export interface MapNode { id: string; label: string; Icon: LucideIcon; state: NodeState; href: string }
export interface MapUnit { id: string; kicker: string; title: string; subtitle?: string; nodes: MapNode[] }

// Horizontal offsets (px) that give the path its winding shape.
const WIND = [0, 46, 70, 46, 0, -46, -70, -46];

/** Duolingo-style screen: sticky header with progress, unit banners, nodes on a winding path. */
export function PathMap({ title, icon, back, done, total, units, footer }: {
  title: string; icon: ReactNode; back: string; done: number; total: number; units: MapUnit[]; footer?: ReactNode;
}) {
  const { t } = useTranslation();
  const [, navigate] = useLocation();
  const currentRef = useRef<HTMLButtonElement>(null);
  useEffect(() => { currentRef.current?.scrollIntoView({ block: 'center' }); }, [units.length]);
  let windIndex = 0;

  return (
    <div className="min-h-dvh bg-mist">
      <header className="sticky top-0 z-10 border-b-2 border-line bg-surface/95 pt-[env(safe-area-inset-top)] backdrop-blur-sm">
        <div className="mx-auto flex max-w-[640px] items-center gap-2 px-3 py-2">
          <button type="button" onClick={() => navigate(back)} aria-label={t('common.back')} className="grid h-11 w-11 place-items-center rounded-xl text-ink-2 active:bg-mist">
            <ChevronLeft size={26} aria-hidden />
          </button>
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent)]">{icon}</span>
          <h1 className="min-w-0 flex-1 line-clamp-2 text-lg font-extrabold leading-tight">{title}</h1>
          <span className="rounded-full bg-mist px-3 py-1 text-sm font-black text-[var(--accent)]">{done}/{total}</span>
        </div>
        <div className="mx-auto h-1.5 max-w-[640px] bg-line"><div className="h-full bg-[var(--accent)] transition-[width] duration-500" style={{ width: `${total ? (done / total) * 100 : 0}%` }} /></div>
      </header>

      <main className="mx-auto max-w-[640px] px-5 pb-16 pt-5">
        {units.map((unit) => {
          const unitDone = unit.nodes.every((n) => n.state === 'done');
          return (
            <section key={unit.id} aria-labelledby={`${unit.id}-title`} className="mb-6">
              <div className="flex items-center gap-3 rounded-2xl bg-[var(--accent)] px-4 py-3.5 text-on-ocean shadow-[0_4px_0_var(--accent-press)]">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold opacity-90">{unit.kicker}</p>
                  <h2 id={`${unit.id}-title`} className="text-lg font-black leading-snug">{unit.title}</h2>
                  {unit.subtitle && <p className="mt-0.5 text-sm opacity-90">{unit.subtitle}</p>}
                </div>
                {unitDone && <span className="grid h-9 w-9 flex-none place-items-center rounded-full bg-white/20"><Check size={20} aria-hidden /></span>}
              </div>

              <ol className="flex flex-col items-center gap-5 pt-7">
                {unit.nodes.map((node) => {
                  const offset = WIND[windIndex++ % WIND.length]!;
                  const Icon = node.state === 'locked' ? Lock : node.Icon;
                  const look = node.state === 'done'
                    ? 'bg-gold text-white shadow-[0_6px_0_var(--color-gold-press)]'
                    : node.state === 'current'
                      ? 'bg-[var(--accent)] text-on-ocean shadow-[0_6px_0_var(--accent-press)]'
                      : 'bg-line text-ink-2 shadow-[0_6px_0_color-mix(in_srgb,var(--color-ink-2)_35%,transparent)]';
                  return (
                    <li key={node.id} className={`relative ${node.state === 'current' ? 'mt-11' : ''}`} style={{ transform: `translateX(${offset}px)` }}>
                      {node.state === 'current' && (
                        <span className="absolute -top-12 left-1/2 z-[1] -translate-x-1/2">
                          <span className="block animate-[bob_2.4s_ease-in-out_infinite] whitespace-nowrap rounded-xl border-2 border-line bg-surface px-3 py-1.5 text-sm font-black text-[var(--accent)] shadow-[0_3px_0_var(--color-line)]">
                            {node.label}
                          </span>
                        </span>
                      )}
                      {node.state === 'current' && <span aria-hidden className="absolute inset-0 animate-[ring_1.8s_ease-out_infinite] rounded-full" />}
                      <button type="button" ref={node.state === 'current' ? currentRef : undefined} disabled={node.state === 'locked'}
                        onClick={() => navigate(node.href)} aria-label={`${node.label}, ${t(`path.state.${node.state}`)}`}
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
        {footer}
      </main>
    </div>
  );
}
