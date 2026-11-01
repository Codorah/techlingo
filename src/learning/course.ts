// A job course ("parcours"): the role's work-situation units, a short recall unit after every
// two situation units (listen, say it out loud, quick quiz on the words just met), and a final
// mock interview built from the role's own interview questions. Everything unlocks in order.
// Node ids of situation units are the historical `sit:` ids, so existing progress stays valid.
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
export interface CourseUnit { id: string; kind: CourseUnitKind; number: number; title: string; subtitle?: string; nodes: CourseNode[] }
export interface Course { role: string; title: string; units: CourseUnit[]; nodes: CourseNode[] }

export const COURSE = { recallEvery: 2, recallNodes: 2, wordsPerRecall: 5, interviewQuestions: 4 } as const;

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

export function buildCourse(role: string, path: Pick<ShippedPath, 'title_fr' | 'units'>, questions: InterviewQuestion[], labels: CourseLabels): Course {
  const units: CourseUnit[] = [];
  let number = 0;
  let recallCount = 0;
  let pending: string[] = [];

  path.units.forEach((u, unitIndex) => {
    units.push({
      id: u.id, kind: 'situation', number: ++number, title: u.title_fr, subtitle: u.situation_fr,
      nodes: [
        { id: guideId(u.id), kind: 'guide', title: labels.guide, unitIndex },
        ...u.lessons.map((l, lessonIndex): CourseNode => ({ id: lessonNodeId(l.id), kind: 'lesson', title: l.title_fr, unitIndex, lessonIndex }))
      ]
    });
    pending.push(...u.lessons.flatMap((l) => l.term_ids));
    const last = unitIndex === path.units.length - 1;
    if ((unitIndex + 1) % COURSE.recallEvery === 0 || (last && pending.length)) {
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
