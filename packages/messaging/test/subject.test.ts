import { describe, expect, it } from 'vitest';

import { buildEventSubject, normalizeEnvironment, parseEventType } from '../src/subject.js';

describe('subject helpers', () => {
  it('builds subject from env and event type', () => {
    expect(buildEventSubject('dev', 'auth.user.created')).toBe('mais-inclusao.dev.events.auth');
  });

  it('normalizes environment to lower-case', () => {
    expect(normalizeEnvironment(' Dev ')).toBe('dev');
  });

  it('rejects invalid event_type', () => {
    expect(() => buildEventSubject('dev', 'Auth.User.Created')).toThrow();
  });

  it('rejects invalid environment', () => {
    expect(() => buildEventSubject('dev env', 'auth.user.created')).toThrow();
  });

  it('parses the three event parts', () => {
    expect(parseEventType('programs.program.published')).toEqual({
      context: 'programs',
      entity: 'program',
      event: 'published',
    });
  });
});
