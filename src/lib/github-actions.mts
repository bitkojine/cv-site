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

  let latestWorkflowRuns: WorkflowRun[] = [];
  if (runsResponse.ok) {
    const data = await runsResponse.json();
    if (data && typeof data === 'object' && 'workflow_runs' in data) {
      const runs = (data as { workflow_runs?: WorkflowRun[] }).workflow_runs;
      if (Array.isArray(runs) && runs.length) {
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
    if (Array.isArray(data) && data.length) {
      latestCommits = data as GitHubCommit[];
    }
  }

  return { latestWorkflowRuns, latestCommits };
};
