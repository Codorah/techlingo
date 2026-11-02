// A job course ("parcours"): the role's work-situation units, a short recall unit after every
// two situation units (listen, say it out loud, quick quiz on the words just met), and a final
// mock interview built from the role's own interview questions. Everything unlocks in order.
// Node ids of situation units are the historical `sit:` ids, so existing progress stays valid.
import { LEVELS, type Level } from '@/content/levels';
import type { InterviewQuestion, ShippedPath } from '@/content/schema';
import type { NodeState, PathProgress } from './path';
import { guideId, lessonNodeId } from './situations';

export type CourseNodeKind = 'guide' | 'lesson' | 'recall' | 'interview';
export interface CourseNode {
  id: string;
  kind: CourseNodeKind;
  title: string;
  /** situation unit index for guide/lesson */
  unitIndex?: number;
  lessonIndex?: number;
  /** words practised by a recall node */
  termIds?: string[];
  /** interview question id */
  questionId?: string;
}
export type CourseUnitKind = 'situation' | 'recall' | 'interview';
export interface CourseUnit { id: string; kind: CourseUnitKind; number: number; title: string; subtitle?: string; level?: Level; nodes: CourseNode[] }
export interface Course { role: string; title: string; units: CourseUnit[]; nodes: CourseNode[] }

export const COURSE = { recallEvery: 2, recallNodes: 2, wordsPerRecall: 5, interviewQuestions: 4, minUnits: 3, tooEasyGap: 2 } as const;

/** A unit's level = the rounded mean level of the words its lessons teach (B1 when unknown). */
export function unitLevel(unit: Pick<ShippedPath['units'][number], 'lessons'>, terms: ShippedPath['terms']): Level {
  const levels = unit.lessons.flatMap((l) => l.term_ids).map((id) => terms[id]?.level).filter((l): l is Level => !!l).map((l) => LEVELS.indexOf(l));
  return levels.length ? LEVELS[Math.round(levels.reduce((a, b) => a + b, 0) / levels.length)]! : 'B1';
}

/**
 * The units worth doing at `level`: a unit two or more levels below the learner is skipped (they
 * already master it), but at least `minUnits` stay, keeping the hardest ones. Order is preserved.
 */
export function unitsForLevel(units: ShippedPath['units'], terms: ShippedPath['terms'], level?: Level | null) {
  const tagged = units.map((u, i) => ({ u, i, level: unitLevel(u, terms) }));
  if (!level) return tagged;
  const me = LEVELS.indexOf(level);
  const keep = new Set(tagged.filter((x) => LEVELS.indexOf(x.level) > me - COURSE.tooEasyGap).map((x) => x.i));
  if (keep.size < Math.min(COURSE.minUnits, tagged.length)) {
    for (const x of [...tagged].sort((a, b) => LEVELS.indexOf(b.level) - LEVELS.indexOf(a.level) || b.i - a.i)) {
      if (keep.size >= Math.min(COURSE.minUnits, tagged.length)) break;
      keep.add(x.i);
    }
  }
  return tagged.filter((x) => keep.has(x.i));
}

export const recallId = (role: string, n: number, k: number) => `rap:${role}:${n}:${k}`;
export const interviewNodeId = (role: string, questionId: string) => `itw:${role}:${questionId}`;

/** Spreads n items over k groups as evenly as possible, in order. */
function spread<T>(items: T[], k: number): T[][] {
  const out: T[][] = [];
  let start = 0;
  for (let g = 0; g < k; g++) {
    const end = start + Math.round((items.length - start) / (k - g));
    out.push(items.slice(start, end));
    start = end;
  }
  return out.filter((g) => g.length);
}

export interface CourseLabels {
  guide: string;
  recallTitle: (n: number) => string;
  recallSubtitle: string;
  recallNode: (k: number) => string;
  interviewTitle: string;
  interviewSubtitle: string;
}

export function buildCourse(role: string, path: Pick<ShippedPath, 'title_fr' | 'units'> & { terms?: ShippedPath['terms'] }, questions: InterviewQuestion[], labels: CourseLabels, level?: Level | null): Course {
  const units: CourseUnit[] = [];
  let number = 0;
  let recallCount = 0;
  let pending: string[] = [];

  const chosen = unitsForLevel(path.units, path.terms ?? {}, level);
  chosen.forEach(({ u, i: unitIndex, level: lvl }, pos) => {
    units.push({
      id: u.id, kind: 'situation', number: ++number, title: u.title_fr, subtitle: u.situation_fr, level: lvl,
      nodes: [
        { id: guideId(u.id), kind: 'guide', title: labels.guide, unitIndex },
        ...u.lessons.map((l, lessonIndex): CourseNode => ({ id: lessonNodeId(l.id), kind: 'lesson', title: l.title_fr, unitIndex, lessonIndex }))
      ]
    });
    pending.push(...u.lessons.flatMap((l) => l.term_ids));
    const last = pos === chosen.length - 1;
    if ((pos + 1) % COURSE.recallEvery === 0 || (last && pending.length)) {
      const words = [...new Set(pending)];
      const groups = spread(words, Math.min(COURSE.recallNodes, Math.ceil(words.length / 3))).map((g) => g.slice(0, COURSE.wordsPerRecall));
      recallCount++;
      units.push({
        id: `rap:${role}:${recallCount}`, kind: 'recall', number: ++number, title: labels.recallTitle(recallCount), subtitle: labels.recallSubtitle,
        nodes: groups.map((termIds, k) => ({ id: recallId(role, recallCount, k), kind: 'recall', title: labels.recallNode(k + 1), termIds }))
      });
      pending = [];
    }
  });

  const asked = questions.filter((q) => q.roles.includes(role)).slice(0, COURSE.interviewQuestions);
  if (asked.length) {
    units.push({
      id: `itw:${role}`, kind: 'interview', number: ++number, title: labels.interviewTitle, subtitle: labels.interviewSubtitle,
      nodes: asked.map((q) => ({ id: interviewNodeId(role, q.id), kind: 'interview', title: q.topic_fr, questionId: q.id }))
    });
  }
  return { role, title: path.title_fr, units, nodes: units.flatMap((u) => u.nodes) };
}

/** Nodes unlock one after another across the whole course. */
export function courseStates(course: Pick<Course, 'nodes'>, progress: PathProgress): Map<string, NodeState> {
  const states = new Map<string, NodeState>();
  let currentGiven = false;
  for (const n of course.nodes) {
    if (progress[n.id]) states.set(n.id, 'done');
    else if (!currentGiven) { states.set(n.id, 'current'); currentGiven = true; }
    else states.set(n.id, 'locked');
  }
  return states;
}

export function courseProgress(course: Pick<Course, 'nodes' | 'units'>, progress: PathProgress) {
  const done = course.nodes.filter((n) => progress[n.id]).length;
  const next = course.nodes.find((n) => !progress[n.id]);
  const unit = next ? course.units.find((u) => u.nodes.includes(next)) : undefined;
  return { done, total: course.nodes.length, ratio: course.nodes.length ? done / course.nodes.length : 0, next, unit };
}
