import { describe, expect, it } from 'vitest';
import { buildPath, nodeStates, PATH } from '@/learning/path';
import { loadContent } from '../scripts/content/lib';

const content = loadContent();

describe('learning path', () => {
  const units = buildPath(content.terms, 'mobile-developer', ['q1', 'q2']);

  it('builds themed units, easiest first, ending with the interview', () => {
    expect(units.length).toBeGreaterThanOrEqual(3);
    expect(units.length).toBeLessThanOrEqual(PATH.maxUnits + 1);
    expect(units.at(-1)!.nodes[0]!.kind).toBe('interview');
    const themed = units.slice(0, -1);
    expect(new Set(themed.map((u) => u.id)).size).toBe(themed.length);
    for (const u of themed) {
      expect(u.nodes[0]!.kind).toBe('course');
      expect(u.nodes.at(-1)!.kind).toBe('challenge');
      for (const n of u.nodes.filter((x) => x.kind === 'lesson')) expect(n.termIds.length).toBeGreaterThanOrEqual(3);
    }
  });

  it('never puts the same word in two units and only uses the role\'s words', () => {
    const ids = units.flatMap((u) => u.termIds);
    expect(new Set(ids).size).toBe(ids.length);
    const byId = new Map(content.terms.map((t) => [t.id, t]));
    for (const id of ids) expect(byId.get(id)!.roles.some((r) => r.role === 'mobile-developer')).toBe(true);
  });

  it('is deterministic so stored progress keeps matching', () => {
    expect(buildPath(content.terms, 'mobile-developer', ['q1', 'q2'])).toEqual(units);
  });

  it('unlocks nodes one at a time', () => {
    const nodes = units.flatMap((u) => u.nodes);
    const states = nodeStates(units, { [nodes[0]!.id]: { at: '2026-11-01' } });
    expect(states.get(nodes[0]!.id)).toBe('done');
    expect(states.get(nodes[1]!.id)).toBe('current');
    expect(states.get(nodes[2]!.id)).toBe('locked');
  });

  it('gives every role with content a path', () => {
    for (const role of content.roles.filter((r) => content.terms.some((t) => t.roles.some((x) => x.role === r.id)))) {
      expect(buildPath(content.terms, role.id).length, role.id).toBeGreaterThanOrEqual(3);
    }
  });
});
