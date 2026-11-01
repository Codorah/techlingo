// Content schema, shared by the build scripts (validation) and the app (runtime parsing of packs).
import { z } from 'zod';

import { LEVELS } from './levels';

export { LEVELS };
export const Level = z.enum(LEVELS);
export type Level = z.infer<typeof Level>;

export const Status = z.enum(['draft', 'in_review', 'validated', 'deprecated']);
export type Status = z.infer<typeof Status>;

export const Slug = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'must be a kebab-case slug');

const text = z.string().trim().min(2);

export const Sentence = z.object({
  id: Slug,
  text_en: text,
  text_fr: text,
  audio: z.string().optional()
});
export type Sentence = z.infer<typeof Sentence>;

const choices = z.array(text).min(2).max(5);
const answerIndex = z.number().int().nonnegative();
const explanation = text;

const withAnswer = <T extends { choices: string[]; answer_index: number }>(p: T) => p.answer_index < p.choices.length;
const answerMsg = { message: 'answer_index is out of range' };

export const QuizQuestion = z.discriminatedUnion('type', [
  z.object({
    id: Slug, type: z.literal('mcq'),
    payload: z.object({ prompt_fr: text, choices, answer_index: answerIndex, explanation_fr: explanation }).refine(withAnswer, answerMsg)
  }),
  z.object({
    id: Slug, type: z.literal('fill_gap'),
    payload: z.object({ sentence_en: text.refine((s) => s.includes('___'), 'sentence_en must contain ___'), answer: text, choices: choices.optional(), explanation_fr: explanation })
  }),
  z.object({
    id: Slug, type: z.literal('match_words'),
    payload: z.object({ pairs: z.array(z.object({ en: text, fr: text })).min(2).max(6) })
  }),
  z.object({
    id: Slug, type: z.literal('translate_in_context'),
    payload: z.object({ sentence_en: text, choices, answer_index: answerIndex, explanation_fr: explanation }).refine(withAnswer, answerMsg)
  }),
  z.object({
    id: Slug, type: z.literal('real_situation'),
    payload: z.object({ situation_fr: text, choices, answer_index: answerIndex, explanation_fr: explanation }).refine(withAnswer, answerMsg)
  }),
  z.object({
    id: Slug, type: z.literal('listen_and_pick'),
    payload: z.object({ audio_text_en: text, choices, answer_index: answerIndex }).refine(withAnswer, answerMsg)
  }),
  z.object({
    id: Slug, type: z.literal('speak_it'),
    payload: z.object({ sentence_id: Slug })
  })
]);
export type QuizQuestion = z.infer<typeof QuizQuestion>;

export const PartOfSpeech = z.enum(['noun', 'verb', 'adjective', 'adverb', 'phrase', 'acronym']);

export const Term = z
  .object({
    id: Slug,
    status: Status,
    level: Level,
    roles: z.array(z.object({ role: Slug, priority: z.number().int().min(0).max(100) })).min(1),
    categories: z.array(Slug).min(1),
    term_en: text,
    translation_fr: text,
    ipa: z.string().optional(),
    part_of_speech: PartOfSpeech,
    definition_en: text,
    explanation_fr: text,
    why_it_matters_fr: text,
    context_fr: z.array(text).default([]),
    sentences: z.array(Sentence).min(1),
    common_mistakes: z.array(z.object({ wrong: text, right: text, note_fr: z.string().optional() })).default([]),
    related_terms: z.array(Slug).default([]),
    deprecated: z.boolean().optional(),
    replacedBy: Slug.optional(),
    quiz: z.array(QuizQuestion).default([]),
    review_note: z.string().optional()
  })
  .superRefine((t, ctx) => {
    if ((t.deprecated || t.status === 'deprecated') && !t.replacedBy) {
      ctx.addIssue({ code: 'custom', message: 'a deprecated term needs replacedBy', path: ['replacedBy'] });
    }
    if (t.status === 'validated') {
      if (t.sentences.length < 2) ctx.addIssue({ code: 'custom', message: 'validated terms need at least 2 sentences', path: ['sentences'] });
      if (t.quiz.length < 3) ctx.addIssue({ code: 'custom', message: 'validated terms need at least 3 quiz questions', path: ['quiz'] });
      if (t.review_note) ctx.addIssue({ code: 'custom', message: 'resolve review_note before validating', path: ['review_note'] });
    }
    const sentenceIds = new Set(t.sentences.map((s) => s.id));
    t.quiz.forEach((q, i) => {
      if (q.type === 'speak_it' && !sentenceIds.has(q.payload.sentence_id)) {
        ctx.addIssue({ code: 'custom', message: `unknown sentence_id ${q.payload.sentence_id}`, path: ['quiz', i] });
      }
    });
  });
