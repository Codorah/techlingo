// Loads the generated content manifest and role packs. Packs are cached by the service worker,
// so once fetched they keep working offline.
import MiniSearch from 'minisearch';
import type { Manifest, RolePack, Term } from '@/content/schema';
import { SEARCH_OPTIONS, type SearchDoc } from '@/content/search';

let manifestPromise: Promise<Manifest> | null = null;
const packs = new Map<string, Promise<{ pack: RolePack; search: MiniSearch<SearchDoc> }>>();

export function loadManifest(): Promise<Manifest> {
  manifestPromise ??= fetch('/content/manifest.json')
    .then((r) => { if (!r.ok) throw new Error(`manifest ${r.status}`); return r.json(); })
    .then((json: Manifest) => {
      // Validated by the build; a cheap shape check keeps zod out of the startup bundle.
      if (!Array.isArray(json.roles) || typeof json.contentVersion !== 'string') throw new Error('manifest malformed');
      return json;
    });
  return manifestPromise;
}

export function loadRolePack(role: string) {
  let p = packs.get(role);
  if (!p) {
    // Terms were schema-validated at build time; only the envelope is checked here to keep
    // parsing cheap on low-end phones.
    p = fetch(`/content/packs/${role}.json`)
      .then((r) => { if (!r.ok) throw new Error(`pack ${role} ${r.status}`); return r.json(); })
      .then((json: RolePack) => {
        if (!Array.isArray(json.terms) || typeof json.contentVersion !== 'string') throw new Error(`pack ${role} malformed`);
        return { pack: json, search: MiniSearch.loadJSON<SearchDoc>(JSON.stringify(json.searchIndex), SEARCH_OPTIONS) };
      });
    packs.set(role, p);
  }
  return p;
}

export type { Term };
