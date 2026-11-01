# Parcours par métier : cahier des charges

One file per job role: `content/paths/roles/<role>.json`, plus the role's own interview questions in
`content/career/<role>.json`. Check one role in isolation with:

```
npx tsx scripts/content/check-role.ts <role>
```

The learner is a French speaker who reads some English but cannot yet *speak* the English of their job.
Each path follows a real week of that job, situation by situation. Model: `content/paths/tech.json`
(same unit and lesson structure). Schema: `RolePathFile` and `CareerFile` in `src/content/schema.ts`.

## Path file

```jsonc
{
  "role": "<role>",
  "status": "draft",
  "title_fr": "L'anglais de ... (short, concrete)",
  "units": [ /* 5 to 6 units, ordered from everyday tasks to harder ones */ ]
}
```

Each unit:
- `id`: `<role>-<kebab-slug>` (every unit and lesson id starts with the role id, globally unique).
- `title_fr` (a task the learner will be able to do, e.g. "Présenter les résultats d'un audit"), `title_en`.
- `situation_fr`: 1 to 2 sentences, the concrete work situation, addressed with "tu".
- `guide`: `intro_fr` (80 to 140 words, explains the situation and the key English words in it),
  `key_phrases` (5 to 7 phrases really said at work, `en` + `fr`), `tip_fr` (one practical tip or a
  false friend of the trade, e.g. library ≠ librairie, actually ≠ actuellement).
- `lessons`: 3 to 4 lessons.

Each lesson:
- `id`: `<role>-<kebab-slug>`; `title_fr`: what the learner does ("Annoncer un incident", not "Leçon 1").
- `term_ids`: 3 to 6 ids of EXISTING words, taken from `content/roles/<role>.json` first (you may use a
  word of another role file if it fits; never invent an id). Spread the role's words: across the whole
  path, use as many different words of the role as you can (aim for 60+ distinct ids), and avoid reusing
  the same word in more than 2 lessons.
- `dialogue`: 4 to 6 lines between two colleagues (international first names, varied: Aïcha, Tomasz,
  Priya, Kenji, Lucía, Moussa, Sarah, Ivan…), natural workplace English (B1-B2, short sentences),
  every line with an accurate French translation. The lesson's words appear in the dialogue.
- `questions`: exactly 4. Mix: "Comment dire « … » ?", meaning of a phrase from the dialogue,
  fill the gap ("Complète : « … ___ … »"), choose the right reply in a situation. 3 choices each, one
  correct. `explanation_fr` explains why the answer is right AND why the wrong ones are wrong (common
  French speaker mistakes, calques, false friends). VARY `answer_index` (0, 1, 2), never always 0.
- `production`: the real-world task. `channel` one of slack, email, pull_request, standup, meeting,
  brief, report, social_post (pick the one this job really uses). `prompt_fr` (what to write or say),
  optional `context_en` (the message they answer), `model_answer_en` (2 to 4 sentences), `model_answer_fr`,
  `key_phrases` (2 to 5 short phrases that appear word for word in `model_answer_en`).

## Career file (role-specific interview questions)

```jsonc
{ "questions": [ /* 6 questions */ ], "verbs": [] }
```

Questions that are SPECIFIC to this job (a recruiter for this job would ask them; not "tell me about
yourself", which already exists for everyone). Mix: technical/job knowledge, a real case ("Walk me through
how you would…"), a past experience (STAR), tools and methods. Each: `id` `<role>-<slug>`, `status: "draft"`,
`roles: ["<role>"]`, `level` (B1/B2/C1), `topic_fr`, `question_en`, `question_fr`, `hint_fr`,
`answer_outline_fr` (3 to 5 steps), `model_answer_en` (60 to 110 words, first person, credible, no
invented company names or numbers presented as facts), `model_answer_fr`, `key_phrases` (3 to 6 phrases
present word for word in the model answer), `vocabulary_term_ids` (existing ids only).

## Rules
- Accurate, never invented: real practices, real tools, correct English. If you doubt a claim, keep it
  simpler or drop it (paths have no `review_note` field).
- French copy: correct accents, French typography (« », espace avant : ; ? !), no em-dash (—), tutoiement
  in the path, vouvoiement in interview `question_fr` (a recruiter speaks to a candidate).
- Use straight ASCII apostrophes or the typographic ’ consistently inside a file; valid JSON (UTF-8).
- Only write your own two files. Never edit other files.
