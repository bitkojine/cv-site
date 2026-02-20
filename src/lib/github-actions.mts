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

const githubJsonHeaders = {
  Accept: 'application/vnd.github+json',
} as const;

async function fetchWorkflowRuns(
  owner: string,
  repo: string,
  branch: string | undefined,
  fetchImpl: (url: string, init?: RequestInit) => Promise<FetchResponse>
): Promise<WorkflowRun[]> {
  const runsUrl = new URL(
    `https://api.github.com/repos/${owner}/${repo}/actions/runs`
  );
  runsUrl.searchParams.set('per_page', '30');
  if (branch) {
    runsUrl.searchParams.set('branch', branch);
  }

  const runsResponse = await fetchImpl(runsUrl.toString(), {
    headers: githubJsonHeaders,
  });
  if (!runsResponse.ok) {
    return [];
  }
  const data: unknown = await runsResponse.json();
  const parsedRunsResponse = WorkflowRunsResponseSchema.safeParse(data);
  if (!parsedRunsResponse.success) {
    return [];
  }
  return parsedRunsResponse.data.workflow_runs;
}

function getLatestWorkflowRuns(runs: WorkflowRun[]) {
  const latestRuns = new Map<number, WorkflowRun>();
  for (const run of runs) {
    if (!latestRuns.has(run.workflow_id)) {
      latestRuns.set(run.workflow_id, run);
    }
  }
  return Array.from(latestRuns.values());
}

async function fetchLatestCommits(
  owner: string,
  repo: string,
  fetchImpl: (url: string, init?: RequestInit) => Promise<FetchResponse>
): Promise<GitHubCommit[]> {
  const commitsResponse = await fetchImpl(
    `https://api.github.com/repos/${owner}/${repo}/commits?per_page=5`,
    {
      headers: githubJsonHeaders,
    }
  );
  if (!commitsResponse.ok) {
    return [];
  }
  const data: unknown = await commitsResponse.json();
  const parsedCommits = GitHubCommitsSchema.safeParse(data);
  return parsedCommits.success ? parsedCommits.data : [];
}

export const getGithubData = async (
  options: GetGithubDataOptions
): Promise<{
  workflowRuns: WorkflowRun[];
  latestWorkflowRuns: WorkflowRun[];
  latestCommits: GitHubCommit[];
}> => {
  const { owner, repo, branch, fetchImpl = fetch } = options;
  const workflowRuns = await fetchWorkflowRuns(owner, repo, branch, fetchImpl);
  const latestWorkflowRuns = getLatestWorkflowRuns(workflowRuns);
  const latestCommits = await fetchLatestCommits(owner, repo, fetchImpl);

  return { workflowRuns, latestWorkflowRuns, latestCommits };
};
