import { promises as fs } from 'node:fs';
import path from 'node:path';

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

export interface GitHubCachePayload {
  updatedAt?: string;
  etagRuns?: string;
  etagCommits?: string;
  latestWorkflowRuns?: WorkflowRun[];
  latestCommits?: GitHubCommit[];
}

interface FetchResponse {
  status: number;
  ok: boolean;
  json(): Promise<unknown>;
  headers: {
    get(name: string): string | null;
  };
}

interface GetGithubDataOptions {
  owner: string;
  repo: string;
  branch?: string;
  cachePath: string;
  ttlMs: number;
  revalidateFresh?: boolean;
  bypassCache?: boolean;
  nowMs?: number;
  fetchImpl?: (url: string, init?: RequestInit) => Promise<FetchResponse>;
  fsImpl?: typeof fs;
}

const readCache = async (
  fsImpl: typeof fs,
  cachePath: string
): Promise<GitHubCachePayload | null> => {
  try {
    const raw = await fsImpl.readFile(cachePath, 'utf-8');
    return JSON.parse(raw) as GitHubCachePayload;
  } catch {
    return null;
  }
};

const writeCache = async (
  fsImpl: typeof fs,
  cachePath: string,
  payload: GitHubCachePayload
) => {
  try {
    await fsImpl.mkdir(path.dirname(cachePath), { recursive: true });
    await fsImpl.writeFile(
      cachePath,
      JSON.stringify(payload, null, 2),
      'utf-8'
    );
  } catch {
    // Ignore cache write failures
  }
};

export const getGithubData = async (
  options: GetGithubDataOptions
): Promise<{
  latestWorkflowRuns: WorkflowRun[];
  latestCommits: GitHubCommit[];
}> => {
  const {
    owner,
    repo,
    branch,
    cachePath,
    ttlMs,
    revalidateFresh = false,
    bypassCache = false,
    nowMs = Date.now(),
    fetchImpl = fetch,
    fsImpl = fs,
  } = options;

  const cache = bypassCache ? null : await readCache(fsImpl, cachePath);
  let latestWorkflowRuns: WorkflowRun[] = cache?.latestWorkflowRuns || [];
  let latestCommits: GitHubCommit[] = cache?.latestCommits || [];
  let etagRuns = cache?.etagRuns;
  let etagCommits = cache?.etagCommits;
  const cacheUpdatedAt = cache?.updatedAt ? Date.parse(cache.updatedAt) : 0;
  const hasCachedData =
    Array.isArray(cache?.latestWorkflowRuns) ||
    Array.isArray(cache?.latestCommits);
  const cacheFresh =
    Number.isFinite(cacheUpdatedAt) && nowMs - cacheUpdatedAt < ttlMs;
  const hasRunningWorkflow =
    cache?.latestWorkflowRuns?.some(
      (run) => run.status === 'in_progress' || run.status === 'queued'
    ) || false;
  const forceRunsRevalidate = hasRunningWorkflow && !bypassCache;

  if (
    cacheFresh &&
    hasCachedData &&
    !revalidateFresh &&
    !hasRunningWorkflow &&
    !bypassCache
  ) {
    return {
      latestWorkflowRuns: cache?.latestWorkflowRuns || [],
      latestCommits: cache?.latestCommits || [],
    };
  }

  const refreshCache = async (payload: GitHubCachePayload) =>
    writeCache(fsImpl, cachePath, {
      ...payload,
      updatedAt: new Date(nowMs).toISOString(),
    });

  try {
    const runsUrl = new URL(
      `https://api.github.com/repos/${owner}/${repo}/actions/runs`
    );
    runsUrl.searchParams.set('per_page', '30');
    if (branch) {
      runsUrl.searchParams.set('branch', branch);
    }
    const runsHeaders: Record<string, string> = {
      Accept: 'application/vnd.github+json',
    };
    if (cache?.etagRuns && !forceRunsRevalidate) {
      runsHeaders['If-None-Match'] = cache.etagRuns;
    }
    if (forceRunsRevalidate) {
      runsHeaders['Cache-Control'] = 'no-cache';
    }

    const runsResponse = await fetchImpl(runsUrl.toString(), {
      headers: runsHeaders,
    });
    if (runsResponse.status === 304 && cache?.latestWorkflowRuns) {
      latestWorkflowRuns = cache.latestWorkflowRuns;
      await refreshCache({
        etagRuns,
        etagCommits,
        latestWorkflowRuns: cache.latestWorkflowRuns,
        latestCommits: cache.latestCommits,
      });
    } else if (runsResponse.ok) {
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
      if (latestWorkflowRuns.length === 0 && cache?.latestWorkflowRuns) {
        latestWorkflowRuns = cache.latestWorkflowRuns;
      }
      etagRuns = runsResponse.headers.get('etag') || etagRuns;
      await refreshCache({
        etagRuns,
        etagCommits,
        latestWorkflowRuns,
        latestCommits: cache?.latestCommits || latestCommits,
      });
    }
  } catch {
    if (latestWorkflowRuns.length === 0 && cache?.latestWorkflowRuns) {
      latestWorkflowRuns = cache.latestWorkflowRuns;
    }
  }

  try {
    const commitsResponse = await fetchImpl(
      `https://api.github.com/repos/${owner}/${repo}/commits?per_page=5`,
      {
        headers: {
          Accept: 'application/vnd.github+json',
          ...(cache?.etagCommits ? { 'If-None-Match': cache.etagCommits } : {}),
        },
      }
    );
    const resolvedRuns =
      latestWorkflowRuns.length > 0
        ? latestWorkflowRuns
        : cache?.latestWorkflowRuns || [];
    if (commitsResponse.status === 304 && cache?.latestCommits) {
      latestCommits = cache.latestCommits;
      await refreshCache({
        etagRuns,
        etagCommits,
        latestWorkflowRuns: resolvedRuns,
        latestCommits: cache.latestCommits,
      });
    } else if (commitsResponse.ok) {
      const data = await commitsResponse.json();
      if (Array.isArray(data) && data.length) {
        latestCommits = data as GitHubCommit[];
      }
      if (latestCommits.length === 0 && cache?.latestCommits) {
        latestCommits = cache.latestCommits;
      }
      etagCommits = commitsResponse.headers.get('etag') || etagCommits;
      await refreshCache({
        etagRuns,
        etagCommits,
        latestWorkflowRuns: resolvedRuns,
        latestCommits,
      });
    }
  } catch {
    if (latestCommits.length === 0 && cache?.latestCommits) {
      latestCommits = cache.latestCommits;
    }
  }

  return { latestWorkflowRuns, latestCommits };
};
