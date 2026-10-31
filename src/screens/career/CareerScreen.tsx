import { useLiveQuery } from 'dexie-react-hooks';
import { ChevronRight, CircleCheck, MessageSquareText, Mic, Play, UserRound, Volume2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'wouter';
import { Card } from '@/components/ui/Card';
import { TabBar } from '@/components/ui/TabBar';
import type { CareerPack } from '@/content/schema';
import { db } from '@/db/db';
import { loadCareer } from '@/lib/content';
import { speak } from '@/lib/speech';

export function CareerScreen() {
  const { t } = useTranslation();
  const [, navigate] = useLocation();
  const profile = useLiveQuery(() => db.profile.get('me'));
  const drafts = useLiveQuery(() => db.answerDrafts.toArray(), [], []);
  const [career, setCareer] = useState<CareerPack | null>(null);
  useEffect(() => { void loadCareer().then(setCareer).catch(() => setCareer(null)); }, []);

  const roles = new Set(['general-tech', ...(profile?.primaryRole ? [profile.primaryRole, ...profile.secondaryRoles] : [])]);
  // Questions of the user's roles first, then the general ones.
  const questions = (career?.questions ?? [])
    .filter((q) => q.roles.some((r) => roles.has(r)))
    .sort((a, b) => Number(a.roles.includes('general-tech')) - Number(b.roles.includes('general-tech')));
  const practiced = new Set(drafts.filter((d) => d.checklist.practiced).map((d) => d.questionId));
  const done = questions.filter((q) => practiced.has(q.id)).length;
  const next = questions.find((q) => !practiced.has(q.id)) ?? questions[0];

  return (
    <>
      <main className="mx-auto max-w-[640px] px-5 pb-28 pt-[calc(env(safe-area-inset-top)+16px)]">
        <h1 className="text-[1.75rem] font-black">{t('career.title')}</h1>
        <p className="text-ink-2">{t('career.subtitle')}</p>

        <section className="relative mt-5 overflow-hidden rounded-[var(--radius-card)] bg-[#5B4FC4] p-5 text-white shadow-[0_4px_0_#43399A]">
          <MessageSquareText size={130} className="absolute -right-5 -top-3 opacity-15" aria-hidden />
          <div className="relative max-w-[78%]">
            <p className="inline-flex items-center gap-1.5 text-sm font-bold opacity-90"><Mic size={16} aria-hidden />{t('career.hero.title')}</p>
            <p className="mt-2 text-lg font-black">{t('career.hero.progress', { done, total: questions.length })}</p>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/25"><div className="h-full rounded-full bg-white" style={{ width: `${questions.length ? (done / questions.length) * 100 : 0}%` }} /></div>
            {next && (
              <button type="button" onClick={() => navigate(`/career/q/${next.id}`)}
                className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl bg-white px-4 font-bold text-[#43399A] shadow-[0_4px_0_rgba(0,0,0,0.2)] active:translate-y-1 active:shadow-none">
                <Play size={18} aria-hidden />{done ? t('career.hero.cta') : t('career.hero.start')}
              </button>
            )}
          </div>
        </section>

        <Link href="/career/pitch" className="mt-4 flex items-center gap-4 rounded-[var(--radius-card)] border-2 border-line bg-surface p-4 shadow-[0_4px_0_var(--color-line)] active:translate-y-1 active:shadow-none">
          <span className="grid h-12 w-12 flex-none place-items-center rounded-2xl bg-mist text-ocean"><UserRound size={24} aria-hidden /></span>
          <span className="flex-1"><span className="block font-extrabold">{t('career.pitch.title')}</span><span className="block text-sm text-ink-2">{t('career.pitch.card')}</span></span>
          <ChevronRight size={20} className="text-ink-2" aria-hidden />
        </Link>

        <h2 className="mt-7 flex items-baseline justify-between text-lg font-extrabold">{t('career.questions')}<span className="text-sm font-medium text-ink-2">{done}/{questions.length}</span></h2>
        <ul className="mt-3 overflow-hidden rounded-[var(--radius-card)] border-2 border-line bg-surface">
          {questions.map((q, i) => (
            <li key={q.id} className={i ? 'border-t-2 border-line' : ''}>
              <Link href={`/career/q/${q.id}`} className="flex min-h-[64px] items-center gap-3 px-4 py-3 active:bg-mist">
                <span className="min-w-0 flex-1"><span className="block font-bold" lang="en">{q.question_en}</span><span className="block text-sm text-ink-2">{q.topic_fr} · {q.level}</span></span>
                {practiced.has(q.id) && <CircleCheck size={20} className="text-mint-strong" aria-hidden />}
                <ChevronRight size={18} className="text-ink-2" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>

        <h2 className="mt-7 text-lg font-extrabold">{t('career.verbs')}</h2>
        <ul className="mt-3 grid gap-2.5">
          {(career?.verbs ?? []).map((v) => (
            <li key={v.id}><Card className="p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-lg font-black text-ocean" lang="en">{v.verb}</p>
                <button type="button" onClick={() => speak(`${v.verb}. ${v.example_en}`)} aria-label={`${t('common.listen')} ${v.verb}`}
                  className="grid h-10 w-10 place-items-center rounded-xl bg-mist text-ocean"><Volume2 size={18} aria-hidden /></button>
              </div>
              <p className="text-sm font-semibold">{v.meaning_fr}</p>
              <p className="mt-2 text-sm" lang="en">{v.example_en}</p>
              <p className="text-sm text-ink-2">{v.example_fr}</p>
            </Card></li>
          ))}
        </ul>
      </main>
      <TabBar />
    </>
  );
}
