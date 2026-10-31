import Dexie from 'dexie';
import { afterEach, describe, expect, it } from 'vitest';
import { getDeviceId, SCHEMA_VERSION, TechLingoDB, USER_TABLES } from '@/db/db';

const opened: Dexie[] = [];
afterEach(async () => { for (const d of opened.splice(0)) { d.close(); await Dexie.delete(d.name); } });

describe('local database', () => {
  it('opens at the current schema version with every table', async () => {
    const db = new TechLingoDB('test-migrations-fresh');
    opened.push(db);
    await db.open();
    expect(db.verno).toBe(SCHEMA_VERSION);
    const names = db.tables.map((t) => t.name);
    for (const t of [...USER_TABLES, 'meta']) expect(names).toContain(t);
  });

  it('creates a stable device id once', async () => {
    const db = new TechLingoDB('test-migrations-device');
    opened.push(db);
    const a = await getDeviceId(db);
    const b = await getDeviceId(db);
    expect(a).toBe(b);
    expect((await db.meta.get('schemaVersion'))?.value).toBe(SCHEMA_VERSION);
  });

  it('reopening an existing database keeps its data', async () => {
    const name = 'test-migrations-reopen';
    const first = new TechLingoDB(name);
    await first.badges.put({ id: 'first-word', earnedAt: '2026-10-31T00:00:00.000Z', updatedAt: '2026-10-31T00:00:00.000Z', deviceId: 'd' });
    first.close();
    const second = new TechLingoDB(name);
    opened.push(second);
    expect(await second.badges.get('first-word')).toBeTruthy();
  });
  // When SCHEMA_VERSION 2 is added: create a v1 database with the v1 stores, write rows,
  // open it with TechLingoDB and assert the upgrade() result here.
});
