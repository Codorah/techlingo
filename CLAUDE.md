# TechLingo: working notes for Claude

Read PRODUCT.md first (who it is for, what it must feel like). This file is how to work in the repo.

## Working agreement with the owner
- Answer in **French**; code, identifiers and commit subjects stay in English or French as already used.
- **Commit and push to GitHub after every finished step**, then give a short audit (what changed, what is left). Don't ask before each step; keep going until the list is done.
- The owner deploys on Vercel (project `techlingo`, auto-deploy from `main`). PWA only: **no APK** anymore.
- Never publish the owner's personal email; legal pages use the placeholder `À_REMPLACER_EMAIL_DE_CONTACT`.
- Content must be accurate, never invented: new words are `status: draft`, doubts go in `review_note`.
- Destructive shell commands (`rm`) are blocked here: don't work around it, use new paths instead.

## Stack
React 19 + Vite + TypeScript + Tailwind v4 (`@theme` tokens in `src/styles/index.css`), wouter, Dexie (IndexedDB), Zod (content schema, build-time only), i18next (`src/i18n/fr.json`, every UI string), lucide-react icons, ts-fsrs, MiniSearch, vite-plugin-pwa (auto-update, see `src/app/UpdatePrompt.tsx`).

Legacy `www/` is the old app: not deployed, don't edit. `npm start` serves it; the real app is `npm run app:dev`.

## Commands
- `npm run app:dev` / `npm run app:build:drafts` (what Vercel runs) / `npm run app:preview`
- `npm test` (vitest), `npm run typecheck`
- `npm run content:validate`, `npm run content:import`, `npm run content:build -- --drafts`

## Content pipeline
- `content/domains.json` (tech, marketing; each has a `generalRole`), `content/roles.json` (role → domain), `content/categories.json` (themes, with `course_fr` / `tip_fr` mini-course).
- Words are written in `content/import/NN-*.txt`, one per line:
  `id | level | roles(role:prio,...) | categories | pos | term_en | translation_fr | definition_en | explanation_fr | why_it_matters_fr | ex1_en | ex1_fr | ex2_en | ex2_fr [| review_note]`
  ids and `term_en` are unique across all files (check before writing). Then `content:import` writes `content/roles/<role>.json`.
- Always run import/validate with `set -o pipefail` so a failure stops the commit.
- Build output: `public/content/manifest.json`, `packs/<role>.json` (+ search index, auto quiz), `career.json`.

## App structure
- Domain is derived from the primary role (`src/lib/domains.ts`), so no DB field for it.
- Learning path engine: `src/learning/path.ts` (units, node states; progress planned in settings key, no DB migration).
- Progress logic: `src/data/progress.ts`; DB schema `src/db/db.ts` (bump SCHEMA_VERSION with a migration test if tables change).
- Theme: light by default everywhere (`index.html` inline script); dark only via the profile toggle (`localStorage['techlingo.theme']`).

## Design rules
Follow PRODUCT.md and the impeccable skill (register: product). No emojis as icons, no gradient text, no glass cards, cards ≤ 16px radius, one primary action per screen, reduced-motion fallback for every animation, French copy without em-dashes.
