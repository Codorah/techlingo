import { ArrowRight, X } from 'lucide-react';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from './Button';

/** Step-by-step deck of short cards: swipe, arrows or "Suivant". The last card's button runs `onFinish`. */
export function CardDeck({ cards, onClose, onFinish, finishLabel, label }: { cards: ReactNode[]; onClose: () => void; onFinish: () => void; finishLabel: string; label?: string }) {
  const { t } = useTranslation();
  const [index, setIndex] = useState(0);
  const [dir, setDir] = useState<1 | -1>(1);
  const start = useRef<{ x: number; y: number } | null>(null);
  const last = index === cards.length - 1;

  const go = (d: 1 | -1) => {
    if (d === 1 && last) { onFinish(); return; }
    const next = Math.max(0, Math.min(cards.length - 1, index + d));
    if (next !== index) { setDir(d); setIndex(next); }
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') go(1);
      else if (e.key === 'ArrowLeft') go(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  return (
    <main className="mx-auto flex h-dvh max-w-[640px] flex-col overflow-hidden px-4 pb-[calc(env(safe-area-inset-bottom)+14px)] pt-[calc(env(safe-area-inset-top)+10px)]">
      <header className="flex items-center gap-2">
        <button type="button" onClick={onClose} aria-label={t('common.close')} className="grid h-11 w-11 flex-none place-items-center rounded-xl text-ink-2 active:bg-surface"><X size={24} aria-hidden /></button>
        <div role="progressbar" aria-valuemin={1} aria-valuemax={cards.length} aria-valuenow={index + 1} aria-label={label ?? t('deck.progress', { n: index + 1, total: cards.length })} className="flex flex-1 gap-1">
          {cards.map((_, i) => <span key={i} className={`h-2 flex-1 rounded-full transition-colors ${i <= index ? 'bg-[var(--accent)]' : 'bg-line'}`} />)}
        </div>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto py-3 [touch-action:pan-y]"
        onPointerDown={(e) => { start.current = { x: e.clientX, y: e.clientY }; }}
        onPointerUp={(e) => {
          const s = start.current; start.current = null;
          if (!s) return;
          const dx = e.clientX - s.x, dy = e.clientY - s.y;
          if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) go(dx < 0 ? 1 : -1);
        }}
        onPointerCancel={() => { start.current = null; }}>
        <div key={index} className={dir === 1 ? 'animate-[deck-in-r_.25s_var(--ease-out-quart)]' : 'animate-[deck-in-l_.25s_var(--ease-out-quart)]'}>
          {cards[index]}
        </div>
      </div>
      <footer className="flex flex-none items-center gap-2 pt-2">
        {index > 0 && <Button variant="ghost" block={false} onClick={() => go(-1)} className="flex-none">{t('common.back')}</Button>}
        <Button onClick={() => go(1)} icon={<ArrowRight size={20} aria-hidden />} variant={last ? 'success' : 'primary'}>{last ? finishLabel : t('deck.next')}</Button>
      </footer>
    </main>
  );
}

/** Shared look of one deck card. */
export function DeckCard({ kicker, children }: { kicker?: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border-2 border-line bg-surface p-5 shadow-[0_4px_0_var(--color-line)] [hyphens:auto] [overflow-wrap:anywhere]">
      {kicker && <p className="mb-2 text-sm font-bold text-[var(--accent)]">{kicker}</p>}
      {children}
    </section>
  );
}
