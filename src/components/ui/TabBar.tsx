import { BookOpen, House, UserRound } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'wouter';

const TABS = [
  { href: '/', key: 'home', Icon: House },
  { href: '/dictionary', key: 'dictionary', Icon: BookOpen },
  { href: '/profile', key: 'profile', Icon: UserRound }
] as const;

export function TabBar() {
  const { t } = useTranslation();
  const [location] = useLocation();
  return (
    <nav aria-label="Navigation principale" className="fixed inset-x-0 bottom-0 z-20 border-t-2 border-line bg-surface pb-[env(safe-area-inset-bottom)]">
      <ul className="mx-auto flex max-w-[640px] justify-around px-2 py-1.5">
        {TABS.map(({ href, key, Icon }) => {
          const active = href === '/' ? location === '/' : location.startsWith(href);
          return (
            <li key={key} className="flex-1">
              <Link href={href} aria-current={active ? 'page' : undefined}
                className={`flex min-h-[52px] flex-col items-center justify-center gap-0.5 rounded-2xl text-xs font-bold ${active ? 'text-ocean' : 'text-ink-2'}`}>
                <span className={`grid h-8 w-14 place-items-center rounded-full transition-colors ${active ? 'bg-mist' : ''}`}><Icon size={22} aria-hidden /></span>
                {t(`tabs.${key}`)}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
