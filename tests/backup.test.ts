import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { BackupError, canonicalJson, createBackup, importBackup, parseBackup, wipeUserData } from '@/data/backup';
import { getDeviceId, TechLingoDB, USER_TABLES } from '@/db/db';

let db: TechLingoDB;
let n = 0;

beforeEach(async () => { db = new TechLingoDB(`test-backup-${n++}`); await db.open(); });
afterEach(async () => { await db.delete(); });

const iso = (d: string) => new Date(d).toISOString();

async function seed(database: TechLingoDB) {
  const deviceId = await getDeviceId(database);
  await database.profile.put({
    id: 'me', displayName: 'Ama', avatar: 'sky', primaryRole: 'web-developer', secondaryRoles: ['mobile-developer'],
    level: 'B1', goal: 'interviews', dailyMinutes: 10, reminderTime: '19:00', timezone: 'Africa/Lome', xp: 340, streak: 4,
    bestStreak: 9, lastActiveDay: '2026-10-30', streakFreezes: 1, onboardedAt: iso('2026-10-01'), createdAt: iso('2026-10-01'),
    updatedAt: iso('2026-10-30'), deviceId
  });
  await database.userTerms.bulkPut([
    { termId: 'rest-api', state: 'learning', card: { due: iso('2026-11-02'), stability: 3.1, difficulty: 5.2, scheduledDays: 3, learningSteps: 0, reps: 2, lapses: 0, state: 2, lastReview: iso('2026-10-30') }, favorite: true, notes: 'vu en réunion', updatedAt: iso('2026-10-30'), deviceId },
    { termId: 'webhook', state: 'new', card: null, favorite: false, notes: '', updatedAt: iso('2026-10-29'), deviceId }
  ]);
  await database.reviewLog.put({ id: 'r1', termId: 'rest-api', rating: 3, reviewedAt: iso('2026-10-30'), cardBefore: null, updatedAt: iso('2026-10-30'), deviceId });
  await database.wordSeeds.put({ id: 'w1', text: 'idempotency key', context: 'Stripe docs', status: 'new', createdAt: iso('2026-10-28'), updatedAt: iso('2026-10-28'), deviceId });
}

async function snapshot(database: TechLingoDB) {
  const out: Record<string, unknown[]> = {};
  for (const t of USER_TABLES) out[t] = await database.table(t).toArray();
  return canonicalJson(out);
}

describe('backup', () => {
  it('export → wipe → import restores every record without loss', async () => {
    await seed(db);
    const before = await snapshot(db);
    const file = JSON.stringify(await createBackup(db, 'abc123'));
    await wipeUserData(db);
    expect(await db.profile.count()).toBe(0);
    const report = await importBackup(db, await parseBackup(file));
    expect(report.rejected).toBe(0);
    expect(await snapshot(db)).toBe(before);
  });

  it('records the last backup date', async () => {
    await seed(db);
    const env = await createBackup(db);
    expect((await db.meta.get('lastBackupAt'))?.value).toBe(env.exportedAt);
  });

  it('rejects a tampered file', async () => {
    await seed(db);
    const env = await createBackup(db);
    (env.data.profile![0] as { xp: number }).xp = 999999;
    await expect(parseBackup(JSON.stringify(env))).rejects.toMatchObject({ code: 'checksum' });
  });

  it('rejects non-JSON, foreign JSON and backups from a newer app', async () => {
    await expect(parseBackup('not json')).rejects.toBeInstanceOf(BackupError);
    await expect(parseBackup(JSON.stringify({ hello: 'world' }))).rejects.toMatchObject({ code: 'bad_format' });
    await seed(db);
    const env = await createBackup(db);
    await expect(parseBackup(JSON.stringify({ ...env, version: 99 }))).rejects.toMatchObject({ code: 'too_new' });
  });

  it('merges: newest record wins, logs are unioned, local-only data is kept', async () => {
    await seed(db);
    const env = await createBackup(db);
    // Another phone: newer profile, an older copy of a term, one extra review.
    env.data.profile = [{ ...env.data.profile![0], xp: 500, bestStreak: 3, updatedAt: iso('2026-10-31') }];
    env.data.userTerms = [{ ...env.data.userTerms![1], notes: 'ancienne note', updatedAt: iso('2026-10-01') }];
    env.data.reviewLog = [...env.data.reviewLog!, { ...env.data.reviewLog![0], id: 'r2', reviewedAt: iso('2026-10-31') }];
    const { canonicalJson: cj, sha256Hex } = await import('@/data/backup');
    env.checksum = await sha256Hex(cj(env.data));
    await db.wordSeeds.put({ id: 'w2', text: 'rate limit', context: '', status: 'new', createdAt: iso('2026-10-31'), updatedAt: iso('2026-10-31'), deviceId: 'local' });

    await importBackup(db, await parseBackup(JSON.stringify(env)));
    const profile = await db.profile.get('me');
    expect(profile?.xp).toBe(500); // newer wins
    expect(profile?.bestStreak).toBe(9); // best streak never goes down
    expect((await db.userTerms.get('webhook'))?.notes).toBe(''); // local copy was newer
    expect(await db.reviewLog.count()).toBe(2); // union
    expect(await db.wordSeeds.get('w2')).toBeTruthy(); // untouched local data
  });
});