export type Term = z.infer<typeof Term>;

export const RoleFile = z.object({ role: Slug, terms: z.array(Term) });

// A domain groups job roles (IT, digital marketing…). Its general role holds the basics
// shared by every role of the domain and the interview questions asked to everyone.
export const Domain = z.object({ id: Slug, name_fr: text, name_en: text, icon: z.string(), description_fr: text, generalRole: Slug });
export type Domain = z.infer<typeof Domain>;

export const Role = z.object({ id: Slug, domain: Slug, name_fr: text, name_en: text, icon: z.string(), description_fr: text });
export type Role = z.infer<typeof Role>;

// course_fr / tip_fr: the mini-course that opens each learning-path unit on this theme.
export const Category = z.object({ id: Slug, name_fr: text, name_en: text, icon: z.string(), course_fr: text.optional(), tip_fr: text.optional() });
export type Category = z.infer<typeof Category>;

// Generated by scripts/content/build.ts and fetched by the app.
export const Manifest = z.object({
  contentVersion: z.string(),
  builtAt: z.string(),
  includesDrafts: z.boolean(),
  totalTerms: z.number().int(),
  domains: z.array(Domain.extend({ termCount: z.number().int() })),
  roles: z.array(Role.extend({ termCount: z.number().int(), categories: z.array(Slug) })),
  categories: z.array(Category),
  paths: z.array(Slug).default([]) // domains that have a hand-written path in /content/paths/
});
export type Manifest = z.infer<typeof Manifest>;

export const RolePack = z.object({
  role: Slug,
  contentVersion: z.string(),
  terms: z.array(Term),
  searchIndex: z.unknown()
});
export type RolePack = z.infer<typeof RolePack>;

// Career content (content/career/*.json)
export const InterviewQuestion = z.object({
  id: Slug,
  status: Status,
  roles: z.array(Slug).min(1), // a domain's general role (e.g. "general-tech") = asked to everyone in it
  level: Level,
  topic_fr: text,
  question_en: text,
  question_fr: text,
  hint_fr: text,
  answer_outline_fr: z.array(text).min(2).max(6),
  model_answer_en: text,
  model_answer_fr: text,
  key_phrases: z.array(text).min(2).max(8),
  vocabulary_term_ids: z.array(Slug).default([])
});
export type InterviewQuestion = z.infer<typeof InterviewQuestion>;

export const ActionVerb = z.object({ id: Slug, verb: text, meaning_fr: text, example_en: text, example_fr: text });
export type ActionVerb = z.infer<typeof ActionVerb>;

export const CareerFile = z.object({ questions: z.array(InterviewQuestion), verbs: z.array(ActionVerb).default([]) });

export const CareerPack = z.object({ contentVersion: z.string(), questions: z.array(InterviewQuestion), verbs: z.array(ActionVerb) });
export type CareerPack = z.infer<typeof CareerPack>;

// Hand-written learning paths (content/paths/<domain>.json): units built around real work
// situations. Each lesson teaches a few dictionary words in context and ends with a
// "Real World Challenge": something the learner would actually write or say at work.
const PathLine = z.object({ speaker: text, text_en: text, text_fr: text });
const PathQuestion = z.object({ prompt_fr: text, choices: z.array(text).min(2).max(4), answer_index: z.number().int().min(0), explanation_fr: text })
  .refine((q) => q.answer_index < q.choices.length, { message: 'answer_index out of range' });
export const PathLesson = z.object({
  id: Slug,
  title_fr: text,
  term_ids: z.array(Slug).min(3).max(6),
  dialogue: z.array(PathLine).min(2).max(8),
  questions: z.array(PathQuestion).min(3).max(6),
  production: z.object({
    channel: z.enum(['slack', 'email', 'pull_request', 'standup', 'meeting', 'brief', 'report', 'social_post']),
    prompt_fr: text,
    context_en: text.optional(),
    model_answer_en: text,
    model_answer_fr: text,
    key_phrases: z.array(text).min(2).max(6)
  })
});
export type PathLesson = z.infer<typeof PathLesson>;
export const PathUnitDef = z.object({
  id: Slug,
  title_fr: text,
  title_en: text,
  situation_fr: text,
  guide: z.object({ intro_fr: text, key_phrases: z.array(z.object({ en: text, fr: text })).min(3).max(8), tip_fr: text }),
  lessons: z.array(PathLesson).min(3).max(4)
});
export type PathUnitDef = z.infer<typeof PathUnitDef>;
export const PathFile = z.object({ domain: Slug, status: Status, title_fr: text, units: z.array(PathUnitDef).min(1).max(6) });
export type PathFile = z.infer<typeof PathFile>;
