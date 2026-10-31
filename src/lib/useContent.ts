import { useEffect, useState } from 'react';
import type { Category, Manifest, Term } from '@/content/schema';
import { loadManifest, loadRolePack } from './content';

export interface ContentState {
  manifest: Manifest | null;
  terms: Term[]; // merged, de-duplicated terms of the requested roles
  byId: Map<string, Term>;
  categories: Map<string, Category>;
  loading: boolean;
  error: boolean;
}

/** Loads the packs of the given roles (cached by the service worker for offline use). */
export function useContent(roles: string[]): ContentState {
  const key = roles.join(',');
  const [state, setState] = useState<ContentState>({ manifest: null, terms: [], byId: new Map(), categories: new Map(), loading: true, error: false });

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const manifest = await loadManifest();
        const packs = await Promise.all(roles.map((r) => loadRolePack(r)));
        const byId = new Map<string, Term>();
        for (const { pack } of packs) for (const t of pack.terms) byId.set(t.id, t);
        if (alive) setState({ manifest, terms: [...byId.values()], byId, categories: new Map(manifest.categories.map((c) => [c.id, c])), loading: false, error: false });
      } catch {
        if (alive) setState((s) => ({ ...s, loading: false, error: true }));
      }
    })();
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return state;
}

/** The content manifest alone (roles, domains, categories), without loading any pack. */
export function useManifest(): Manifest | null {
  const [manifest, setManifest] = useState<Manifest | null>(null);
  useEffect(() => { void loadManifest().then(setManifest).catch(() => setManifest(null)); }, []);
  return manifest;
}
