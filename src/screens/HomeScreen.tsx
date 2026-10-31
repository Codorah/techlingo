import { Database } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'wouter';
import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import type { Manifest } from '@/content/schema';
import { loadManifest } from '@/lib/content';

// Temporary P1 home: proves the content pipeline and local data. Replaced in P2.
export function HomeScreen() {
  const { t } = useTranslation();
  const [manifest, setManifest] = useState<Manifest | null>(null);
  useEffect(() => { void loadManifest().then(setManifest).catch(() => setManifest(null)); }, []);

  return (
    <Screen>
      <div className="flex items-center gap-3">
        <img src="/icons/icon.svg" width={48} height={48} alt="" />
        <div><h1 className="text-2xl font-black">{t('app.name')}</h1><p className="text-sm text-ink-2">{t('app.tagline')}</p></div>
      </div>
      <Card className="mt-6">
        <h2 className="text-xl font-extrabold">{t('home.title')}</h2>
        <p className="mt-1 text-ink-2">{t('home.subtitle')}</p>
        {manifest && (
          <>
            <p className="mt-4 font-bold">{t('home.content', { count: manifest.totalTerms, roles: manifest.roles.filter((r) => r.termCount > 0).length })}</p>
            {manifest.includesDrafts && <p className="mt-1 inline-block rounded-full bg-sun px-3 py-1 text-sm font-bold text-sun-ink">{t('home.drafts')}</p>}
            <ul className="mt-4 grid gap-2">
              {manifest.roles.map((r) => (
                <li key={r.id} className="flex justify-between rounded-xl bg-mist px-3 py-2 text-sm"><span>{r.name_fr}</span><span className="font-bold">{r.termCount}</span></li>
              ))}
            </ul>
          </>
        )}
      </Card>
      <Link href="/settings/data" className="mt-4 flex min-h-[52px] items-center gap-3 rounded-2xl border-2 border-line bg-surface px-4 font-bold text-ocean">
        <Database size={22} aria-hidden /> {t('home.data')}
      </Link>
    </Screen>
  );
}
