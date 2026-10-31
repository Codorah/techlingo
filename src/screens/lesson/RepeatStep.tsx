import { Mic, RotateCcw, Square, Turtle, Volume2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';
import type { Sentence } from '@/content/schema';
import { compareSentence, type CompareResult } from '@/learning/compare';
import { canRecognize, listen, type ListenError, speak, stopSpeaking } from '@/lib/speech';

export interface RepeatOutcome { score: number | null; transcript: string; recognizedRatio: number; selfRated?: 'easy' | 'hard' }

/** "Repeat it" step: Web Speech recognition when available, honest self-rating otherwise. */
export function RepeatStep({ sentence, onDone }: { sentence: Sentence; onDone: (o: RepeatOutcome) => void }) {
  const { t } = useTranslation();
  const supported = canRecognize();
  const [listening, setListening] = useState(false);
  const [partial, setPartial] = useState('');
  const [result, setResult] = useState<CompareResult | null>(null);
  const [error, setError] = useState<ListenError | null>(null);
  const stopRef = useRef<() => void>(() => {});

  useEffect(() => () => { stopRef.current(); stopSpeaking(); }, []);

  async function start() {
    stopSpeaking();
    setError(null); setResult(null); setPartial(''); setListening(true);
    const { done, stop } = listen(setPartial);
    stopRef.current = stop;
    try {
      const text = await done;
      setResult(compareSentence(sentence.text_en, text));
      setPartial(text);
    } catch (e) {
      setError((e as ListenError) ?? 'other');
    } finally { setListening(false); }
  }

  const listenButtons = (
    <div className="flex gap-2">
      <Button variant="secondary" block={false} className="flex-1" icon={<Volume2 size={20} aria-hidden />} onClick={() => speak(sentence.text_en)}>{t('common.listen')}</Button>
      <Button variant="secondary" block={false} className="flex-1" icon={<Turtle size={20} aria-hidden />} onClick={() => speak(sentence.text_en, { slow: true })}>{t('common.listenSlow')}</Button>
    </div>
  );

  const fallback = !supported || error === 'not-allowed' || error === 'other' || error === 'network';

  return (
    <div className="flex flex-1 flex-col">
      <h2 className="text-2xl font-black">{fallback ? t('repeat.fallbackTitle') : t('repeat.title')}</h2>
      <p className="mt-1 text-ink-2">{fallback ? t('repeat.fallbackText') : t('repeat.text')}</p>

      <blockquote className="mt-5 rounded-[var(--radius-card)] border-2 border-line bg-surface p-5 text-xl font-semibold leading-relaxed">
        {result
          ? result.words.map((w, i) => <span key={i} className={w.recognized ? 'text-mint-ink' : 'text-danger underline decoration-2 underline-offset-4'}>{w.word} </span>)
          : sentence.text_en}
        <span className="mt-2 block text-base font-normal text-ink-2">{sentence.text_fr}</span>
      </blockquote>
      <div className="mt-3">{listenButtons}</div>

      {error === 'not-allowed' && <p role="alert" className="mt-4 rounded-2xl bg-sun p-3 text-sm font-semibold text-sun-ink">{t('repeat.denied')}</p>}
      {error === 'no-speech' && <p role="alert" className="mt-4 rounded-2xl bg-sun p-3 text-sm font-semibold text-sun-ink">{t('repeat.noSpeech')}</p>}
      {(error === 'other' || error === 'network') && <p role="alert" className="mt-4 rounded-2xl bg-sun p-3 text-sm font-semibold text-sun-ink">{t('repeat.error')}</p>}

      <div className="mt-auto pt-6">
        {fallback ? (
          <div className="grid grid-cols-2 gap-2.5">
            <Button variant="secondary" onClick={() => onDone({ score: null, transcript: '', recognizedRatio: 0, selfRated: 'hard' })}>{t('repeat.hard')}</Button>
            <Button variant="success" onClick={() => onDone({ score: null, transcript: '', recognizedRatio: 0, selfRated: 'easy' })}>{t('repeat.easy')}</Button>
          </div>
        ) : result ? (
          <>
            <p className="mb-1 text-center text-lg font-black" role="status">{t('repeat.score', { score: result.score })}</p>
            <p className="mb-3 text-center text-xs text-ink-2">{t('repeat.honesty')}</p>
            <div className="grid grid-cols-2 gap-2.5">
              <Button variant="secondary" icon={<RotateCcw size={20} aria-hidden />} onClick={() => void start()}>{t('repeat.retry')}</Button>
              <Button onClick={() => onDone({ score: result.score, transcript: partial, recognizedRatio: result.recognizedRatio })}>{t('common.continue')}</Button>
            </div>
          </>
        ) : (
          <>
            {!listening && <p className="mb-3 text-center text-xs text-ink-2">{t('repeat.permission')}</p>}
            {listening && partial && <p className="mb-3 text-center text-ink-2" aria-live="polite">{t('repeat.said')} « {partial} »</p>}
            <button type="button" onClick={() => (listening ? stopRef.current() : void start())}
              className={`mx-auto grid h-20 w-20 place-items-center rounded-full text-white shadow-[0_5px_0_var(--color-ocean-press)] transition-transform active:translate-y-1 active:shadow-none ${listening ? 'animate-pulse bg-danger shadow-[0_5px_0_#8f2a2a]' : 'bg-ocean'}`}
              aria-label={listening ? t('repeat.stop') : t('repeat.tap')}>
              {listening ? <Square size={28} aria-hidden /> : <Mic size={32} aria-hidden />}
            </button>
            <p className="mt-3 text-center font-bold">{listening ? t('repeat.listening') : t('repeat.tap')}</p>
            <button type="button" className="mx-auto mt-2 block min-h-11 px-4 text-sm font-bold text-ink-2" onClick={() => onDone({ score: null, transcript: '', recognizedRatio: 0 })}>{t('common.skip')}</button>
          </>
        )}
      </div>
    </div>
  );
}
