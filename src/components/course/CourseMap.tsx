import { BookOpen, BriefcaseBusiness, Check, ChevronLeft, Lock, type LucideIcon, MessagesSquare, Mic, Play, Trophy } from 'lucide-react';
import { type CSSProperties, type ReactNode, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'wouter';
import type { CourseNode, CourseNodeKind, CourseUnit, CourseUnitKind } from '@/learning/course';
import type { NodeState } from '@/learning/path';

const KIND_ICON: Record<CourseNodeKind, LucideIcon> = { guide: BookOpen, lesson: MessagesSquare, recall: Mic, interview: BriefcaseBusiness };

// Each unit kind keeps one colour everywhere: the domain accent for situations, teal for
// recall, violet for the interview (speaking).
const UNIT_COLORS: Record<CourseUnitKind, CSSProperties> = {
  situation: {},
  recall: { ['--accent' as string]: 'var(--color-teal)', ['--accent-press' as string]: 'var(--color-teal-press)', ['--accent-soft' as string]: 'var(--color-teal-soft)' },
  interview: { ['--accent' as string]: 'var(--color-violet)', ['--accent-press' as string]: 'var(--color-violet-press)', ['--accent-soft' as string]: 'var(--color-violet-soft)' }
};

// Horizontal offsets (px) that give the path its winding shape.
const WIND = [0, 52, 78, 52, 0, -52, -78, -52];
const STEP = 100; // vertical distance between two nodes
const NODE = 76;
const BUBBLE = 48; // extra room above the current node for its "start" bubble

export interface MapUnit extends CourseUnit { states: Map<string, NodeState> }

/** Duolingo-style map of a job course: unit banners and nodes on a dotted, winding path. */
export function CourseMap({ title, icon, back, done, total, units, onOpen, aside }: {
  title: string; icon: ReactNode; back: string; done: number; total: number; units: MapUnit[];
  onOpen: (node: CourseNode) => void; aside?: ReactNode;
}) {
  const { t } = useTranslation();
  const [, navigate] = useLocation();
  const [selected, setSelected] = useState<string | null>(null);
  const currentRef = useRef<HTMLButtonElement>(null);
  useEffect(() => { currentRef.current?.scrollIntoView({ block: 'center' }); }, [units.length]);
  useEffect(() => {
    if (!selected) return;
    const close = (e: KeyboardEvent) => { if (e.key === 'Escape') setSelected(null); };
    const onOutsideClick = (e: MouseEvent | TouchEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && !target.closest('[role="dialog"]') && !target.closest('button[aria-expanded]')) {
        setSelected(null);
      }
    };
    window.addEventListener('keydown', close);
    const timer = setTimeout(() => {
      window.addEventListener('click', onOutsideClick);
      window.addEventListener('touchend', onOutsideClick);
    }, 60);
    return () => {
      window.removeEventListener('keydown', close);
      clearTimeout(timer);
      window.removeEventListener('click', onOutsideClick);
      window.removeEventListener('touchend', onOutsideClick);
    };
  }, [selected]);
  let wind = 0;

  return (
    <div className="min-h-dvh bg-mist">
      <header className="sticky top-0 z-40 border-b-2 border-line bg-surface/95 pt-[env(safe-area-inset-top)] backdrop-blur-sm">
        <div className="mx-auto flex max-w-[1080px] items-center gap-2 px-3 py-2">
          <button type="button" onClick={() => navigate(back)} aria-label={t('common.back')} className="grid h-11 w-11 place-items-center rounded-xl text-ink-2 active:bg-mist">
            <ChevronLeft size={26} aria-hidden />
          </button>
          <span className="grid h-10 w-10 flex-none place-items-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent)]">{icon}</span>
          <h1 className="min-w-0 flex-1 truncate text-lg font-extrabold">{title}</h1>
          <span className="rounded-full bg-[var(--accent-soft)] px-3 py-1 text-sm font-black text-[var(--accent)]">{done}/{total}</span>
        </div>
        <div className="h-1.5 bg-line" role="progressbar" aria-label={t('course.progress')} aria-valuemin={0} aria-valuemax={total} aria-valuenow={done}>
          <div className="h-full bg-[var(--accent)] transition-[width] duration-700 ease-out" style={{ width: `${total ? (done / total) * 100 : 0}%` }} />
        </div>
      </header>

      <div className="mx-auto flex max-w-[1080px] gap-8 px-5 lg:px-8">
        <main className="mx-auto w-full max-w-[560px] pb-24 pt-5">
          {units.map((unit) => {
            const hasSelected = unit.nodes.some((n) => n.id === selected);
            const unitDone = unit.nodes.every((n) => unit.states.get(n.id) === 'done');
            const unitStarted = unit.nodes.some((n) => unit.states.get(n.id) !== 'locked');
            // Absolute layout so the dotted trail can join the node centres.
            let y = 0;
            const placed = unit.nodes.map((node) => {
              const state = unit.states.get(node.id)!;
              if (state === 'current') y += BUBBLE;
              const p = { node, state, x: WIND[wind++ % WIND.length]!, y };
              y += STEP;
              return p;
            });
            const height = y - STEP + NODE + 56;
            const trail = placed.map((p, i) => `${i ? 'L' : 'M'}${p.x} ${p.y + NODE / 2}`).join(' ');
            const trophyX = WIND[wind % WIND.length]!;
            return (
              <section
                key={unit.id}
                aria-labelledby={`${unit.id}-title`}
                className={`mb-8 ${hasSelected ? 'relative z-30' : 'relative z-10'}`}
                style={UNIT_COLORS[unit.kind]}
              >
                <div className={`relative overflow-hidden rounded-2xl px-5 py-4 ${unitStarted ? 'bg-[var(--accent)] text-on-ocean shadow-[0_5px_0_var(--accent-press)]' : 'border-2 border-line bg-surface text-ink'}`}>
                  <UnitGlyph kind={unit.kind} className={`absolute -right-3 -top-3 ${unitStarted ? 'opacity-20' : 'text-line'}`} />
                  <p className={`relative text-xs font-black uppercase tracking-wider ${unitStarted ? 'opacity-90' : 'text-ink-2'}`}>
                    {t(`course.unitKind.${unit.kind}`, { n: unit.number })}
                  </p>
                  <h2 id={`${unit.id}-title`} className="relative mt-0.5 pr-12 text-xl font-black leading-snug">{unit.title}</h2>
                  {unit.subtitle && <p className={`relative mt-1 text-sm leading-relaxed ${unitStarted ? 'opacity-90' : 'text-ink-2'}`}>{unit.subtitle}</p>}
                  {unitDone && <span className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full bg-white/25" aria-label={t('path.state.done')}><Check size={20} aria-hidden /></span>}
                </div>

                <div className="relative mx-auto mt-6" style={{ height, width: 1 }}>
                  <svg className="pointer-events-none absolute left-0 top-0 overflow-visible" width="1" height={height} aria-hidden>
                    <path d={`${trail} L${trophyX} ${y + 10}`} fill="none" stroke="var(--color-line)" strokeWidth="6" strokeLinecap="round" strokeDasharray="0.5 16" />
                  </svg>
                  {placed.map(({ node, state, x, y: top }) => (
                    <Node key={node.id} node={node} state={state} x={x} y={top}
                      open={selected === node.id} buttonRef={state === 'current' ? currentRef : undefined}
                      onToggle={() => setSelected(selected === node.id ? null : node.id)} onStart={() => onOpen(node)} />
                  ))}
                  <span className={`absolute grid h-14 w-14 -translate-x-1/2 place-items-center rounded-2xl ${unitDone ? 'bg-gold text-white shadow-[0_4px_0_var(--color-gold-press)]' : 'bg-surface text-line shadow-[0_4px_0_var(--color-line)]'}`}
                    style={{ left: trophyX, top: y }} aria-hidden>
                    <Trophy size={28} strokeWidth={2.5} />
                  </span>
                </div>
              </section>
            );
          })}
        </main>
        {aside && <aside className="sticky top-24 hidden h-fit w-[320px] flex-none pt-5 lg:block">{aside}</aside>}
      </div>
    </div>
  );
}

function UnitGlyph({ kind, className }: { kind: CourseUnitKind; className?: string }) {
  const Icon = kind === 'recall' ? Mic : kind === 'interview' ? BriefcaseBusiness : MessagesSquare;
  return <Icon size={96} strokeWidth={1.6} className={className} aria-hidden />;
}

function Node({ node, state, x, y, open, buttonRef, onToggle, onStart }: {
  node: CourseNode; state: NodeState; x: number; y: number; open: boolean;
  buttonRef?: React.Ref<HTMLButtonElement>; onToggle: () => void; onStart: () => void;
}) {
  const { t } = useTranslation();
  const Icon = state === 'done' ? Check : KIND_ICON[node.kind];
  const look = state === 'locked'
    ? 'bg-line text-ink-2 shadow-[0_6px_0_color-mix(in_srgb,var(--color-ink-2)_30%,transparent)]'
    : 'bg-[var(--accent)] text-on-ocean shadow-[0_6px_0_var(--accent-press)]';
  // Shift the card back toward center when node is winding left/right to prevent screen clipping
  const cardShift = Math.round(x * 0.7);

  return (
    <div
      className={`absolute ${open ? 'z-40' : 'z-10'}`}
      style={{ left: x, top: y, transform: 'translateX(-50%)' }}
      onClick={(e) => e.stopPropagation()}
    >
      {state === 'current' && !open && (
        <span className="pointer-events-none absolute -top-12 left-1/2 z-[1] -translate-x-1/2">
          <span className="block animate-[bob_2.4s_ease-in-out_infinite] whitespace-nowrap rounded-xl border-2 border-line bg-surface px-3 py-1.5 text-sm font-black uppercase tracking-wide text-[var(--accent)] shadow-[0_3px_0_var(--color-line)]">
            {t('course.start')}
          </span>
        </span>
      )}
      {state === 'current' && <span aria-hidden className="absolute inset-0 animate-[glow_2s_ease-in-out_infinite] rounded-full motion-reduce:animate-none" />}
      <button type="button" ref={buttonRef} onClick={onToggle} aria-expanded={open}
        aria-label={`${node.title}, ${t(`course.node.${node.kind}`)}, ${t(`path.state.${state}`)}`}
        className={`relative grid place-items-center rounded-full transition-transform duration-100 active:translate-y-1.5 active:shadow-none ${look}`}
        style={{ width: NODE, height: NODE }}>
        <Icon size={32} strokeWidth={2.5} aria-hidden />
        {state === 'locked' && <span className="absolute -bottom-1 -right-1 grid h-7 w-7 place-items-center rounded-full border-2 border-mist bg-surface text-ink-2"><Lock size={14} aria-hidden /></span>}
      </button>
      {open && (
        <div
          role="dialog"
          aria-label={node.title}
          className="absolute left-1/2 top-[calc(100%+14px)] z-50 w-[min(300px,calc(100vw-36px))] animate-[pop_.18s_var(--ease-out-quart)] rounded-2xl p-4 text-left shadow-[0_12px_32px_rgba(15,34,56,0.28)]"
          style={{
            background: state === 'locked' ? 'var(--color-surface)' : 'var(--accent)',
            transform: `translateX(calc(-50% - ${cardShift}px))`
          }}
        >
          <span
            aria-hidden
            className="absolute -top-2 left-1/2 h-4 w-4 rotate-45"
            style={{
              background: state === 'locked' ? 'var(--color-surface)' : 'var(--accent)',
              transform: `translateX(calc(-50% + ${cardShift}px)) rotate(45deg)`
            }}
          />
          <p className={`text-xs font-black uppercase tracking-wider ${state === 'locked' ? 'text-ink-2' : 'text-on-ocean opacity-90'}`}>
            {t(`course.node.${node.kind}`)}
          </p>
          <p className={`mt-0.5 text-lg font-black leading-snug ${state === 'locked' ? 'text-ink' : 'text-on-ocean'}`}>
            {node.title}
          </p>
          <p className={`mt-1 text-sm ${state === 'locked' ? 'text-ink-2' : 'text-on-ocean opacity-90'}`}>
            {state === 'locked' ? t('course.locked') : t(`course.what.${node.kind}`)}
          </p>
          {state !== 'locked' && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onStart();
              }}
              className="mt-3.5 inline-flex min-h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-white font-black uppercase tracking-wide text-[var(--accent)] shadow-[0_4px_0_rgba(0,20,50,0.22)] transition-transform active:translate-y-1 active:shadow-none"
            >
              <Play size={18} aria-hidden />
              {state === 'done' ? t('course.redo') : t('course.go')}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
