import { useLiveQuery } from 'dexie-react-hooks';
import { Bookmark, ChevronRight, CircleCheck, Search, X } from 'lucide-react';
import MiniSearch from 'minisearch';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'wouter';
import { DynamicIcon } from '@/components/ui/DynamicIcon';
import { TabBar } from '@/components/ui/TabBar';
import { LEVELS, type Level } from '@/content/levels';
import type { DictEntry } from '@/content/schema';
import { db } from '@/db/db';
import { loadDict } from '@/lib/content';
import { domainOf, profileRoles } from '@/lib/domains';
import { useManifest } from '@/lib/useContent';
import { accentStyle } from '@/screens/path/ThemeScreen';

const PAGE = 60;
type Scope = 'mine' | 'domain' | 'learned' | 'favorites';

const chip = (on: boolean) => `inline-flex min-h-11 flex-none items-center gap-1.5 rounded-full border-2 px-3.5 text-sm font-bold transition-colors ${on ? 'border-[var(--accent)] bg-[var(--accent)] text-on-ocean' : 'border-line bg-surface text-ink-2'}`;

export function DictionaryScreen() {
  const { t } = useTranslation();
  const profile = useLiveQuery(() => db.profile.get('me'));
  const manifest = useManifest();
  const roles = profileRoles(profile);
  const domain = domainOf(manifest, profile?.primaryRole);
  const [all, setAll] = useState<DictEntry[] | null>(null);
  const [error, setError] = useState(false);
  const progress = useLiveQuery(async () => {
    const rows = await db.userTerms.toArray();
    return { learned: new Set(rows.filter((u) => u.card).map((u) => u.termId)), favorites: new Set(rows.filter((u) => u.favorite).map((u) => u.termId)) };
  }, [], { learned: new Set<string>(), favorites: new Set<string>() });

  const [query, setQuery] = useState('');
  const [scope, setScope] = useState<Scope>('domain');
  const [category, setCategory] = useState<string | null>(null);
  const [level, setLevel] = useState<Level | null>(null);
  const [shown, setShown] = useState(PAGE);
  const sentinel = useRef<HTMLLIElement>(null);

  useEffect(() => {
    if (!manifest || !profile) return;
    setAll(null);
    loadDict(domain).then(setAll).catch(() => setError(true));
  }, [domain, manifest, profile]);

  const index = useMemo(() => {
    const m = new MiniSearch<{ id: string; en: string; fr: string }>({
      fields: ['en', 'fr'], storeFields: [], searchOptions: { prefix: true, fuzzy: 0.2, boost: { en: 2 } },
      processTerm: (term) => term.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    });
    m.addAll((all ?? []).map(({ id, en, fr }) => ({ id, en, fr })));
    return m;
  }, [all]);

  const categories = useMemo(() => {
    const counts = new Map<string, number>();
    for (const e of all ?? []) for (const c of e.cats.slice(0, 1)) counts.set(c, (counts.get(c) ?? 0) + 1);
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([id]) => id);
  }, [all]);

  const results = useMemo(() => {
    if (!all) return [];
    const byId = new Map(all.map((e) => [e.id, e]));
    const base = query.trim() ? index.search(query).map((r) => byId.get(String(r.id))).filter((e): e is DictEntry => !!e) : all;
    return base.filter((e) =>
      (scope !== 'mine' || e.roles.some((r) => roles.includes(r)))
      && (scope !== 'learned' || progress.learned.has(e.id))
      && (scope !== 'favorites' || progress.favorites.has(e.id))
      && (!category || e.cats.includes(category))
      && (!level || e.level === level));
  }, [all, query, index, scope, category, level, roles, progress]);

  useEffect(() => { setShown(PAGE); }, [query, scope, category, level]);
  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const io = new IntersectionObserver((entries) => { if (entries[0]?.isIntersecting) setShown((n) => n + PAGE); }, { rootMargin: '600px' });
    io.observe(el);
    return () => io.disconnect();
  }, [results.length, shown]);

  const catOf = (id: string) => manifest?.categories.find((c) => c.id === id);
  const filtered = scope !== 'domain' || category || level || query.trim();

  return (
    <>
      <main style={accentStyle(domain)} className="mx-auto max-w-[640px] px-5 pb-28 pt-[calc(env(safe-area-inset-top)+16px)]">
        <h1 className="text-[1.75rem] font-black">{t('dictionary.title')}</h1>
        <label className="relative mt-4 block">
          <span className="sr-only">{t('dictionary.search')}</span>
          <Search size={20} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-2" aria-hidden />
          <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t('dictionary.search')} autoComplete="off"
            className="min-h-[52px] w-full rounded-2xl border-2 border-line bg-surface pl-12 pr-4 text-base outline-none placeholder:text-ink-2 focus:border-[var(--accent)]" />
        </label>

        <div role="group" aria-label={t('dictionary.scope')} className="-mx-5 mt-3 flex gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none]">
          {(['domain', 'mine', 'learned', 'favorites'] as const).map((s) => (
            <button key={s} type="button" aria-pressed={scope === s} onClick={() => setScope(s)} className={chip(scope === s)}>
              {s === 'learned' && <CircleCheck size={16} aria-hidden />}{s === 'favorites' && <Bookmark size={16} aria-hidden />}
              {t(`dictionary.scopes.${s}`)}
            </button>
          ))}
        </div>
        <div role="group" aria-label={t('dictionary.levels')} className="-mx-5 mt-2 flex gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none]">
          {LEVELS.map((l) => (
            <button key={l} type="button" aria-pressed={level === l} onClick={() => setLevel(level === l ? null : l)} className={chip(level === l)}>{l}</button>
          ))}
        </div>
        <div role="group" aria-label={t('dictionary.themes')} className="-mx-5 mt-2 flex gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none]">
          {categories.map((id) => {
            const cat = catOf(id);
            return (
              <button key={id} type="button" aria-pressed={category === id} onClick={() => setCategory(category === id ? null : id)} className={chip(category === id)}>
                <DynamicIcon name={cat?.icon ?? 'Sparkles'} size={16} />{cat?.name_fr ?? id}
              </button>
            );
          })}
        </div>

        <div className="mt-3 flex min-h-11 items-center justify-between gap-2">
          <p className="text-sm font-bold text-ink-2" aria-live="polite">{all ? t('dictionary.count', { count: results.length }) : t('common.loading')}</p>
          {filtered && (
            <button type="button" onClick={() => { setQuery(''); setScope('domain'); setCategory(null); setLevel(null); }}
              className="inline-flex min-h-11 items-center gap-1 rounded-full px-3 text-sm font-bold text-[var(--accent)] active:bg-surface">
              <X size={16} aria-hidden />{t('dictionary.reset')}
            </button>
          )}
        </div>

        {error ? (
          <p className="mt-10 text-center text-ink-2">{t('errors.content')}</p>
        ) : all && results.length === 0 ? (
          <p className="mt-10 text-center text-ink-2">{t('dictionary.empty')}</p>
        ) : (
          <ul className="mt-2 overflow-hidden rounded-[var(--radius-card)] border-2 border-line bg-surface">
            {results.slice(0, shown).map((e, i) => {
              const cat = catOf(e.cats[0] ?? '');
              return (
                <li key={e.id} className={i ? 'border-t-2 border-line' : ''}>
                  <Link href={`/word/${e.id}?pack=${e.pack}`} className="flex min-h-[64px] items-center gap-3 px-3.5 py-2.5 active:bg-mist">
                    <span className="grid h-10 w-10 flex-none place-items-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent)]" title={cat?.name_fr}>
                      <DynamicIcon name={cat?.icon ?? 'Sparkles'} size={20} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span lang="en" className="block truncate font-bold">{e.en}</span>
                      <span className="block truncate text-sm text-ink-2">{e.fr}</span>
                    </span>
                    {progress.learned.has(e.id) && <CircleCheck size={20} className="flex-none text-mint-strong" aria-label={t('dictionary.learned')} />}
                    <span className="flex-none rounded-md bg-mist px-1.5 py-0.5 text-xs font-bold text-ink-2">{e.level}</span>
                    <ChevronRight size={18} className="flex-none text-ink-2" aria-hidden />
                  </Link>
                </li>
              );
            })}
            {shown < results.length && <li ref={sentinel} className="border-t-2 border-line p-4 text-center text-sm text-ink-2">{t('common.loading')}</li>}
          </ul>
        )}
      </main>
      <TabBar />
    </>
  );
}
