// Progress export / import (spec §3.3, §3.4). The file is versioned and carries a SHA-256
// checksum of its data. Import validates everything before touching the database and merges
// record by record: newest `updatedAt` wins, append-only logs are unioned.
import { z } from 'zod';
import { getDeviceId, nowIso, SCHEMA_VERSION, type TechLingoDB, USER_TABLES, type UserTable } from '@/db/db';

export const BACKUP_FORMAT = 'techlingo-backup';
export const BACKUP_VERSION = 1;
export const MAX_BACKUP_BYTES = 10 * 1024 * 1024;

const APPEND_ONLY: ReadonlySet<UserTable> = new Set(['reviewLog', 'quizAttempts', 'speakingAttempts', 'localEvents']);

const Row = z.record(z.string(), z.unknown());
export const BackupEnvelope = z.object({
  format: z.literal(BACKUP_FORMAT),
  version: z.number().int().positive(),
  schemaVersion: z.number().int().positive(),
  exportedAt: z.string(),
  deviceId: z.string(),
  contentVersion: z.string().optional(),
  checksum: z.string().regex(/^[a-f0-9]{64}$/),
  data: z.record(z.string(), z.array(Row))
});
export type BackupEnvelope = z.infer<typeof BackupEnvelope>;

export class BackupError extends Error {
  constructor(public code: 'too_large' | 'not_json' | 'bad_format' | 'too_new' | 'checksum', message: string) { super(message); }
}

/** JSON with sorted object keys, so the checksum does not depend on key order. */
export function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  if (value && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, v]) => v !== undefined)
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
    return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${canonicalJson(v)}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

export async function sha256Hex(text: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function createBackup(database: TechLingoDB, contentVersion?: string): Promise<BackupEnvelope> {
  const data: Record<string, Record<string, unknown>[]> = {};
  for (const name of USER_TABLES) data[name] = (await database.table(name).toArray()) as Record<string, unknown>[];
  const envelope: BackupEnvelope = {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    schemaVersion: SCHEMA_VERSION,
    exportedAt: nowIso(),
    deviceId: await getDeviceId(database),
    contentVersion,
    checksum: await sha256Hex(canonicalJson(data)),
    data
  };
  await database.meta.put({ key: 'lastBackupAt', value: envelope.exportedAt });
  return envelope;
}

export const backupFileName = (d = new Date()) => `techlingo-sauvegarde-${d.toISOString().slice(0, 10)}.json`;

/** Validates a backup file's text without writing anything. */
export async function parseBackup(text: string): Promise<BackupEnvelope> {
  if (new Blob([text]).size > MAX_BACKUP_BYTES) throw new BackupError('too_large', 'Backup file is too large');
  let json: unknown;
  try { json = JSON.parse(text); } catch { throw new BackupError('not_json', 'Not a JSON file'); }
  const parsed = BackupEnvelope.safeParse(json);
  if (!parsed.success) throw new BackupError('bad_format', 'Not a TechLingo backup');
  const env = parsed.data;
  if (env.version > BACKUP_VERSION || env.schemaVersion > SCHEMA_VERSION) {
    throw new BackupError('too_new', 'Backup made by a newer version of the app');
  }
  if ((await sha256Hex(canonicalJson(env.data))) !== env.checksum) throw new BackupError('checksum', 'Backup file is corrupted');
  return migrateBackup(env);
}

/** Upgrades older backup formats to the current one. Add a step here for each new version. */
function migrateBackup(env: BackupEnvelope): BackupEnvelope {
  return env; // v1 is the first format
}

export interface ImportReport { added: number; updated: number; kept: number; rejected: number }

const time = (v: unknown) => (typeof v === 'string' ? Date.parse(v) || 0 : 0);

/** Decides which version of a record survives a merge. */
function incomingWins(table: UserTable, existing: Record<string, unknown>, incoming: Record<string, unknown>): boolean {
  if (table === 'userTerms') {
    // Keep the card that saw the latest review; the full review history is kept in reviewLog.
    const a = time((existing.card as { lastReview?: string } | null)?.lastReview);
    const b = time((incoming.card as { lastReview?: string } | null)?.lastReview);
    if (a !== b) return b > a;
  }
  return time(incoming.updatedAt) > time(existing.updatedAt);
}

export async function importBackup(database: TechLingoDB, env: BackupEnvelope): Promise<ImportReport> {
  const report: ImportReport = { added: 0, updated: 0, kept: 0, rejected: 0 };
  const tables = USER_TABLES.map((n) => database.table(n));
  await database.transaction('rw', tables, async () => {
    for (const name of USER_TABLES) {
      const rows = env.data[name];
      if (!rows) continue;
      const table = database.table(name);
      const keyPath = table.schema.primKey.keyPath as string;
      for (const row of rows) {
        const key = row[keyPath];
        if (typeof key !== 'string' || !key) { report.rejected++; continue; }
        const existing = (await table.get(key)) as Record<string, unknown> | undefined;
        if (!existing) { await table.put(row); report.added++; continue; }
        if (APPEND_ONLY.has(name)) { report.kept++; continue; }
        if (incomingWins(name, existing, row)) {
          const merged = name === 'profile'
            ? { ...row, bestStreak: Math.max(Number(row.bestStreak) || 0, Number(existing.bestStreak) || 0) }
            : row;
          await table.put(merged);
          report.updated++;
        } else report.kept++;
      }
    }
  });
  return report;
}

export async function lastBackupAt(database: TechLingoDB): Promise<string | null> {
  const row = await database.meta.get('lastBackupAt');
  return typeof row?.value === 'string' ? row.value : null;
}

/** Wipes every user table (meta keeps the deviceId). Used by "Tout effacer". */
export async function wipeUserData(database: TechLingoDB): Promise<void> {
  await database.transaction('rw', USER_TABLES.map((n) => database.table(n)), async () => {
    for (const name of USER_TABLES) await database.table(name).clear();
  });
  await database.meta.delete('lastBackupAt');
}
