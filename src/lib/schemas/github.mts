import { z } from 'zod';

export const WorkflowRunSchema = z
  .object({
    workflow_id: z.number(),
    name: z.string(),
    html_url: z.string(),
    status: z.enum(['completed', 'in_progress', 'queued']),
    conclusion: z.string().nullable(),
  })
  .strict();

export const WorkflowRunsResponseSchema = z.object({
  workflow_runs: z.array(WorkflowRunSchema),
});

export const GitHubCommitSchema = z
  .object({
    html_url: z.string(),
    commit: z
      .object({
        message: z.string(),
        author: z
          .object({
            date: z.string(),
          })
          .strict(),
      })
      .strict(),
  })
  .strict();

export const GitHubCommitsSchema = z.array(GitHubCommitSchema);

const GitHubActivityPayloadSchema = z
  .object({
    commits: z
      .array(z.object({ message: z.string() }).passthrough())
      .optional(),
    ref: z.string().optional(),
    ref_type: z.string().optional(),
    action: z.string().optional(),
    pull_request: z
      .object({
        title: z.string().optional(),
      })
      .passthrough()
      .optional(),
  })
  .passthrough();

export const GitHubActivityEventSchema = z
  .object({
    type: z.string(),
    created_at: z.string(),
    repo: z.object({ name: z.string() }).passthrough(),
    payload: GitHubActivityPayloadSchema.optional(),
  })
  .passthrough();

export const GitHubActivityEventsSchema = z.array(GitHubActivityEventSchema);

export type WorkflowRun = z.infer<typeof WorkflowRunSchema>;
export type GitHubCommit = z.infer<typeof GitHubCommitSchema>;
