import { BookOpen, BriefcaseBusiness, Dumbbell, House, UserRound } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'wouter';

// Practice is the learning centre (paths, mini-courses, quizzes, reviews), so path screens light it up.
const TABS = [
  { href: '/', key: 'home', Icon: House, match: (l: string) => l === '/' },
  { href: '/dictionary', key: 'dictionary', Icon: BookOpen, match: (l: string) => l.startsWith('/dictionary') || l.startsWith('/word') },
  { href: '/practice', key: 'practice', Icon: Dumbbell, match: (l: string) => l.startsWith('/practice') || l.startsWith('/path') },
  { href: '/career', key: 'career', Icon: BriefcaseBusiness, match: (l: string) => l.startsWith('/career') },
  { href: '/profile', key: 'profile', Icon: UserRound, match: (l: string) => l.startsWith('/profile') || l.startsWith('/settings') }
] as const;

export function TabBar() {
  const { t } = useTranslation();
  const [location] = useLocation();
  return (
    <nav aria-label="Navigation principale" className="fixed inset-x-0 bottom-0 z-20 border-t-2 border-line bg-surface pb-[env(safe-area-inset-bottom)]">
      <ul className="mx-auto flex max-w-[640px] justify-around px-1 py-1.5">
        {TABS.map(({ href, key, Icon, match }) => {
          const active = match(location);
          return (
            <li key={key} className="flex-1">
              <Link href={href} aria-current={active ? 'page' : undefined}
                className={`flex min-h-[52px] flex-col items-center justify-center gap-0.5 rounded-2xl text-xs font-bold ${active ? 'text-ocean' : 'text-ink-2'}`}>
                <span className={`grid h-8 w-12 place-items-center rounded-full transition-colors ${active ? 'bg-mist' : ''}`}><Icon size={22} aria-hidden /></span>
                {t(`tabs.${key}`)}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
