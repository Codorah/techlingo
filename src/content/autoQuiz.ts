// Builds quiz questions from a term's own validated fields, so no question is invented.
// Distractors come from other terms of the same pack. Deterministic: same input, same output.
import type { QuizQuestion, Term } from './schema';

function seeded(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) { h ^= seed.charCodeAt(i); h = Math.imul(h, 16777619); }
  return () => { h ^= h << 13; h ^= h >>> 17; h ^= h << 5; return ((h >>> 0) % 100000) / 100000; };
}
function shuffle<T>(arr: T[], rand: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [a[i], a[j]] = [a[j]!, a[i]!]; }
  return a;
}
const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Picks distractors, preferring terms that share a category (harder, more meaningful). */
function distractors(term: Term, pool: Term[], n: number, rand: () => number): Term[] {
  const others = pool.filter((t) => t.id !== term.id && t.translation_fr !== term.translation_fr && t.term_en !== term.term_en);
  const close = shuffle(others.filter((t) => t.categories.some((c) => term.categories.includes(c))), rand);
  const far = shuffle(others.filter((t) => !close.includes(t)), rand);
  return [...close, ...far].slice(0, n);
}

function withAnswer(correct: string, wrong: string[], rand: () => number) {
  const choices = shuffle([correct, ...wrong], rand);
  return { choices, answer_index: choices.indexOf(correct) };
}

export function autoQuiz(term: Term, pool: Term[]): QuizQuestion[] {
  const rand = seeded(term.id);
  const out: QuizQuestion[] = [];
  const d = distractors(term, pool, 3, rand);
  if (d.length < 2) return out;

  out.push({
    id: `auto-${term.id}-meaning`,
    type: 'mcq',
    payload: {
      prompt_fr: `Que veut dire « ${term.term_en} » ?`,
      ...withAnswer(term.translation_fr, d.map((t) => t.translation_fr), rand),
      explanation_fr: `${term.term_en} : ${term.explanation_fr}`
    }
  });

  const re = new RegExp(`\\b${escapeRe(term.term_en)}\\b`, 'i');
  const sentence = term.sentences.find((s) => re.test(s.text_en));
  if (sentence) {
    out.push({
      id: `auto-${term.id}-gap`,
      type: 'fill_gap',
      payload: {
        sentence_en: sentence.text_en.replace(re, '___'),
        answer: term.term_en,
        choices: withAnswer(term.term_en, d.map((t) => t.term_en), rand).choices,
        explanation_fr: sentence.text_fr
      }
    });
  }

  out.push({
    id: `auto-${term.id}-definition`,
    type: 'mcq',
    payload: {
      prompt_fr: `Quel terme correspond à cette définition ? « ${term.definition_en} »`,
      ...withAnswer(term.term_en, d.map((t) => t.term_en), rand),
      explanation_fr: `C’est « ${term.term_en} » (${term.translation_fr}).`
    }
  });

  if (term.sentences[0]) out.push({ id: `auto-${term.id}-speak`, type: 'speak_it', payload: { sentence_id: term.sentences[0].id } });
  return out;
}
