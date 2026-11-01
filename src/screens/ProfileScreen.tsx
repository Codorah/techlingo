import { useLiveQuery } from 'dexie-react-hooks';
import { BookOpen, Briefcase, ChevronRight, Database, Flame, Moon, Star, Zap } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'wouter';
import { Avatar } from '@/components/ui/Avatar';
import { Card } from '@/components/ui/Card';
import { TabBar } from '@/components/ui/TabBar';
import { LEVELS, type Level } from '@/content/levels';
import { getRetention, saveProfile, setSetting } from '@/data/progress';
import { db } from '@/db/db';
import { displayedStreak, localDay } from '@/learning/streak';
import { domainOf } from '@/lib/domains';
import { useContent } from '@/lib/useContent';

const RETENTIONS = [0.8, 0.85, 0.9, 0.95];
const FAQ = ['offline', 'install', 'backup', 'xp', 'content'] as const;

export function ProfileScreen() {
  const { t } = useTranslation();
  const profile = useLiveQuery(() => db.profile.get('me'));
  const words = useLiveQuery(() => db.userTerms.filter((u) => !!u.card).toArray(), [], []);
  const content = useContent([]);
  const [retention, setRetention] = useState(0.9);
  const [dark, setDark] = useState(() => document.documentElement.dataset.theme === 'dark');

  useEffect(() => { void getRetention().then(setRetention); }, []);

  function toggleTheme() {
    const next = !dark;
    setDark(next);
    document.documentElement.dataset.theme = next ? 'dark' : 'light';
    try { localStorage.setItem('techlingo.theme', next ? 'dark' : 'light'); } catch { /* storage unavailable */ }
  }

  if (!profile) return null;
  const roleNames = [profile.primaryRole, ...profile.secondaryRoles].map((id) => content.manifest?.roles.find((r) => r.id === id)?.name_fr ?? id);
  const domain = domainOf(content.manifest, profile.primaryRole);
  const domainName = content.manifest?.domains?.find((d) => d.id === domain)?.name_fr ?? '';
  const mastered = words.filter((w) => w.state === 'mastered').length;
  const stats = [
    { Icon: Flame, color: 'text-[#C2410C]', value: displayedStreak(profile, localDay()), label: t('profile.stats.streak') },
    { Icon: BookOpen, color: 'text-ocean', value: words.length, label: t('profile.stats.words') },
    { Icon: Star, color: 'text-mint-ink', value: mastered, label: t('profile.stats.mastered') },
    { Icon: Zap, color: 'text-ocean', value: profile.xp, label: t('profile.stats.xp') }
  ];

  return (
    <>
      <main className="mx-auto max-w-[640px] px-5 pb-28 pt-[calc(env(safe-area-inset-top)+16px)]">
        <h1 className="text-[1.75rem] font-black">{t('profile.title')}</h1>
        <div className="mt-5 flex items-center gap-4">
          <Avatar id={profile.avatar} name={profile.displayName || 'T'} size={72} />
          <div>
            <p className="text-xl font-black">{profile.displayName || t('home.helloAnon')}</p>
            <p className="text-ink-2">{roleNames.join(' · ')}</p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-2.5">
          {stats.map(({ Icon, color, value, label }) => (
            <Card key={label} className="p-4"><Icon size={22} className={color} aria-hidden /><p className="mt-2 text-2xl font-black">{value}</p><p className="text-sm text-ink-2">{label}</p></Card>
          ))}
        </div>

        <h2 className="mt-7 text-lg font-extrabold">{t('profile.level')}</h2>
        <div role="radiogroup" aria-label={t('profile.editLevel')} className="mt-3 grid grid-cols-5 gap-2">
          {LEVELS.map((l: Level) => (
            <button key={l} type="button" role="radio" aria-checked={profile.level === l} onClick={() => void saveProfile({ level: l })}
              className={`min-h-12 rounded-xl border-2 font-title font-black ${profile.level === l ? 'border-ocean bg-ocean text-on-ocean' : 'border-line bg-surface text-ink-2'}`}>{l}</button>
          ))}
        </div>

        <h2 className="mt-7 text-lg font-extrabold">{t('profile.retention')}</h2>
        <p className="text-sm text-ink-2">{t('profile.retentionText')}</p>
        <div role="radiogroup" aria-label={t('profile.retention')} className="mt-3 grid grid-cols-4 gap-2">
          {RETENTIONS.map((r) => (
            <button key={r} type="button" role="radio" aria-checked={retention === r} onClick={() => { setRetention(r); void setSetting('retention', r); }}
              className={`min-h-12 rounded-xl border-2 font-bold ${retention === r ? 'border-ocean bg-ocean text-on-ocean' : 'border-line bg-surface text-ink-2'}`}>{Math.round(r * 100)} %</button>
          ))}
        </div>

        <Card className="mt-7 p-1">
          <Link href="/settings/roles" className="flex min-h-14 items-center gap-3 rounded-2xl px-3">
            <Briefcase size={22} className="text-ocean" aria-hidden />
            <span className="flex-1"><span className="block font-bold">{t('roles.title')}</span><span className="block text-sm text-ink-2">{domainName} · {roleNames.join(', ')}</span></span>
            <ChevronRight size={20} className="text-ink-2" aria-hidden />
          </Link>
          <div className="mx-3 h-0.5 bg-line" />
          <Link href="/settings/data" className="flex min-h-14 items-center gap-3 rounded-2xl px-3">
            <Database size={22} className="text-ocean" aria-hidden />
            <span className="flex-1"><span className="block font-bold">{t('profile.data')}</span><span className="block text-sm text-ink-2">{t('profile.dataText')}</span></span>
            <ChevronRight size={20} className="text-ink-2" aria-hidden />
          </Link>
          <div className="mx-3 h-0.5 bg-line" />
          <div className="flex min-h-14 items-center gap-3 px-3">
            <Moon size={22} className="text-ocean" aria-hidden />
            <span className="flex-1 font-bold">{t('profile.theme')}</span>
            <button type="button" role="switch" aria-checked={dark} aria-label={t('profile.theme')} onClick={toggleTheme}
              className={`relative h-8 w-14 flex-none rounded-full transition-colors ${dark ? 'bg-ocean' : 'bg-line'}`}>
              <span className={`absolute left-0 top-1 h-6 w-6 rounded-full bg-white shadow transition-transform duration-200 ${dark ? 'translate-x-7' : 'translate-x-1'}`} />
            </button>
          </div>
        </Card>

        <h2 className="mt-7 text-lg font-extrabold">{t('help.title')}</h2>
        <div className="mt-3 grid gap-2">
          {FAQ.map((k) => (
            <details key={k} className="group rounded-2xl border-2 border-line bg-surface px-4 [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex min-h-14 cursor-pointer list-none items-center gap-3 font-bold">
                <span className="flex-1">{t(`help.faq.${k}.q`)}</span>
                <ChevronRight size={20} className="text-ink-2 transition-transform group-open:rotate-90" aria-hidden />
              </summary>
              <p className="pb-4 text-ink-2">{t(`help.faq.${k}.a`)}</p>
            </details>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm font-bold text-ocean">
          <a href="/decouvrir/" className="inline-flex min-h-11 items-center">{t('help.about')}</a>
          <a href="/legal/confidentialite.html" className="inline-flex min-h-11 items-center">{t('help.privacy')}</a>
        </div>
      </main>
      <TabBar />
    </>
  );
}
