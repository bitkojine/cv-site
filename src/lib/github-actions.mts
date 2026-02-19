import { z } from 'zod';

const WorkflowRunSchema = z
  .object({
    workflow_id: z.number(),
    name: z.string(),
    html_url: z.string(),
    status: z.enum(['completed', 'in_progress', 'queued']),
    conclusion: z.string().nullable(),
  })
  .strict();

const WorkflowRunsResponseSchema = z.object({
  workflow_runs: z.array(WorkflowRunSchema),
});

const GitHubCommitSchema = z
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

export interface WorkflowRun {
  workflow_id: number;
  name: string;
  html_url: string;
  status: 'completed' | 'in_progress' | 'queued';
  conclusion: string | null;
}

export interface GitHubCommit {
  html_url: string;
  commit: {
    message: string;
    author: {
      date: string;
    };
  };
}

interface FetchResponse {
  ok: boolean;
  json(): Promise<unknown>;
}

interface GetGithubDataOptions {
  owner: string;
  repo: string;
  branch?: string;
  fetchImpl?: (url: string, init?: RequestInit) => Promise<FetchResponse>;
}

export const getGithubData = async (
  options: GetGithubDataOptions
): Promise<{
  workflowRuns: WorkflowRun[];
  latestWorkflowRuns: WorkflowRun[];
  latestCommits: GitHubCommit[];
}> => {
  const { owner, repo, branch, fetchImpl = fetch } = options;

  const runsUrl = new URL(
    `https://api.github.com/repos/${owner}/${repo}/actions/runs`
  );
  runsUrl.searchParams.set('per_page', '30');
  if (branch) {
    runsUrl.searchParams.set('branch', branch);
  }

  const runsResponse = await fetchImpl(runsUrl.toString(), {
    headers: {
      Accept: 'application/vnd.github+json',
    },
  });

  let workflowRuns: WorkflowRun[] = [];
  let latestWorkflowRuns: WorkflowRun[] = [];
  if (runsResponse.ok) {
    const data = await runsResponse.json();
    const parsedRunsResponse = WorkflowRunsResponseSchema.safeParse(data);
    if (parsedRunsResponse.success) {
      const runs = parsedRunsResponse.data.workflow_runs;
      if (runs.length) {
        workflowRuns = runs;
        const latestRuns = new Map<number, WorkflowRun>();
        for (const run of runs) {
          if (!latestRuns.has(run.workflow_id)) {
            latestRuns.set(run.workflow_id, run);
          }
        }
        latestWorkflowRuns = Array.from(latestRuns.values());
      }
    }
  }

  const commitsResponse = await fetchImpl(
    `https://api.github.com/repos/${owner}/${repo}/commits?per_page=5`,
    {
      headers: {
        Accept: 'application/vnd.github+json',
      },
    }
  );

  let latestCommits: GitHubCommit[] = [];
  if (commitsResponse.ok) {
    const data = await commitsResponse.json();
    const parsedCommits = z.array(GitHubCommitSchema).safeParse(data);
    if (parsedCommits.success && parsedCommits.data.length) {
      latestCommits = parsedCommits.data;
    }
  }

  return { workflowRuns, latestWorkflowRuns, latestCommits };
};
