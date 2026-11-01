import { describe, expect, it } from 'vitest';
import { gradeTyped, levenshtein, spokenScore } from './answer';

describe('answer grading', () => {
  it('measures edit distance', () => {
    expect(levenshtein('deploy', 'deploy')).toBe(0);
    expect(levenshtein('deploy', 'deplyo')).toBe(2);
    expect(levenshtein('bug', 'bugs')).toBe(1);
  });

  it('accepts exact answers regardless of case, accents and punctuation', () => {
    expect(gradeTyped('  Pull Request ', 'pull request')).toBe('exact');
    expect(gradeTyped('ci cd', 'CI/CD')).toBe('exact');
  });

  it('tolerates one typo on medium words, none on short ones', () => {
    expect(gradeTyped('deplyment', 'deployment')).toBe('typo');
    expect(gradeTyped('bag', 'bug')).toBe('wrong');
    expect(gradeTyped('', 'bug')).toBe('wrong');
  });

  it('scores a spoken sentence by expected words found', () => {
    expect(spokenScore('can you share the full stack trace', 'Can you share the full stack trace?')).toBe(1);
    expect(spokenScore('can you share the stack', 'Can you share the full stack trace?')).toBeCloseTo(5 / 7);
    expect(spokenScore('', 'hello')).toBe(0);
  });
});
