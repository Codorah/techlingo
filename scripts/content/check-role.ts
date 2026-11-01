// npx tsx scripts/content/check-role.ts <role>
// Checks one role's own content in isolation, so several writers can work in parallel:
// content/paths/roles/<role>.json (situation path) and content/career/<role>.json (interview questions).
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { z } from 'zod';
import { CareerFile, RoleFile, RolePathFile } from '../../src/content/schema';

const role = process.argv[2];
if (!role) { console.error('usage: tsx scripts/content/check-role.ts <role>'); process.exit(2); }
const dir = join(process.cwd(), 'content');
const errors: string[] = [];
const warnings: string[] = [];
const issues = (file: string, e: z.ZodError) => e.issues.map((i) => `${file} › ${i.path.join('.') || '(root)'}: ${i.message}`);

// Every term of every role (ids are global), plus the ids of this role.
const allTerms = new Map<string, string[]>();
for (const f of readdirSync(join(dir, 'roles')).filter((f) => f.endsWith('.json'))) {
  const parsed = RoleFile.safeParse(JSON.parse(readFileSync(join(dir, 'roles', f), 'utf8')));
  if (parsed.success) for (const t of parsed.data.terms) allTerms.set(t.id, t.roles.map((r) => r.role));
}
const roles = (JSON.parse(readFileSync(join(dir, 'roles.json'), 'utf8')) as { id: string }[]).map((r) => r.id);
if (!roles.includes(role)) { console.error(`unknown role "${role}"`); process.exit(2); }

// Ids already used by the other path files (progress keys must be globally unique).
const otherIds = new Set<string>();
const collect = (json: { units?: { id: string; lessons: { id: string }[] }[] }) => json.units?.forEach((u) => { otherIds.add(u.id); u.lessons.forEach((l) => otherIds.add(l.id)); });
for (const f of readdirSync(join(dir, 'paths')).filter((f) => f.endsWith('.json'))) collect(JSON.parse(readFileSync(join(dir, 'paths', f), 'utf8')));

const pathFile = join(dir, 'paths', 'roles', `${role}.json`);
if (!existsSync(pathFile)) errors.push(`missing ${pathFile}`);
else {
  let json: unknown;
  try { json = JSON.parse(readFileSync(pathFile, 'utf8')); } catch (e) { errors.push(`invalid JSON: ${(e as Error).message}`); }
  const parsed = json ? RolePathFile.safeParse(json) : null;
  if (parsed && !parsed.success) errors.push(...issues(`paths/roles/${role}.json`, parsed.error));
  if (parsed?.success) {
    const p = parsed.data;
    if (p.role !== role) errors.push(`"role" must be "${role}"`);
    if (p.status !== 'draft') errors.push('new content must have status "draft"');
    const seen = new Set<string>();
    const used = new Set<string>();
    for (const u of p.units) {
      for (const id of [u.id, ...u.lessons.map((l) => l.id)]) {
        if (!id.startsWith(`${role}-`)) errors.push(`id "${id}" must start with "${role}-"`);
        if (seen.has(id) || otherIds.has(id)) errors.push(`duplicate id "${id}"`);
        seen.add(id);
      }
      for (const l of u.lessons) {
        l.questions.forEach((q, i) => { if (q.answer_index >= q.choices.length) errors.push(`${l.id} › questions.${i}: answer_index out of range`); });
        for (const tid of l.term_ids) {
          const owners = allTerms.get(tid);
          if (!owners) errors.push(`${l.id}: unknown term "${tid}"`);
          else if (!owners.includes(role)) warnings.push(`${l.id}: term "${tid}" is not tagged for ${role} (ok if it fits the situation)`);
          used.add(tid);
        }
      }
    }
    const answers = p.units.flatMap((u) => u.lessons.flatMap((l) => l.questions.map((q) => q.answer_index)));
    const firstShare = answers.filter((a) => a === 0).length / Math.max(1, answers.length);
    if (firstShare > 0.5) warnings.push(`${Math.round(firstShare * 100)} % of the correct answers are the first choice: vary answer_index`);
    console.log(`path: ${p.units.length} units, ${p.units.reduce((s, u) => s + u.lessons.length, 0)} lessons, ${used.size} distinct words`);
  }
}

const careerFile = join(dir, 'career', `${role}.json`);
if (existsSync(careerFile)) {
  const parsed = CareerFile.safeParse(JSON.parse(readFileSync(careerFile, 'utf8')));
  if (!parsed.success) errors.push(...issues(`career/${role}.json`, parsed.error));
  else {
    const otherQ = new Set<string>();
    for (const f of readdirSync(join(dir, 'career')).filter((f) => f.endsWith('.json') && f !== `${role}.json`)) {
      for (const q of (JSON.parse(readFileSync(join(dir, 'career', f), 'utf8')) as { questions: { id: string }[] }).questions) otherQ.add(q.id);
    }
    for (const q of parsed.data.questions) {
      if (!q.id.startsWith(`${role}-`)) errors.push(`question id "${q.id}" must start with "${role}-"`);
      if (otherQ.has(q.id)) errors.push(`duplicate question id "${q.id}"`);
      if (q.status !== 'draft') errors.push(`question ${q.id}: status must be "draft"`);
      if (q.roles.join() !== role) errors.push(`question ${q.id}: roles must be ["${role}"]`);
      q.vocabulary_term_ids.forEach((v) => { if (!allTerms.has(v)) errors.push(`question ${q.id}: unknown term "${v}"`); });
    }
    console.log(`career: ${parsed.data.questions.length} questions`);
  }
} else warnings.push(`no content/career/${role}.json yet`);

warnings.forEach((w) => console.log(`warning ${w}`));
errors.forEach((e) => console.error(`error ${e}`));
if (errors.length) { console.error(`\n✗ ${role}: ${errors.length} error(s)`); process.exit(1); }
console.log(`✓ ${role} ok`);
