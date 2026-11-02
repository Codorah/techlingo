import { useLiveQuery } from 'dexie-react-hooks';
import { ArrowRight, Check, CircleCheck, Languages, Lightbulb, Mic, Square, Volume2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useParams, useSearch } from 'wouter';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import type { CareerPack } from '@/content/schema';
import { completeNode } from '@/data/path';
import { addXP, saveAnswerDraft } from '@/data/progress';
import { db } from '@/db/db';
import { loadCareer } from '@/lib/content';
import { generalRoleOf, profileRoles } from '@/lib/domains';
import { phraseHits } from '@/learning/situations';
import { useManifest } from '@/lib/useContent';
import { canRecognize, listen, type ListenError, speak, stopSpeaking } from '@/lib/speech';

export function QuestionScreen() {
  const { t } = useTranslation();
  const [, navigate] = useLocation();
  const { id } = useParams<{ id: string }>();
  // Opened from a job course: the step is marked done there, and back returns to the course map.
  const search = new URLSearchParams(useSearch());
  const courseNode = search.get('node');
  const backTo = search.get('back') ?? '/career';
  const [career, setCareer] = useState<CareerPack | null>(null);
  const draft = useLiveQuery(() => db.answerDrafts.get(id), [id]);
  const profile = useLiveQuery(() => db.profile.get('me'));
  const manifest = useManifest();
  const [showFr, setShowFr] = useState(false);
  const [listening, setListening] = useState(false);
  const [spoken, setSpoken] = useState('');
  const [text, setText] = useState<string | null>(null);
  const [micError, setMicError] = useState<string | null>(null);
  const stopRef = useRef<() => void>(() => {});
  const abortRef = useRef<() => void>(() => {});
  const saving = useRef(false);

  useEffect(() => { void loadCareer().then(setCareer); }, []);
  useEffect(() => () => { abortRef.current(); stopSpeaking(); }, []);
  // Next question: close the microphone and silence the previous one.
  useEffect(() => { abortRef.current(); stopSpeaking(); setListening(false); setSpoken(''); setText(null); setShowFr(false); setMicError(null); }, [id]);

  const q = career?.questions.find((x) => x.id === id);
  if (!q) return <Screen back={backTo}><p className="text-ink-2">{t('common.loading')}</p></Screen>;

  const written = text ?? draft?.text ?? '';
  const attempt = `${spoken} ${written}`;
  const found = phraseHits(attempt, q.key_phrases); // "we'll" = "we will"
  const hits = q.key_phrases.filter((_, i) => found[i]);
  const practiced = !!draft?.checklist.practiced;

  const general = generalRoleOf(manifest, profile?.primaryRole);
  const roles = new Set([general, ...profileRoles(profile)]);
  const list = career!.questions.filter((x) => x.roles.some((r) => roles.has(r)));
  const next = list[(list.findIndex((x) => x.id === q.id) + 1) % list.length];

  async function speakAnswer() {
    if (listening) { stopRef.current(); return; }
    stopSpeaking();
    setListening(true); setMicError(null);
    const { done, stop, abort } = listen(setSpoken, { continuous: true });
    stopRef.current = stop;
    abortRef.current = abort;
    try {
      const heard = await done;
      setSpoken(heard);
      if (!heard) setMicError(t('recall.say.nothing'));
    } catch (e) {
      // The written path stays available.
      const code = e as ListenError;
      if (code !== 'aborted') setMicError(code === 'not-allowed' || code === 'unsupported' ? t('recall.say.denied') : t('recall.say.nothing'));
    } finally { setListening(false); }
  }

  async function markDone() {
    if (saving.current) return; // double tap: one XP, one node
    saving.current = true;
    try {
      await saveAnswerDraft(q!.id, { text: written, checklist: { practiced: true } });
      if (courseNode) {
        await completeNode(courseNode, 'lesson', [], { correct: hits.length, total: q!.key_phrases.length });
        navigate(backTo, { replace: true });
        return;
      }
      if (!practiced) await addXP(15);
    } finally { saving.current = false; }
  }

  return (
    <Screen back={backTo}>
      <p className="text-sm font-bold text-ink-2">{q.topic_fr} · {q.level}</p>
      <div className="mt-2 flex items-start gap-3">
        <h1 className="flex-1 text-2xl font-black leading-snug" lang="en">{q.question_en}</h1>
        <button type="button" onClick={() => speak(q.question_en)} aria-label={t('career.question.listen')}
          className="grid h-12 w-12 flex-none place-items-center rounded-2xl bg-[#5B4FC4] text-white shadow-[0_4px_0_#43399A] active:translate-y-1 active:shadow-none"><Volume2 size={22} aria-hidden /></button>
      </div>
      <p className="mt-1 text-ink-2">{q.question_fr}</p>

      <Card className="mt-5 bg-sun/60"><p className="flex items-center gap-2 font-extrabold text-sun-ink"><Lightbulb size={20} aria-hidden />{t('career.question.hint')}</p><p className="mt-1 font-semibold">{q.hint_fr}</p></Card>

      <h2 className="mt-6 text-lg font-extrabold">{t('career.question.outline')}</h2>
      <ol className="mt-3 grid gap-2">
        {q.answer_outline_fr.map((step, i) => (
          <li key={step} className="flex items-center gap-3 rounded-2xl bg-surface px-4 py-3"><span className="grid h-7 w-7 flex-none place-items-center rounded-full bg-[var(--accent)] text-sm font-bold text-on-ocean">{i + 1}</span>{step}</li>
        ))}
      </ol>

      <h2 className="mt-6 text-lg font-extrabold">{t('career.question.keys')}</h2>
      <div className="mt-3 flex flex-wrap gap-2">
        {q.key_phrases.map((k) => {
          const hit = hits.includes(k);
          return <span key={k} lang="en" className={`inline-flex items-center gap-1.5 rounded-full border-2 px-3 py-1.5 text-sm font-bold ${hit ? 'border-mint-strong bg-mint text-mint-ink' : 'border-line bg-surface text-ink-2'}`}>{hit && <Check size={14} aria-hidden />}{k}</span>;
        })}
      </div>

      <h2 className="mt-6 text-lg font-extrabold">{t('career.question.model')}</h2>
      <Card className="mt-3">
        <p className="leading-relaxed" lang="en">{q.model_answer_en}</p>
        {showFr && <p className="mt-3 border-t-2 border-line pt-3 text-ink-2">{q.model_answer_fr}</p>}
        <div className="mt-3 flex flex-wrap gap-2">
          <Button variant="secondary" block={false} icon={<Volume2 size={18} aria-hidden />} onClick={() => speak(q.model_answer_en)}>{t('career.question.listenAnswer')}</Button>
          <Button variant="ghost" block={false} icon={<Languages size={18} aria-hidden />} onClick={() => setShowFr(!showFr)}>{showFr ? t('career.question.hideTranslation') : t('career.question.translation')}</Button>
        </div>
      </Card>

      <h2 className="mt-6 text-lg font-extrabold">{t('career.question.practice')}</h2>
      <Card className="mt-3">
        {canRecognize() ? (
          <>
            <Button variant={listening ? 'danger' : 'primary'} icon={listening ? <Square size={20} aria-hidden /> : <Mic size={20} aria-hidden />} onClick={() => void speakAnswer()}>
              {listening ? t('career.question.stop') : t('career.question.speak')}
            </Button>
            {micError && <p role="alert" className="mt-3 text-sm font-semibold text-danger">{micError}</p>}
            {spoken && <p className="mt-3 rounded-2xl bg-mist p-3 text-sm" aria-live="polite"><span className="font-bold">{t('career.question.spoken')} : </span>{spoken}</p>}
          </>
        ) : <p className="text-sm text-ink-2">{t('career.question.noSpeech')}</p>}

        <label className="mt-4 block">
          <span className="font-bold">{t('career.question.write')}</span>
          <textarea value={written} onChange={(e) => setText(e.target.value)} onBlur={() => void saveAnswerDraft(q.id, { text: written })} rows={5} lang="en"
            placeholder={t('career.question.writePlaceholder')} className="mt-2 w-full rounded-2xl border-2 border-line bg-surface p-3 outline-none placeholder:text-ink-2 focus:border-[var(--accent)]" />
        </label>
        <p className="mt-2 text-sm font-bold" aria-live="polite">{t('career.question.keysHit', { count: hits.length })} / {q.key_phrases.length}</p>
      </Card>

      <div className="mt-5 grid gap-2.5 pb-[env(safe-area-inset-bottom)]">
        {practiced && !courseNode
          ? <p className="flex items-center justify-center gap-2 font-bold text-mint-ink"><CircleCheck size={20} aria-hidden />{t('career.question.doneAlready')}</p>
          : <Button variant="success" icon={<Check size={20} aria-hidden />} onClick={() => void markDone()}>{t('career.question.done')}</Button>}
        {!courseNode && next && next.id !== q.id && <Button variant="secondary" icon={<ArrowRight size={20} aria-hidden />} onClick={() => navigate(`/career/q/${next.id}`)}>{t('career.question.next')}</Button>}
      </div>
    </Screen>
  );
}
