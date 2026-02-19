import { describe, expect, it } from 'vitest';
import { parseGitHubActivityEvents } from '../../src/lib/github-activity-guard.mts';
import { GitHubActivityEventsSchema } from '../../src/lib/schemas/github.mts';

describe('GitHub activity guard parity', () => {
  it('matches Zod schema acceptance for representative payloads', () => {
    const fixtures: unknown[] = [
      [
        {
          type: 'PushEvent',
          created_at: '2026-02-19T21:00:00Z',
          repo: { name: 'bitkojine/cv-site' },
        },
      ],
      [
        {
          type: 'PushEvent',
          created_at: '2026-02-19T21:00:00Z',
          repo: { name: 'bitkojine/cv-site' },
          payload: {
            commits: [{ message: 'feat: parity test' }],
            ref: 'refs/heads/main',
            ref_type: 'branch',
            action: 'opened',
            pull_request: { title: 'Test PR' },
          },
        },
      ],
      [
        {
          type: 'PushEvent',
          created_at: '2026-02-19T21:00:00Z',
          repo: {},
        },
      ],
      [
        {
          type: 'PushEvent',
          created_at: 123,
          repo: { name: 'bitkojine/cv-site' },
        },
      ],
      [
        {
          type: 'PushEvent',
          created_at: '2026-02-19T21:00:00Z',
          repo: { name: 'bitkojine/cv-site' },
          payload: {
            commits: [{ message: 42 }],
          },
        },
      ],
      [
        {
          type: 'PushEvent',
          created_at: '2026-02-19T21:00:00Z',
          repo: { name: 'bitkojine/cv-site' },
          payload: {
            ref: 42,
          },
        },
      ],
      { not: 'an array' },
    ];

    for (const fixture of fixtures) {
      const guardAccepts = parseGitHubActivityEvents(fixture) !== null;
      const schemaAccepts =
        GitHubActivityEventsSchema.safeParse(fixture).success;
      expect(guardAccepts).toBe(schemaAccepts);
    }
  });
});
