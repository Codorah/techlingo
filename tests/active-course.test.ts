import { describe, expect, it } from 'vitest';
import type { Manifest } from '@/content/schema';
import { coursesByDomain, startedRoles } from '@/lib/activeCourse';

const manifest = {
  domains: [{ id: 'tech', generalRole: 'general-tech' }, { id: 'air-events', generalRole: 'general-air-events' }],
  roles: [
    { id: 'web-developer', domain: 'tech' }, { id: 'general-tech', domain: 'tech' },
    { id: 'pilot', domain: 'air-events' }, { id: 'event-manager', domain: 'air-events' }, { id: 'no-path', domain: 'tech' }
  ],
  rolePaths: ['web-developer', 'pilot', 'event-manager'],
  paths: ['tech']
} as unknown as Manifest;

describe('course switcher', () => {
  it('lists courses by domain, own domain first, without general roles or roles without a course', () => {
    const groups = coursesByDomain(manifest, 'air-events');
    expect(groups.map((g) => g.domain.id)).toEqual(['air-events', 'tech']);
    expect(groups[0]!.roles.map((r) => r.id)).toEqual(['pilot', 'event-manager']);
    expect(groups[1]!.roles.map((r) => r.id)).toEqual(['web-developer']);
  });

  it('detects started courses from node ids', () => {
    const progress = { 'sit:pilot-checklists': { at: 'x' }, 'rap:event-manager:1:0': { at: 'x' } };
    expect([...startedRoles(progress, ['pilot', 'event-manager', 'web-developer'])].sort()).toEqual(['event-manager', 'pilot']);
  });
});
