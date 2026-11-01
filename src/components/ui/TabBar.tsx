import { BookOpen, Briefcase, BriefcaseBusiness, ChevronRight, Database, Dumbbell, House, LayoutGrid, type LucideIcon, Trophy, UserRound } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'wouter';

const TABS = [
  { href: '/', key: 'home', Icon: House },
  { href: '/dictionary', key: 'dictionary', Icon: BookOpen },
  { href: '/practice', key: 'practice', Icon: Dumbbell },
  { href: '/career', key: 'career', Icon: BriefcaseBusiness }
] as const;

// Everything else lives behind "More", like a native app's overflow sheet.
const MORE: { href: string; key: string; Icon: LucideIcon; soon?: boolean }[] = [
  { href: '/profile', key: 'profile', Icon: UserRound },
  { href: '/leaderboard', key: 'leaderboard', Icon: Trophy, soon: true },
  { href: '/settings/roles', key: 'roles', Icon: Briefcase },
  { href: '/settings/data', key: 'data', Icon: Database }
];

const tabClass = (active: boolean) => `flex min-h-[52px] w-full flex-col items-center justify-center gap-0.5 rounded-2xl text-xs font-bold ${active ? 'text-ocean' : 'text-ink-2'}`;
const pill = (active: boolean) => `grid h-8 w-12 place-items-center rounded-full transition-colors ${active ? 'bg-mist' : ''}`;

export function TabBar() {
  const { t } = useTranslation();
  const [location] = useLocation();
  const [more, setMore] = useState(false);
  const moreActive = more || MORE.some((m) => location.startsWith(m.href));

  return (
    <>
      {more && (
        <>
          <div className="fixed inset-0 z-30 animate-[enter_.15s_ease-out] bg-ink/40" onClick={() => setMore(false)} aria-hidden />
          <div role="dialog" aria-modal="true" aria-label={t('tabs.more')}
            className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-[640px] animate-[sheet_.25s_var(--ease-out-quart)] rounded-t-3xl bg-surface px-4 pb-[calc(env(safe-area-inset-bottom)+84px)] pt-3">
            <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-line" />
            <ul className="grid grid-cols-2 gap-2.5">
              {MORE.map(({ href, key, Icon, soon }) => (
                <li key={key}>
                  {soon ? (
                    <span className="flex min-h-[88px] flex-col justify-between rounded-2xl border-2 border-line p-3 opacity-70">
                      <span className="flex items-start justify-between"><Icon size={26} className="text-[#C28A00]" aria-hidden /><span className="rounded-full bg-sun px-2 py-0.5 text-[11px] font-bold text-sun-ink">{t('onboarding.role.soon')}</span></span>
                      <span className="font-bold">{t(`more.${key}`)}</span>
                    </span>
                  ) : (
                    <Link href={href} onClick={() => setMore(false)}
                      className="flex min-h-[88px] flex-col justify-between rounded-2xl border-2 border-line p-3 shadow-[0_3px_0_var(--color-line)] active:translate-y-0.5 active:shadow-none">
                      <Icon size={26} className="text-ocean" aria-hidden />
                      <span className="flex items-center justify-between font-bold">{t(`more.${key}`)}<ChevronRight size={18} className="text-ink-2" aria-hidden /></span>
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
      <nav aria-label="Navigation principale" className="fixed inset-x-0 bottom-0 z-40 border-t-2 border-line bg-surface pb-[env(safe-area-inset-bottom)]">
        <ul className="mx-auto flex max-w-[640px] justify-around px-1 py-1.5">
          {TABS.map(({ href, key, Icon }) => {
            const active = !more && (href === '/' ? location === '/' : location.startsWith(href));
            return (
              <li key={key} className="flex-1">
                <Link href={href} aria-current={active ? 'page' : undefined} className={tabClass(active)}>
                  <span className={pill(active)}><Icon size={22} aria-hidden /></span>
                  {t(`tabs.${key}`)}
                </Link>
              </li>
            );
          })}
          <li className="flex-1">
            <button type="button" aria-expanded={more} onClick={() => setMore(!more)} className={tabClass(moreActive)}>
              <span className={pill(moreActive)}><LayoutGrid size={22} aria-hidden /></span>
              {t('tabs.more')}
            </button>
          </li>
        </ul>
      </nav>
    </>
  );
}
