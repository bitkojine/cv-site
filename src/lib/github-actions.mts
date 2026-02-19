import {
  type GitHubCommit,
  GitHubCommitsSchema,
  type WorkflowRun,
  WorkflowRunsResponseSchema,
} from './schemas/github.mts';

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
  const { owner, repo, branch, fetchImpl = fetch } = options,
    runsUrl = new URL(
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

  let workflowRuns: WorkflowRun[] = [],
    latestWorkflowRuns: WorkflowRun[] = [];
  if (runsResponse.ok) {
    const data: unknown = await runsResponse.json(),
      parsedRunsResponse = WorkflowRunsResponseSchema.safeParse(data);
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
    const data: unknown = await commitsResponse.json(),
      parsedCommits = GitHubCommitsSchema.safeParse(data);
    if (parsedCommits.success && parsedCommits.data.length) {
      latestCommits = parsedCommits.data;
    }
  }

  return { workflowRuns, latestWorkflowRuns, latestCommits };
};
