import { describe, expect, it } from 'vitest';
import { buildThemes, nextTheme, nodeStates, PATH, themeProgress } from '@/learning/path';
import { loadContent } from '../scripts/content/lib';

const content = loadContent();
const roles = ['mobile-developer', 'web-developer'];
const terms = content.terms.filter((t) => t.roles.some((r) => roles.includes(r.role)));

describe('learning path', () => {
  const themes = buildThemes(terms, roles);

  it('builds themes of 1 to 5 units, each opening with a reminder and closing with a test', () => {
    expect(themes.length).toBeGreaterThanOrEqual(5);
    for (const theme of themes) {
      expect(theme.units.length).toBeGreaterThanOrEqual(1);
      expect(theme.units.length).toBeLessThanOrEqual(PATH.maxUnits);
      theme.units.forEach((u, i) => {
        expect(u.nodes[0]!.kind).toBe(i === 0 ? 'course' : 'recap');
        expect(u.nodes.at(-1)!.kind).toBe('challenge');
        for (const n of u.nodes.filter((x) => x.kind === 'lesson')) {
          expect(n.termIds.length).toBeGreaterThanOrEqual(3);
          expect(n.termIds.length).toBeLessThanOrEqual(PATH.wordsPerLesson + 2);
        }
      });
    }
  });

  it('puts every word of a theme in exactly one unit', () => {
    for (const theme of themes) {
      const ids = theme.units.flatMap((u) => u.termIds);
      expect(new Set(ids).size).toBe(ids.length);
      expect(ids.sort()).toEqual([...theme.termIds].sort());
    }
  });

  it('is deterministic so stored progress keeps matching', () => {
    expect(buildThemes(terms, roles)).toEqual(themes);
  });

  it('unlocks nodes one at a time and tracks progress', () => {
    const theme = themes[0]!;
    const nodes = theme.units.flatMap((u) => u.nodes);
    const progress = { [nodes[0]!.id]: { at: '2026-11-01' } };
    const states = nodeStates(theme, progress);
    expect(states.get(nodes[0]!.id)).toBe('done');
    expect(states.get(nodes[1]!.id)).toBe('current');
    expect(states.get(nodes[2]!.id)).toBe('locked');
    expect(themeProgress(theme, progress).done).toBe(1);
    expect(nextTheme(themes, progress)).toBe(theme);
  });
});
