import { Check, RotateCcw, Volume2, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';
import { SlowButton } from '@/components/ui/SlowButton';
import type { Term } from '@/content/schema';
import { buildOrderItems, type Chip, isSameOrder, ORDER, scramble } from '@/learning/order';
import { speak } from '@/lib/speech';

type Phase = 'play' | 'wrong' | 'right' | 'revealed';

/** Put the words of a real sentence back in order, then hear it and say it. */
export function OrderGame({ pool, onDone }: { pool: Term[]; onDone: (correct: number, total: number) => void }) {
  const { t } = useTranslation();
  const items = useMemo(() => buildOrderItems(pool), [pool]);
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [tries, setTries] = useState(0);
  const [phase, setPhase] = useState<Phase>('play');
  const item = items[index];
  const [bank, setBank] = useState<Chip[]>(() => (items[0] ? scramble(items[0].words) : []));
  const [answer, setAnswer] = useState<Chip[]>([]);

  if (!item) return <p className="mt-10 text-center text-ink-2">{t('practice.needWords')}</p>;

  const locked = phase === 'right' || phase === 'revealed';
  const take = (chip: Chip) => { if (locked) return; setPhase('play'); setBank(bank.filter((c) => c.id !== chip.id)); setAnswer([...answer, chip]); };
  const giveBack = (chip: Chip) => { if (locked) return; setPhase('play'); setAnswer(answer.filter((c) => c.id !== chip.id)); setBank([...bank, chip]); };
  const reset = () => { setAnswer([]); setBank(scramble(item.words)); setPhase('play'); };

  function check() {
    if (isSameOrder(answer.map((c) => c.text), item!.words)) {
      if (tries === 0) setScore(score + 1);
      setPhase('right');
      speak(item!.sentence);
    } else if (tries < ORDER.retries) {
      setTries(tries + 1);
      setPhase('wrong');
    } else {
      setPhase('revealed');
      speak(item!.sentence);
    }
  }

  function next() {
    if (index + 1 >= items.length) { onDone(score, items.length); return; }
    const following = items[index + 1]!;
    setIndex(index + 1);
    setTries(0);
    setPhase('play');
    setAnswer([]);
    setBank(scramble(following.words));
  }

  const chip = 'min-h-11 rounded-xl border-2 px-3 text-base font-bold active:translate-y-0.5';
  return (
    <div className="flex flex-1 flex-col">
      <p className="text-sm font-bold text-ink-2">{t('practice.order.progress', { n: index + 1, total: items.length })}</p>
      <h1 className="mt-2 text-2xl font-black leading-snug">{t('practice.order.prompt')}</h1>
      <p className="mt-1 text-ink-2">{item.fr}</p>

      <div aria-label={t('practice.order.answer')} className={`mt-5 flex min-h-[88px] flex-wrap content-start gap-2 rounded-2xl border-2 border-dashed p-3 ${phase === 'right' ? 'border-mint-strong bg-mint/40' : phase === 'wrong' ? 'border-coral bg-coral-soft/50' : 'border-line bg-surface'}`}>
        {answer.map((c) => (
          <button key={c.id} type="button" lang="en" disabled={locked} onClick={() => giveBack(c)} className={`${chip} border-line bg-surface`}>{c.text}</button>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap gap-2" aria-label={t('practice.order.bank')}>
        {bank.map((c) => (
          <button key={c.id} type="button" lang="en" onClick={() => take(c)} className={`${chip} border-line bg-mist text-ink`}>{c.text}</button>
        ))}
      </div>

      <div role="status" className="mt-5 min-h-[3.5rem]">
        {phase === 'wrong' && <p className="flex items-start gap-2 font-bold text-coral-ink"><X size={20} className="mt-0.5 flex-none" aria-hidden />{t('practice.order.wrong')}</p>}
        {phase === 'right' && <p className="flex items-start gap-2 font-bold text-mint-ink"><Check size={20} className="mt-0.5 flex-none" aria-hidden />{t('practice.order.right')}</p>}
        {phase === 'revealed' && (
          <div>
            <p className="font-bold text-ink-2">{t('practice.order.answerWas')}</p>
            <p lang="en" className="mt-1 text-lg font-extrabold">{item.sentence}</p>
          </div>
        )}
        {locked && (
          <div className="mt-3 flex items-center gap-2">
            <button type="button" onClick={() => speak(item.sentence)} aria-label={t('common.listen')} className="grid h-12 w-12 flex-none place-items-center rounded-2xl bg-[var(--accent)] text-on-ocean"><Volume2 size={22} aria-hidden /></button>
            <SlowButton text={item.sentence} />
            <span className="text-sm text-ink-2">{t('practice.order.sayIt')}</span>
          </div>
        )}
      </div>

      <span className="flex-1" />
      <div className="grid gap-2.5">
        {locked
          ? <Button onClick={next}>{index + 1 >= items.length ? t('practice.order.finish') : t('common.continue')}</Button>
          : <Button disabled={bank.length > 0} onClick={check}>{t('practice.order.check')}</Button>}
        {!locked && answer.length > 0 && (
          <Button variant="ghost" icon={<RotateCcw size={18} aria-hidden />} onClick={reset}>{t('practice.order.reset')}</Button>
        )}
      </div>
    </div>
  );
}
