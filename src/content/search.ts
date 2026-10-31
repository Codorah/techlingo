// Search options shared by the build (index generation) and the app (index loading).
// MiniSearch over Fuse.js: it serialises a prebuilt index, supports prefix + fuzzy matching,
// and stays fast on large lists on low-end phones, which matters for the 200 ms budget.
import type { Options } from 'minisearch';
import type { Term } from './schema';

export const normalize = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

export type SearchDoc = Pick<Term, 'id' | 'term_en' | 'translation_fr' | 'definition_en' | 'explanation_fr'>;

export const SEARCH_OPTIONS: Options<SearchDoc> = {
  idField: 'id',
  fields: ['term_en', 'translation_fr', 'definition_en', 'explanation_fr'],
  storeFields: ['term_en', 'translation_fr'],
  processTerm: (term) => normalize(term),
  searchOptions: {
    boost: { term_en: 4, translation_fr: 3, definition_en: 1, explanation_fr: 1 },
    prefix: true,
    fuzzy: 0.2
  }
};
