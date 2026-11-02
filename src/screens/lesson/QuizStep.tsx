import { Check, Flame, Turtle, Volume2, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';
import { Choice } from '@/components/ui/Choice';
import type { QuizQuestion } from '@/content/schema';
import { sounds } from '@/lib/sound';
import { speak, stopSpeaking, useHasVoice } from '@/lib/speech';

export type Playable = { id: string; termId?: string; prompt: string; sentence?: string; audio?: string; choices: string[]; answer: number; explanation: string };

/** Turns the supported quiz types into one multiple-choice shape. */
export function toPlayable(q: QuizQuestion, fillGapLabel: string): Playable | null {
  switch (q.type) {
    case 'mcq': return { id: q.id, prompt: q.payload.prompt_fr, choices: q.payload.choices, answer: q.payload.answer_index, explanation: q.payload.explanation_fr };
    case 'translate_in_context': return { id: q.id, prompt: q.payload.sentence_en, choices: q.payload.choices, answer: q.payload.answer_index, explanation: q.payload.explanation_fr };
    case 'real_situation': return { id: q.id, prompt: q.payload.situation_fr, choices: q.payload.choices, answer: q.payload.answer_index, explanation: q.payload.explanation_fr };
    case 'fill_gap': {
      const choices = q.payload.choices ?? [];
      const answer = choices.indexOf(q.payload.answer);
      return answer < 0 ? null : { id: q.id, prompt: fillGapLabel, sentence: q.payload.sentence_en, choices, answer, explanation: q.payload.explanation_fr };
    }
    default: return null; // match_words, listen_and_pick and speak_it arrive with the Practice screens
  }
}

const LETTERS = ['A', 'B', 'C', 'D', 'E'];

export function QuizStep({ questions, onAnswer, onDone, onProgress }: {
  questions: Playable[];
  onAnswer: (q: Playable, choice: number, correct: boolean) => void;
  onDone: (correct: number) => void;
  /** Index of the question on screen (session progress bars). */
  onProgress?: (index: number) => void;
}) {
  const { t } = useTranslation();
  const [i, setI] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const q = questions[i]!;
  const correct = selected === q.answer;
  const voice = useHasVoice();
  // First question only: later ones are read from the tap that opens them (iOS blocks speech outside a gesture).
  useEffect(() => { const first = questions[0]; if (first?.audio) speak(first.audio); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => stopSpeaking(), []);
  useEffect(() => { onProgress?.(i); }, [i]); // eslint-disable-line react-hooks/exhaustive-deps

  function check() {
    if (selected === null || checked) return;
    setChecked(true);
    if (correct) setScore((s) => s + 1);
    setCombo((c) => (correct ? c + 1 : 0));
    navigator.vibrate?.(correct ? 12 : [30, 40, 30]);
    if (correct) sounds.correct(); else sounds.wrong();
    onAnswer(q, selected, correct);
  }
  const finished = useRef(false);
  function next() {
    if (i + 1 >= questions.length) {
      if (finished.current) return; // double tap on "Voir mon résultat"
      finished.current = true;
      onDone(score);
      return;
    }
    const upcoming = questions[i + 1]!;
    if (upcoming.audio) speak(upcoming.audio); else stopSpeaking();
    setI(i + 1); setSelected(null); setChecked(false);
  }

  return (
    <div className="flex flex-1 flex-col">
      <p className="text-sm font-bold text-ink-2">{t('quiz.progress', { n: i + 1, total: questions.length })}</p>
      <h2 className="mt-2 text-[1.35rem] font-black leading-snug">{q.prompt}</h2>
      {q.audio && !voice && (
        <p className="mt-3 rounded-2xl bg-surface p-4 text-base leading-relaxed">
          <span className="block text-sm font-bold text-ink-2">{t('practice.listening.noVoice')}</span>
          <span lang="en" className="mt-1 block font-semibold">{q.audio}</span>
        </p>
      )}
      {q.audio && voice && (
        <div className="mt-4 flex gap-2">
          <Button block={false} className="flex-1" icon={<Volume2 size={20} aria-hidden />} onClick={() => speak(q.audio!)}>{t('practice.listening.play')}</Button>
          <Button variant="secondary" block={false} className="flex-1" icon={<Turtle size={20} aria-hidden />} onClick={() => speak(q.audio!, { slow: true })}>{t('practice.listening.slow')}</Button>
        </div>
      )}
      {q.sentence && <p className="mt-3 rounded-2xl bg-surface p-4 font-mono text-base leading-relaxed">{q.sentence.replace('___', '_____')}</p>}
      <div className="mt-5 grid gap-2.5">
        {q.choices.map((c, k) => (
          <Choice key={`${q.id}-${k}`} disabled={checked} onClick={() => setSelected(k)}
            state={!checked ? (selected === k ? 'selected' : 'idle') : k === q.answer ? 'correct' : k === selected ? 'wrong' : 'dim'}
            leading={<span className="grid h-8 w-8 flex-none place-items-center rounded-lg border-2 border-current text-sm font-bold">{LETTERS[k]}</span>}
            trailing={checked && k === q.answer ? <Check size={22} aria-hidden /> : checked && k === selected ? <X size={22} aria-hidden /> : null}>
            {c}
          </Choice>
        ))}
      </div>
      <div className="h-56" aria-hidden />
      {checked ? (
        <div role="alert" className={`fixed inset-x-0 bottom-0 z-30 flex max-h-[75dvh] animate-[sheet_.28s_var(--ease-out-quart)] flex-col px-5 pb-[calc(env(safe-area-inset-bottom)+16px)] pt-5 ${correct ? 'bg-mint text-mint-ink' : 'bg-danger-soft text-danger'} shadow-[0_-6px_20px_rgba(15,34,56,0.12)]`}>
          <div className="mx-auto flex min-h-0 w-full max-w-[640px] flex-col">
            <div className="min-h-0 flex-1 overflow-y-auto">
            <p className="flex items-center gap-2 text-lg font-black">
              <span className="grid h-9 w-9 animate-[bounce-in_.4s_var(--ease-out-quart)] place-items-center rounded-full bg-surface">{correct ? <Check size={22} aria-hidden /> : <X size={22} aria-hidden />}</span>
              {correct ? t('quiz.correct') : t('quiz.wrong')}
              {correct && combo >= 3 && <span className="ml-auto inline-flex animate-[pop_.3s_ease-out] items-center gap-1 rounded-full bg-surface px-3 py-1 text-sm text-[#C2410C]"><Flame size={16} aria-hidden />{t('quiz.combo', { count: combo })}</span>}
            </p>
            {!correct && <p className="mt-1 font-bold">{t('quiz.answer', { answer: q.choices[q.answer] })}</p>}
            <p className="mt-1 text-base leading-snug">{q.explanation}</p>
            </div>
            <Button variant={correct ? 'success' : 'danger'} className="mt-4" autoFocus onClick={next}>{i + 1 >= questions.length ? t('quiz.finish') : t('quiz.next')}</Button>
          </div>
        </div>
      ) : (
        <div className="fixed inset-x-0 bottom-0 z-20 bg-mist px-5 pb-[calc(env(safe-area-inset-bottom)+16px)] pt-3">
          <div className="mx-auto max-w-[640px]"><Button variant="success" disabled={selected === null} onClick={check}>{t('quiz.check')}</Button></div>
        </div>
      )}
    </div>
  );
}
