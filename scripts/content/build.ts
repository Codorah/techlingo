// npm run content:build [-- --drafts]
// Validates content, then writes public/content/manifest.json and one pack per role.
// Production builds only ship `validated` (and `deprecated`, so existing progress keeps resolving).
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import MiniSearch from 'minisearch';
import { autoQuiz } from '../../src/content/autoQuiz';
import type { Manifest, Term } from '../../src/content/schema';
import { SEARCH_OPTIONS, type SearchDoc } from '../../src/content/search';
import { loadContent } from './lib';

const includeDrafts = process.argv.includes('--drafts');
const content = loadContent();
if (content.errors.length) {
  content.errors.forEach((e) => console.error(`error ${e}`));
  console.error(`\n✗ build aborted: ${content.errors.length} content error(s)`);
  process.exit(1);
}

const shippable = (t: Term) => includeDrafts || t.status === 'validated' || t.status === 'deprecated';
const out = join(process.cwd(), 'public', 'content');
rmSync(out, { recursive: true, force: true });
mkdirSync(join(out, 'packs'), { recursive: true });

const manifest: Manifest = {
  contentVersion: content.contentVersion,
  builtAt: new Date().toISOString(),
  includesDrafts: includeDrafts,
  totalTerms: content.terms.filter(shippable).length,
  categories: content.categories,
  domains: [],
  roles: [],
  paths: []
};

for (const role of content.roles) {
  const terms = content.terms
    .filter((t) => shippable(t) && t.roles.some((r) => r.role === role.id))
    .map((t, _, pool) => (t.quiz.length >= 3 ? t : { ...t, quiz: [...t.quiz, ...autoQuiz(t, pool)] }));
  const index = new MiniSearch<SearchDoc>(SEARCH_OPTIONS);
  index.addAll(terms.map(({ id, term_en, translation_fr, definition_en, explanation_fr }) => ({ id, term_en, translation_fr, definition_en, explanation_fr })));
  writeFileSync(join(out, 'packs', `${role.id}.json`), JSON.stringify({ role: role.id, contentVersion: content.contentVersion, terms, searchIndex: index.toJSON() }));
  manifest.roles.push({ ...role, termCount: terms.length, categories: [...new Set(terms.flatMap((t) => t.categories))] });
}

for (const domain of content.domains) {
  const roleIds = new Set(content.roles.filter((r) => r.domain === domain.id).map((r) => r.id));
  const termCount = content.terms.filter((t) => shippable(t) && t.roles.some((r) => roleIds.has(r.role))).length;
  manifest.domains.push({ ...domain, termCount });
}

const careerShippable = content.questions.filter((q) => includeDrafts || q.status === 'validated');
writeFileSync(join(out, 'career.json'), JSON.stringify({ contentVersion: content.contentVersion, questions: careerShippable, verbs: content.verbs }));

mkdirSync(join(out, 'paths'), { recursive: true });
const pathsShipped = content.paths.filter((p) => includeDrafts || p.status === 'validated');
for (const p of pathsShipped) writeFileSync(join(out, 'paths', `${p.domain}.json`), JSON.stringify({ contentVersion: content.contentVersion, ...p }));
manifest.paths = pathsShipped.map((p) => p.domain);

writeFileSync(join(out, 'manifest.json'), JSON.stringify(manifest, null, 2));
console.log(`✓ content ${content.contentVersion} built${includeDrafts ? ' (with drafts)' : ''}: ${manifest.totalTerms} terms in ${manifest.roles.length} packs, ${careerShippable.length} interview questions`);
