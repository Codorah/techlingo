// npm run content:validate  — fails (exit 1) on any schema or cross-reference error.
// npm run content:stats     — also prints coverage per role and level.
import { coverage, loadContent } from './lib';

const content = loadContent();
for (const w of content.warnings) console.warn(`warn  ${w}`);
for (const e of content.errors) console.error(`error ${e}`);

console.log(`\n${content.terms.length} terms · ${content.roles.length} roles · ${content.categories.length} categories · contentVersion ${content.contentVersion}`);
if (process.argv.includes('--stats')) console.table(coverage(content));

if (content.errors.length) {
  console.error(`\n✗ ${content.errors.length} error(s)`);
  process.exit(1);
}
console.log('✓ content is valid');
