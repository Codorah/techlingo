// Loads and cross-checks every content file. Used by validate.ts and build.ts.
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { z } from 'zod';
import { type ActionVerb, CareerFile, Category, Domain, type InterviewQuestion, Role, RoleFile, type Term } from '../../src/content/schema';

export const CONTENT_DIR = join(process.cwd(), 'content');

export interface LoadedContent {
  domains: Domain[];
  roles: Role[];
  categories: Category[];
  terms: Term[];
  questions: InterviewQuestion[];
  verbs: ActionVerb[];
  errors: string[];
  warnings: string[];
  contentVersion: string;
}

const readJson = (path: string): unknown => JSON.parse(readFileSync(path, 'utf8'));

function formatIssues(file: string, err: z.ZodError): string[] {
  return err.issues.map((i) => `${file} › ${i.path.join('.') || '(root)'}: ${i.message}`);
}

export function loadContent(): LoadedContent {
  const errors: string[] = [];
  const warnings: string[] = [];
  const hash = createHash('sha256');

  const domainsRaw = readFileSync(join(CONTENT_DIR, 'domains.json'), 'utf8');
  const rolesRaw = readFileSync(join(CONTENT_DIR, 'roles.json'), 'utf8');
  const catsRaw = readFileSync(join(CONTENT_DIR, 'categories.json'), 'utf8');
  hash.update(domainsRaw).update(rolesRaw).update(catsRaw);

  const domainsParsed = z.array(Domain).safeParse(JSON.parse(domainsRaw));
  if (!domainsParsed.success) errors.push(...formatIssues('domains.json', domainsParsed.error));
  const domains = domainsParsed.success ? domainsParsed.data : [];

  const rolesParsed = z.array(Role).safeParse(JSON.parse(rolesRaw));
  const catsParsed = z.array(Category).safeParse(JSON.parse(catsRaw));
  if (!rolesParsed.success) errors.push(...formatIssues('roles.json', rolesParsed.error));
  if (!catsParsed.success) errors.push(...formatIssues('categories.json', catsParsed.error));
  const roles = rolesParsed.success ? rolesParsed.data : [];
  const categories = catsParsed.success ? catsParsed.data : [];

  const terms: Term[] = [];
  const seen = new Map<string, string>();
  const files = readdirSync(join(CONTENT_DIR, 'roles')).filter((f) => f.endsWith('.json')).sort();
  for (const file of files) {
    const raw = readFileSync(join(CONTENT_DIR, 'roles', file), 'utf8');
    hash.update(raw);
    let json: unknown;
    try { json = JSON.parse(raw); } catch (e) { errors.push(`roles/${file}: invalid JSON (${(e as Error).message})`); continue; }
    const parsed = RoleFile.safeParse(json);
    if (!parsed.success) { errors.push(...formatIssues(`roles/${file}`, parsed.error)); continue; }
    if (`${parsed.data.role}.json` !== file) errors.push(`roles/${file}: "role" must match the file name`);
    for (const t of parsed.data.terms) {
      const prev = seen.get(t.id);
      if (prev) { errors.push(`duplicate term id "${t.id}" in roles/${file} (already in ${prev})`); continue; }
      seen.set(t.id, `roles/${file}`);
      terms.push(t);
    }
  }

  // Career content: interview questions and action verbs
  const questions: InterviewQuestion[] = [];
  const verbs: ActionVerb[] = [];
  const careerDir = join(CONTENT_DIR, 'career');
  for (const file of readdirSync(careerDir).filter((f) => f.endsWith('.json')).sort()) {
    const raw = readFileSync(join(careerDir, file), 'utf8');
    hash.update(raw);
    const parsed = CareerFile.safeParse(JSON.parse(raw));
    if (!parsed.success) { errors.push(...formatIssues(`career/${file}`, parsed.error)); continue; }
    questions.push(...parsed.data.questions);
    verbs.push(...parsed.data.verbs);
  }
  const seenQ = new Set<string>();
  for (const q of questions) { if (seenQ.has(q.id)) errors.push(`duplicate interview question id "${q.id}"`); seenQ.add(q.id); }
  const seenV = new Set<string>();
  for (const v of verbs) { if (seenV.has(v.id)) errors.push(`duplicate verb id "${v.id}"`); seenV.add(v.id); }

  // Cross references
  const roleIds = new Set(roles.map((r) => r.id));
  const domainIds = new Set(domains.map((d) => d.id));
  for (const r of roles) if (!domainIds.has(r.domain)) errors.push(`role ${r.id}: unknown domain "${r.domain}"`);
  for (const d of domains) {
    const general = roles.find((r) => r.id === d.generalRole);
    if (!general || general.domain !== d.id) errors.push(`domain ${d.id}: generalRole "${d.generalRole}" must be a role of this domain`);
  }
  const catIds = new Set(categories.map((c) => c.id));
  const termIds = new Set(terms.map((t) => t.id));
  const lowerTerms = new Map<string, string>();
  for (const t of terms) {
    t.roles.forEach((r) => { if (!roleIds.has(r.role)) errors.push(`${t.id}: unknown role "${r.role}"`); });
    t.categories.forEach((c) => { if (!catIds.has(c)) errors.push(`${t.id}: unknown category "${c}"`); });
    t.related_terms.forEach((r) => { if (!termIds.has(r)) warnings.push(`${t.id}: related term "${r}" does not exist yet`); });
    if (t.replacedBy && !termIds.has(t.replacedBy)) errors.push(`${t.id}: replacedBy "${t.replacedBy}" does not exist`);
    const key = t.term_en.toLowerCase();
    const dup = lowerTerms.get(key);
    if (dup) errors.push(`"${t.term_en}" is defined twice (${dup}, ${t.id})`);
    lowerTerms.set(key, t.id);
    if (t.review_note) warnings.push(`${t.id}: review note: ${t.review_note}`);
  }
  for (const q of questions) {
    q.roles.forEach((r) => { if (!roleIds.has(r)) errors.push(`question ${q.id}: unknown role "${r}"`); });
    q.vocabulary_term_ids.forEach((v) => { if (!termIds.has(v)) warnings.push(`question ${q.id}: vocabulary term "${v}" does not exist yet`); });
  }

  return { domains, roles, categories, terms, questions, verbs, errors, warnings, contentVersion: hash.digest('hex').slice(0, 12) };
}

export function coverage(content: LoadedContent) {
  return content.roles.map((r) => {
    const ts = content.terms.filter((t) => t.roles.some((x) => x.role === r.id));
    const byLevel = Object.fromEntries(['A1', 'A2', 'B1', 'B2', 'C1'].map((l) => [l, ts.filter((t) => t.level === l).length]));
    return { role: r.id, total: ts.length, validated: ts.filter((t) => t.status === 'validated').length, ...byLevel };
  });
}

export { readJson };
