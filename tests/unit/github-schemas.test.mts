import { describe, expect, it } from 'vitest';
import {
  GitHubActivityEventsSchema,
  WorkflowRunsResponseSchema,
} from '../../src/lib/schemas/github.mts';

describe('GitHub schemas', () => {
  it('accepts a valid activity events payload', () => {
    const result = GitHubActivityEventsSchema.safeParse([
      {
        type: 'PushEvent',
        created_at: '2026-02-19T21:00:00Z',
        repo: { name: 'bitkojine/cv-site' },
        payload: {
          commits: [{ message: 'feat: improve zod schemas' }],
          ref: 'refs/heads/main',
        },
      },
    ]);

    expect(result.success).toBe(true);
  });

  it('rejects activity events missing required repo name', () => {
    const result = GitHubActivityEventsSchema.safeParse([
      {
        type: 'PushEvent',
        created_at: '2026-02-19T21:00:00Z',
        repo: {},
      },
    ]);

    expect(result.success).toBe(false);
  });

  it('rejects workflow runs with invalid status', () => {
    const result = WorkflowRunsResponseSchema.safeParse({
      workflow_runs: [
        {
          workflow_id: 1,
          name: 'CI',
          html_url: 'https://example.com/runs/1',
          status: 'done',
          conclusion: 'success',
        },
      ],
    });

    expect(result.success).toBe(false);
  });
});
