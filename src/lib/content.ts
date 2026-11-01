// Loads the generated content manifest and role packs. Packs are cached by the service worker,
// so once fetched they keep working offline.
import MiniSearch from 'minisearch';
import type { CareerPack, DictEntry, Manifest, RolePack, ShippedPath, Term } from '@/content/schema';
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

let careerPromise: Promise<CareerPack> | null = null;
export function loadCareer(): Promise<CareerPack> {
  careerPromise ??= fetch('/content/career.json')
    .then((r) => { if (!r.ok) throw new Error(`career ${r.status}`); return r.json(); })
    .then((json: CareerPack) => { if (!Array.isArray(json.questions)) throw new Error('career malformed'); return json; });
  return careerPromise;
}

const paths = new Map<string, Promise<ShippedPath>>();
/** The hand-written path of a domain (work situations), cached offline like the packs. */
export function loadPath(domain: string): Promise<ShippedPath> {
  let p = paths.get(domain);
  if (!p) {
    p = fetch(`/content/paths/${domain}.json`)
      .then((r) => { if (!r.ok) throw new Error(`path ${domain} ${r.status}`); return r.json(); })
      .then((json: ShippedPath) => { if (!Array.isArray(json.units)) throw new Error('path malformed'); return json; });
    paths.set(domain, p);
  }
  return p;
}

const dicts = new Map<string, Promise<DictEntry[]>>();
/** Every word of a domain, light fields only (list, search, filters). */
export function loadDict(domain: string): Promise<DictEntry[]> {
  let p = dicts.get(domain);
  if (!p) {
    p = fetch(`/content/dict/${domain}.json`)
      .then((r) => { if (!r.ok) throw new Error(`dict ${domain} ${r.status}`); return r.json(); })
      .then((json: { terms: DictEntry[] }) => { if (!Array.isArray(json.terms)) throw new Error('dict malformed'); return json.terms; });
    dicts.set(domain, p);
  }
  return p;
}
