import { useLiveQuery } from 'dexie-react-hooks';
import { ChevronRight, CircleCheck, Search } from 'lucide-react';
import MiniSearch from 'minisearch';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'wouter';
import { TabBar } from '@/components/ui/TabBar';
import { SEARCH_OPTIONS, type SearchDoc } from '@/content/search';
import { db } from '@/db/db';
import { useContent } from '@/lib/useContent';

export function DictionaryScreen() {
  const { t } = useTranslation();
  const profile = useLiveQuery(() => db.profile.get('me'));
  const roles = profile?.primaryRole ? [profile.primaryRole, ...profile.secondaryRoles] : [];
  const content = useContent(roles);
  const learned = useLiveQuery(async () => new Set((await db.userTerms.toArray()).filter((u) => u.card).map((u) => u.termId)), [], new Set<string>());
  const [query, setQuery] = useState('');

  // One index over the merged packs of the user's roles (fast enough for a few thousand words).
  const index = useMemo(() => {
    const m = new MiniSearch<SearchDoc>(SEARCH_OPTIONS);
    m.addAll(content.terms.map(({ id, term_en, translation_fr, definition_en, explanation_fr }) => ({ id, term_en, translation_fr, definition_en, explanation_fr })));
    return m;
  }, [content.terms]);

  const results = useMemo(() => {
    if (!query.trim()) return [...content.terms].sort((a, b) => a.term_en.localeCompare(b.term_en, 'en'));
    return index.search(query).map((r) => content.byId.get(String(r.id))).filter((x) => !!x);
  }, [query, index, content]);

  return (
    <>
      <main className="mx-auto max-w-[640px] px-5 pb-28 pt-[calc(env(safe-area-inset-top)+16px)]">
        <h1 className="text-[1.75rem] font-black">{t('dictionary.title')}</h1>
        <label className="relative mt-4 block">
          <span className="sr-only">{t('dictionary.search')}</span>
          <Search size={20} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-2" aria-hidden />
          <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t('dictionary.search')} autoComplete="off"
            className="min-h-[52px] w-full rounded-2xl border-2 border-line bg-surface pl-12 pr-4 text-base outline-none placeholder:text-ink-2 focus:border-ocean" />
        </label>
        <p className="mt-3 text-sm text-ink-2" aria-live="polite">{t('dictionary.count', { count: results.length })}</p>

        {results.length === 0 ? (
          <p className="mt-10 text-center text-ink-2">{t('dictionary.empty')}</p>
        ) : (
          <ul className="mt-3 overflow-hidden rounded-[var(--radius-card)] border-2 border-line bg-surface">
            {results.slice(0, 200).map((term, i) => (
              <li key={term.id} className={i ? 'border-t-2 border-line' : ''}>
                <Link href={`/word/${term.id}`} className="flex min-h-[60px] items-center gap-3 px-4 py-2.5 active:bg-mist">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-bold">{term.term_en}</span>
                    <span className="block truncate text-sm text-ink-2">{term.translation_fr}</span>
                  </span>
                  {learned.has(term.id) && <CircleCheck size={20} className="text-mint-strong" aria-label={t('dictionary.learned')} />}
                  <span className="rounded-md bg-mist px-1.5 py-0.5 text-xs font-bold text-ink-2">{term.level}</span>
                  <ChevronRight size={18} className="text-ink-2" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
      <TabBar />
    </>
  );
}
