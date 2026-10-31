// npm run content:import [-- file.txt ...]   (default: every content/import/*.txt)
// Turns the compact authoring format into content/roles/<primary-role>.json.
// One term per line, fields separated by " | " (a literal "|" is not allowed inside a field):
//   id | level | roles | categories | part_of_speech | term_en | translation_fr | definition_en |
//   explanation_fr | why_it_matters_fr | example1_en | example1_fr | example2_en | example2_fr [| review_note]
// roles: "web-developer:90,mobile-developer:60"   categories: "api,backend"
// Lines starting with "#" are comments. Imported terms are always created as `draft`;
// re-importing an id updates its text but keeps its status and any hand-written quiz.
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import { RoleFile, Term } from '../../src/content/schema';
import { CONTENT_DIR } from './lib';

const files = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const importDir = join(CONTENT_DIR, 'import');
const inputs = files.length ? files : readdirSync(importDir).filter((f) => f.endsWith('.txt')).map((f) => join(importDir, f));

type RoleDoc = { role: string; terms: Term[] };
const docs = new Map<string, RoleDoc>();
function doc(role: string): RoleDoc {
  let d = docs.get(role);
  if (!d) {
    const path = join(CONTENT_DIR, 'roles', `${role}.json`);
    d = existsSync(path) ? (RoleFile.parse(JSON.parse(readFileSync(path, 'utf8'))) as RoleDoc) : { role, terms: [] };
    docs.set(role, d);
  }
  return d;
}

// Index of where each existing id lives, so a term never ends up in two files.
const owner = new Map<string, string>();
for (const f of readdirSync(join(CONTENT_DIR, 'roles')).filter((x) => x.endsWith('.json'))) {
  for (const t of doc(f.replace(/\.json$/, '')).terms) owner.set(t.id, f.replace(/\.json$/, ''));
}

let errors = 0, added = 0, updated = 0;
const seenInRun = new Map<string, string>(); // id -> file:line, catches the same id in two import files
for (const file of inputs) {
  readFileSync(file, 'utf8').split(/\r?\n/).forEach((line, i) => {
    if (!line.trim() || line.trimStart().startsWith('#')) return;
    const where = `${basename(file)}:${i + 1}`;
    const f = line.split(' | ').map((s) => s.trim());
    if (f.length < 12 || f.length > 15) { console.error(`error ${where}: expected 12-15 fields, got ${f.length}`); errors++; return; }
    const [id, level, roles, categories, pos, term_en, translation_fr, definition_en, explanation_fr, why, e1en, e1fr, e2en, e2fr, note] = f as string[];
    const clash = seenInRun.get(id!);
    if (clash) { console.error(`error ${where}: id "${id}" is already used at ${clash}`); errors++; return; }
    seenInRun.set(id!, where);
    const sentences = [{ id: `${id}-1`, text_en: e1en, text_fr: e1fr }];
    if (e2en && e2fr) sentences.push({ id: `${id}-2`, text_en: e2en, text_fr: e2fr });
    const roleList = roles!.split(',').map((r) => { const [role, p] = r.split(':'); return { role: role!.trim(), priority: Number(p ?? 50) }; });
    const primary = owner.get(id!) ?? roleList[0]!.role;
    const target = doc(primary);
    const previous = target.terms.find((t) => t.id === id);
    const parsed = Term.safeParse({
      ...(previous ?? {}),
      id, level, part_of_speech: pos, term_en, translation_fr, definition_en, explanation_fr, why_it_matters_fr: why,
      status: previous?.status ?? 'draft',
      roles: roleList,
      categories: categories!.split(',').map((c) => c.trim()),
      sentences,
      ...(note ? { review_note: note } : {})
    });
    if (!parsed.success) {
      parsed.error.issues.forEach((iss) => console.error(`error ${where} (${id}) ${iss.path.join('.')}: ${iss.message}`));
      errors++; return;
    }
    if (previous) { target.terms[target.terms.indexOf(previous)] = parsed.data; updated++; }
    else { target.terms.push(parsed.data); owner.set(id!, primary); added++; }
  });
}

if (errors) { console.error(`\n✗ ${errors} line(s) rejected, nothing written`); process.exit(1); }
for (const d of docs.values()) {
  if (!d.terms.length) continue;
  writeFileSync(join(CONTENT_DIR, 'roles', `${d.role}.json`), `${JSON.stringify(d, null, 2)}\n`);
}
console.log(`✓ ${added} added, ${updated} updated`);
