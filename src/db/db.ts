// Local-first user data (IndexedDB via Dexie). Nothing here ever leaves the device unless
// the user exports a backup. Every record carries id/updatedAt/deviceId/deletedAt so a sync
// backend can be added later without changing the model (spec §3.4).
import Dexie, { type EntityTable } from 'dexie';
import type { Level } from '@/content/schema';

export const SCHEMA_VERSION = 1;

export interface SyncFields {
  updatedAt: string; // ISO date
  deviceId: string;
  deletedAt?: string; // soft delete
}

export interface MetaRow { key: string; value: unknown }
export interface SettingRow { key: string; value: unknown; updatedAt: string }

export interface Profile extends SyncFields {
  id: 'me';
  displayName: string;
  avatar: string;
  primaryRole: string | null;
  secondaryRoles: string[];
  level: Level | null;
  goal: 'docs' | 'work' | 'interviews' | 'vocabulary' | null;
  dailyMinutes: 5 | 10 | 15 | 20;
  reminderTime: string | null; // "HH:mm"
  timezone: string;
  xp: number;
  streak: number;
  bestStreak: number;
  lastActiveDay: string | null; // "YYYY-MM-DD" in the device timezone
  streakFreezes: number;
  onboardedAt: string | null;
  createdAt: string;
}

export interface FsrsCard {
  due: string;
  stability: number;
  difficulty: number;
  scheduledDays: number;
  learningSteps: number;
  reps: number;
  lapses: number;
  state: number; // ts-fsrs State: 0 New, 1 Learning, 2 Review, 3 Relearning
  lastReview?: string;
}

export interface UserTerm extends SyncFields {
  termId: string;
  state: 'new' | 'learning' | 'mastered';
  card: FsrsCard | null;
  favorite: boolean;
  notes: string;
}

export interface ReviewLog extends SyncFields { id: string; termId: string; rating: 1 | 2 | 3 | 4; reviewedAt: string; cardBefore: FsrsCard | null }
export interface Spin extends SyncFields { id: string; termId: string; mode: 'random' | 'category'; category?: string; day: string; spunAt: string; isBonus: boolean }
export interface LessonSession extends SyncFields { id: string; termId: string; step: number; score: number | null; xpEarned: number; startedAt: string; completedAt?: string }
export interface SpeakingAttempt extends SyncFields { id: string; sentenceId: string; termId: string; transcript: string; score: number; recognizedRatio: number; selfRated?: 'easy' | 'hard'; createdAt: string }
export interface QuizAttempt extends SyncFields { id: string; questionId: string; termId: string; correct: boolean; response: unknown; createdAt: string }
export interface WordSeed extends SyncFields { id: string; text: string; context: string; sourceUrl?: string; termId?: string; status: 'new' | 'linked' | 'archived'; createdAt: string }
export interface Collection extends SyncFields { id: string; name: string }
export interface CollectionTerm extends SyncFields { id: string; collectionId: string; termId: string }
export interface InterviewSession extends SyncFields { id: string; role: string; mode: 'written' | 'spoken'; report: unknown; createdAt: string }
export interface AnswerDraft extends SyncFields { id: string; questionId: string; text: string; checklist: Record<string, boolean> }
export interface EarnedBadge extends SyncFields { id: string; earnedAt: string }
export interface LocalEvent { id: string; name: string; props: Record<string, unknown>; createdAt: string }

export class TechLingoDB extends Dexie {
  meta!: EntityTable<MetaRow, 'key'>;
  settings!: EntityTable<SettingRow, 'key'>;
  profile!: EntityTable<Profile, 'id'>;
  userTerms!: EntityTable<UserTerm, 'termId'>;
  reviewLog!: EntityTable<ReviewLog, 'id'>;
  spins!: EntityTable<Spin, 'id'>;
  lessonSessions!: EntityTable<LessonSession, 'id'>;
  speakingAttempts!: EntityTable<SpeakingAttempt, 'id'>;
  quizAttempts!: EntityTable<QuizAttempt, 'id'>;
  wordSeeds!: EntityTable<WordSeed, 'id'>;
  collections!: EntityTable<Collection, 'id'>;
  collectionTerms!: EntityTable<CollectionTerm, 'id'>;
  interviewSessions!: EntityTable<InterviewSession, 'id'>;
  answerDrafts!: EntityTable<AnswerDraft, 'id'>;
  badges!: EntityTable<EarnedBadge, 'id'>;
  localEvents!: EntityTable<LocalEvent, 'id'>;

  constructor(name = 'techlingo') {
    super(name);
    // Version history. Never edit a past version: add a new one with an upgrade() and a test
    // in tests/db.migrations.test.ts.
    this.version(1).stores({
      meta: 'key',
      settings: 'key',
      profile: 'id',
      userTerms: 'termId, state, card.due, favorite, updatedAt',
      reviewLog: 'id, termId, reviewedAt',
      spins: 'id, termId, day, spunAt',
      lessonSessions: 'id, termId, startedAt',
      speakingAttempts: 'id, sentenceId, termId, createdAt',
      quizAttempts: 'id, questionId, termId, createdAt',
      wordSeeds: 'id, termId, status, createdAt',
      collections: 'id, updatedAt',
      collectionTerms: 'id, collectionId, termId, [collectionId+termId]',
      interviewSessions: 'id, role, createdAt',
      answerDrafts: 'id, questionId, updatedAt',
      badges: 'id',
      localEvents: 'id, name, createdAt'
    });
  }
}

export const USER_TABLES = [
  'settings', 'profile', 'userTerms', 'reviewLog', 'spins', 'lessonSessions', 'speakingAttempts', 'quizAttempts',
  'wordSeeds', 'collections', 'collectionTerms', 'interviewSessions', 'answerDrafts', 'badges', 'localEvents'
] as const;
export type UserTable = (typeof USER_TABLES)[number];

export const db = new TechLingoDB();

export const uuid = () => crypto.randomUUID();
export const nowIso = () => new Date().toISOString();

/** Stable per-install identifier, created on first launch. */
export async function getDeviceId(database: TechLingoDB = db): Promise<string> {
  const row = await database.meta.get('deviceId');
  if (row && typeof row.value === 'string') return row.value;
  const id = uuid();
  await database.meta.put({ key: 'deviceId', value: id });
  await database.meta.put({ key: 'installedAt', value: nowIso() });
  await database.meta.put({ key: 'schemaVersion', value: SCHEMA_VERSION });
  return id;
}

/** Asks the browser not to evict our data (most effective once the PWA is installed). */
export async function requestPersistence(): Promise<boolean> {
  try { return (await navigator.storage?.persist?.()) ?? false; } catch { return false; }
}
