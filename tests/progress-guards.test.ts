import { describe, expect, it } from 'vitest';
import { completeNode, PATH_XP } from '@/data/path';
import { completeLesson, getProfile, saveProfile, startLesson } from '@/data/progress';
import { db } from '@/db/db';
import { withArticle } from '@/screens/career/PitchScreen';

describe('double taps never count twice', () => {
  it('two concurrent completeNode calls for one node record and reward it once', async () => {
    await saveProfile({ xp: 0 });
    const [a, b] = await Promise.all([completeNode('test:node:a', 'course'), completeNode('test:node:a', 'course')]);
    expect(a).toEqual(b);
    expect(a.firstTime).toBe(true);
    expect((await getProfile())!.xp).toBe(PATH_XP.course);
  });

  it('two different nodes finished together are both kept', async () => {
    await Promise.all([completeNode('test:node:b', 'course'), completeNode('test:node:c', 'course')]);
    const progress = (await db.settings.get('pathProgress'))!.value as Record<string, unknown>;
    expect(progress['test:node:b']).toBeTruthy();
    expect(progress['test:node:c']).toBeTruthy();
  });

  it('completeLesson called twice on one session awards XP and schedules the word once', async () => {
    await saveProfile({ xp: 0 });
    const session = await startLesson('test-term');
    const first = await completeLesson(session, 'test-term', 2, 3, null);
    const second = await completeLesson(session, 'test-term', 2, 3, null);
    expect(second.xp).toBe(first.xp);
    expect((await getProfile())!.xp).toBe(first.xp);
    expect(await db.reviewLog.where('termId').equals('test-term').count()).toBe(1);
  });
});

describe('pitch article', () => {
  it('chooses a or an and drops an article already typed', () => {
    expect(withArticle('web developer')).toBe('a web developer');
    expect(withArticle('An engineer')).toBe('an engineer');
    expect(withArticle('a SEO specialist')).toBe('an SEO specialist');
    expect(withArticle('UX designer')).toBe('a UX designer');
    expect(withArticle('user researcher')).toBe('a user researcher');
  });
});
