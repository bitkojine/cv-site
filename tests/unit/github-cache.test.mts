import { afterEach, describe, expect, it, vi } from 'vitest';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import {
  getGithubData,
  type GitHubCachePayload,
} from '../../src/lib/github-cache.mts';

type MockResponse = {
  status: number;
  ok: boolean;
  json: () => Promise<unknown>;
  headers: {
    get: (name: string) => string | null;
  };
};

const createResponse = (overrides: Partial<MockResponse>): MockResponse => ({
  status: 200,
  ok: true,
  json: async () => ({}),
  headers: {
    get: () => null,
  },
  ...overrides,
});

describe('getGithubData cache behavior', () => {
  let tempDir: string | null = null;

  afterEach(async () => {
    if (tempDir) {
      await fs.rm(tempDir, { recursive: true, force: true });
      tempDir = null;
    }
    vi.restoreAllMocks();
  });

  // Bug: Fresh cache still hit GitHub, wasting requests and slowing builds.
  it('returns fresh cache data without calling fetch', async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'cv-site-cache-'));
    const cachePath = path.join(tempDir, 'github.json');
    const nowMs = Date.UTC(2026, 0, 1, 12, 0, 0);
    const payload: GitHubCachePayload = {
      updatedAt: new Date(nowMs - 60_000).toISOString(),
      latestWorkflowRuns: [
        {
          workflow_id: 1,
          name: 'Build',
          html_url: 'https://example.com/run',
          status: 'completed',
          conclusion: 'success',
        },
      ],
      latestCommits: [
        {
          html_url: 'https://example.com/commit',
          commit: {
            message: 'feat: add cache',
            author: { date: new Date(nowMs - 60_000).toISOString() },
          },
        },
      ],
    };

    await fs.writeFile(cachePath, JSON.stringify(payload), 'utf-8');

    const fetchImpl = vi.fn(async () =>
      createResponse({ status: 500, ok: false })
    );

    const result = await getGithubData({
      owner: 'owner',
      repo: 'repo',
      cachePath,
      ttlMs: 6 * 60 * 60 * 1000,
      nowMs,
      fetchImpl,
    });

    expect(fetchImpl).not.toHaveBeenCalled();
    expect(result.latestWorkflowRuns).toEqual(payload.latestWorkflowRuns);
    expect(result.latestCommits).toEqual(payload.latestCommits);
  });

  // Bug: 304 responses left updatedAt stale, causing refetch loops.
  it('refreshes updatedAt when GitHub returns 304 responses', async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'cv-site-cache-'));
    const cachePath = path.join(tempDir, 'github.json');
    const nowMs = Date.UTC(2026, 0, 2, 12, 0, 0);
    const stalePayload: GitHubCachePayload = {
      updatedAt: new Date(nowMs - 7 * 60 * 60 * 1000).toISOString(),
      etagRuns: 'etag-runs',
      etagCommits: 'etag-commits',
      latestWorkflowRuns: [
        {
          workflow_id: 2,
          name: 'Deploy',
          html_url: 'https://example.com/run-2',
          status: 'completed',
          conclusion: 'success',
        },
      ],
      latestCommits: [
        {
          html_url: 'https://example.com/commit-2',
          commit: {
            message: 'fix: etag refresh',
            author: { date: new Date(nowMs - 10_000).toISOString() },
          },
        },
      ],
    };

    await fs.writeFile(cachePath, JSON.stringify(stalePayload), 'utf-8');

    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(
        createResponse({ status: 304, ok: false, json: async () => ({}) })
      )
      .mockResolvedValueOnce(
        createResponse({ status: 304, ok: false, json: async () => ({}) })
      );

    const result = await getGithubData({
      owner: 'owner',
      repo: 'repo',
      cachePath,
      ttlMs: 6 * 60 * 60 * 1000,
      nowMs,
      fetchImpl,
    });

    const refreshedRaw = await fs.readFile(cachePath, 'utf-8');
    const refreshed = JSON.parse(refreshedRaw) as GitHubCachePayload;

    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(result.latestWorkflowRuns).toEqual(stalePayload.latestWorkflowRuns);
    expect(result.latestCommits).toEqual(stalePayload.latestCommits);
    expect(refreshed.updatedAt).toBe(new Date(nowMs).toISOString());
    expect(refreshed.etagRuns).toBe(stalePayload.etagRuns);
    expect(refreshed.etagCommits).toBe(stalePayload.etagCommits);
  });

  // Bug: Stale cache never refreshed and etags were not persisted.
  it('fetches when cache is stale and stores new data + etags', async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'cv-site-cache-'));
    const cachePath = path.join(tempDir, 'github.json');
    const nowMs = Date.UTC(2026, 0, 3, 12, 0, 0);
    const stalePayload: GitHubCachePayload = {
      updatedAt: new Date(nowMs - 8 * 60 * 60 * 1000).toISOString(),
    };

    await fs.writeFile(cachePath, JSON.stringify(stalePayload), 'utf-8');

    const runsPayload = {
      workflow_runs: [
        {
          workflow_id: 10,
          name: 'Build',
          html_url: 'https://example.com/run-10-a',
          status: 'completed',
          conclusion: 'success',
        },
        {
          workflow_id: 10,
          name: 'Build',
          html_url: 'https://example.com/run-10-b',
          status: 'completed',
          conclusion: 'success',
        },
        {
          workflow_id: 11,
          name: 'Deploy',
          html_url: 'https://example.com/run-11',
          status: 'completed',
          conclusion: 'failure',
        },
      ],
    };
    const commitsPayload = [
      {
        html_url: 'https://example.com/commit-10',
        commit: {
          message: 'feat: add pipelines',
          author: { date: new Date(nowMs - 20_000).toISOString() },
        },
      },
    ];

    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(
        createResponse({
          status: 200,
          ok: true,
          json: async () => runsPayload,
          headers: {
            get: (name: string) => (name === 'etag' ? 'etag-a' : null),
          },
        })
      )
      .mockResolvedValueOnce(
        createResponse({
          status: 200,
          ok: true,
          json: async () => commitsPayload,
          headers: {
            get: (name: string) => (name === 'etag' ? 'etag-b' : null),
          },
        })
      );

    const result = await getGithubData({
      owner: 'owner',
      repo: 'repo',
      cachePath,
      ttlMs: 6 * 60 * 60 * 1000,
      nowMs,
      fetchImpl,
    });

    const refreshedRaw = await fs.readFile(cachePath, 'utf-8');
    const refreshed = JSON.parse(refreshedRaw) as GitHubCachePayload;

    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(result.latestWorkflowRuns).toHaveLength(2);
    expect(result.latestWorkflowRuns.map((run) => run.workflow_id)).toEqual([
      10, 11,
    ]);
    expect(result.latestCommits).toEqual(commitsPayload);
    expect(refreshed.etagRuns).toBe('etag-a');
    expect(refreshed.etagCommits).toBe('etag-b');
    expect(refreshed.updatedAt).toBe(new Date(nowMs).toISOString());
  });

  // Bug: Missing If-None-Match headers forced full downloads every time.
  it('sends If-None-Match headers when etags exist (fresh revalidate)', async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'cv-site-cache-'));
    const cachePath = path.join(tempDir, 'github.json');
    const nowMs = Date.UTC(2026, 0, 4, 12, 0, 0);
    const freshPayload: GitHubCachePayload = {
      updatedAt: new Date(nowMs - 60_000).toISOString(),
      etagRuns: 'etag-runs',
      etagCommits: 'etag-commits',
      latestWorkflowRuns: [],
      latestCommits: [],
    };

    await fs.writeFile(cachePath, JSON.stringify(freshPayload), 'utf-8');

    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(createResponse({ status: 304, ok: false }))
      .mockResolvedValueOnce(createResponse({ status: 304, ok: false }));

    await getGithubData({
      owner: 'owner',
      repo: 'repo',
      cachePath,
      ttlMs: 6 * 60 * 60 * 1000,
      nowMs,
      revalidateFresh: true,
      fetchImpl,
    });

    const firstCall = fetchImpl.mock.calls[0];
    const secondCall = fetchImpl.mock.calls[1];
    const firstHeaders = (firstCall?.[1]?.headers || {}) as Record<
      string,
      string
    >;
    const secondHeaders = (secondCall?.[1]?.headers || {}) as Record<
      string,
      string
    >;

    expect(firstHeaders['If-None-Match']).toBe('etag-runs');
    expect(secondHeaders['If-None-Match']).toBe('etag-commits');
  });

  // Bug: Non-success conclusions (cancelled/skipped/neutral) were not mapped and should still render.
  it('returns latest workflow runs for cancelled/skipped conclusions', async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'cv-site-cache-'));
    const cachePath = path.join(tempDir, 'github.json');
    const nowMs = Date.UTC(2026, 0, 15, 12, 0, 0);
    const stalePayload: GitHubCachePayload = {
      updatedAt: new Date(nowMs - 8 * 60 * 60 * 1000).toISOString(),
    };

    await fs.writeFile(cachePath, JSON.stringify(stalePayload), 'utf-8');

    const runsPayload = {
      workflow_runs: [
        {
          workflow_id: 201,
          name: 'Build',
          html_url: 'https://example.com/run-201',
          status: 'completed',
          conclusion: 'cancelled',
        },
        {
          workflow_id: 202,
          name: 'Deploy',
          html_url: 'https://example.com/run-202',
          status: 'completed',
          conclusion: 'skipped',
        },
      ],
    };

    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(
        createResponse({
          status: 200,
          ok: true,
          json: async () => runsPayload,
        })
      )
      .mockResolvedValueOnce(
        createResponse({
          status: 200,
          ok: true,
          json: async () => [],
        })
      );

    const result = await getGithubData({
      owner: 'owner',
      repo: 'repo',
      cachePath,
      ttlMs: 6 * 60 * 60 * 1000,
      nowMs,
      fetchImpl,
    });

    expect(result.latestWorkflowRuns).toEqual(runsPayload.workflow_runs);
  });

  // Bug: API order changes should not break deterministic display order.
  it('preserves API order when selecting latest runs per workflow', async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'cv-site-cache-'));
    const cachePath = path.join(tempDir, 'github.json');
    const nowMs = Date.UTC(2026, 0, 16, 12, 0, 0);
    const stalePayload: GitHubCachePayload = {
      updatedAt: new Date(nowMs - 8 * 60 * 60 * 1000).toISOString(),
    };

    await fs.writeFile(cachePath, JSON.stringify(stalePayload), 'utf-8');

    const runsPayload = {
      workflow_runs: [
        {
          workflow_id: 302,
          name: 'Deploy',
          html_url: 'https://example.com/run-302',
          status: 'completed',
          conclusion: 'success',
        },
        {
          workflow_id: 301,
          name: 'Build',
          html_url: 'https://example.com/run-301',
          status: 'completed',
          conclusion: 'success',
        },
      ],
    };

    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(
        createResponse({
          status: 200,
          ok: true,
          json: async () => runsPayload,
        })
      )
      .mockResolvedValueOnce(
        createResponse({
          status: 200,
          ok: true,
          json: async () => [],
        })
      );

    const result = await getGithubData({
      owner: 'owner',
      repo: 'repo',
      cachePath,
      ttlMs: 6 * 60 * 60 * 1000,
      nowMs,
      fetchImpl,
    });

    expect(result.latestWorkflowRuns.map((run) => run.workflow_id)).toEqual([
      302, 301,
    ]);
  });

  // Bug: GitHub rate limits (403) should fall back to cache instead of empty data.
  it('falls back to cache when GitHub responds with 403', async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'cv-site-cache-'));
    const cachePath = path.join(tempDir, 'github.json');
    const nowMs = Date.UTC(2026, 0, 17, 12, 0, 0);
    const stalePayload: GitHubCachePayload = {
      updatedAt: new Date(nowMs - 8 * 60 * 60 * 1000).toISOString(),
      latestWorkflowRuns: [
        {
          workflow_id: 401,
          name: 'Build',
          html_url: 'https://example.com/run-401',
          status: 'completed',
          conclusion: 'success',
        },
      ],
      latestCommits: [
        {
          html_url: 'https://example.com/commit-401',
          commit: {
            message: 'cached commit',
            author: { date: new Date(nowMs - 5_000).toISOString() },
          },
        },
      ],
    };

    await fs.writeFile(cachePath, JSON.stringify(stalePayload), 'utf-8');

    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(
        createResponse({ status: 403, ok: false, json: async () => ({}) })
      )
      .mockResolvedValueOnce(
        createResponse({ status: 403, ok: false, json: async () => ({}) })
      );

    const result = await getGithubData({
      owner: 'owner',
      repo: 'repo',
      cachePath,
      ttlMs: 6 * 60 * 60 * 1000,
      nowMs,
      fetchImpl,
    });

    expect(result.latestWorkflowRuns).toEqual(stalePayload.latestWorkflowRuns);
    expect(result.latestCommits).toEqual(stalePayload.latestCommits);
  });

  // Bug: Corrupt cache files caused crashes or empty UI without refetch.
  it('handles invalid cache files by refetching', async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'cv-site-cache-'));
    const cachePath = path.join(tempDir, 'github.json');
    const nowMs = Date.UTC(2026, 0, 5, 12, 0, 0);

    await fs.writeFile(cachePath, '{not-json', 'utf-8');

    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(
        createResponse({
          status: 200,
          ok: true,
          json: async () => ({ workflow_runs: [] }),
        })
      )
      .mockResolvedValueOnce(
        createResponse({
          status: 200,
          ok: true,
          json: async () => [],
        })
      );

    const result = await getGithubData({
      owner: 'owner',
      repo: 'repo',
      cachePath,
      ttlMs: 6 * 60 * 60 * 1000,
      nowMs,
      fetchImpl,
    });

    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(result.latestWorkflowRuns).toEqual([]);
    expect(result.latestCommits).toEqual([]);
  });

  // Bug: Commits refresh overwrote freshly fetched runs with stale cache.
  it('does not regress workflow runs when commits refresh after runs', async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'cv-site-cache-'));
    const cachePath = path.join(tempDir, 'github.json');
    const nowMs = Date.UTC(2026, 0, 6, 12, 0, 0);
    const stalePayload: GitHubCachePayload = {
      updatedAt: new Date(nowMs - 8 * 60 * 60 * 1000).toISOString(),
      latestWorkflowRuns: [
        {
          workflow_id: 21,
          name: 'Old Build',
          html_url: 'https://example.com/run-old',
          status: 'completed',
          conclusion: 'success',
        },
      ],
    };

    await fs.writeFile(cachePath, JSON.stringify(stalePayload), 'utf-8');

    const runsPayload = {
      workflow_runs: [
        {
          workflow_id: 21,
          name: 'New Build',
          html_url: 'https://example.com/run-new',
          status: 'completed',
          conclusion: 'success',
        },
      ],
    };
    const commitsPayload = [
      {
        html_url: 'https://example.com/commit-21',
        commit: {
          message: 'chore: refresh cache',
          author: { date: new Date(nowMs - 10_000).toISOString() },
        },
      },
    ];

    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(
        createResponse({
          status: 200,
          ok: true,
          json: async () => runsPayload,
        })
      )
      .mockResolvedValueOnce(
        createResponse({
          status: 200,
          ok: true,
          json: async () => commitsPayload,
        })
      );

    await getGithubData({
      owner: 'owner',
      repo: 'repo',
      cachePath,
      ttlMs: 6 * 60 * 60 * 1000,
      nowMs,
      fetchImpl,
    });

    const refreshedRaw = await fs.readFile(cachePath, 'utf-8');
    const refreshed = JSON.parse(refreshedRaw) as GitHubCachePayload;

    expect(refreshed.latestWorkflowRuns).toEqual(runsPayload.workflow_runs);
  });

  // Bug: Commits 304 path overwrote freshly fetched runs with stale cache.
  it('does not regress workflow runs when commits return 304 after runs update', async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'cv-site-cache-'));
    const cachePath = path.join(tempDir, 'github.json');
    const nowMs = Date.UTC(2026, 0, 7, 12, 0, 0);
    const stalePayload: GitHubCachePayload = {
      updatedAt: new Date(nowMs - 8 * 60 * 60 * 1000).toISOString(),
      etagCommits: 'etag-commits',
      latestWorkflowRuns: [
        {
          workflow_id: 31,
          name: 'Old Build',
          html_url: 'https://example.com/run-old-31',
          status: 'completed',
          conclusion: 'success',
        },
      ],
      latestCommits: [
        {
          html_url: 'https://example.com/commit-old-31',
          commit: {
            message: 'old commit',
            author: { date: new Date(nowMs - 20_000).toISOString() },
          },
        },
      ],
    };

    await fs.writeFile(cachePath, JSON.stringify(stalePayload), 'utf-8');

    const runsPayload = {
      workflow_runs: [
        {
          workflow_id: 31,
          name: 'New Build',
          html_url: 'https://example.com/run-new-31',
          status: 'completed',
          conclusion: 'success',
        },
      ],
    };

    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(
        createResponse({
          status: 200,
          ok: true,
          json: async () => runsPayload,
        })
      )
      .mockResolvedValueOnce(
        createResponse({ status: 304, ok: false, json: async () => ({}) })
      );

    await getGithubData({
      owner: 'owner',
      repo: 'repo',
      cachePath,
      ttlMs: 6 * 60 * 60 * 1000,
      nowMs,
      fetchImpl,
    });

    const refreshedRaw = await fs.readFile(cachePath, 'utf-8');
    const refreshed = JSON.parse(refreshedRaw) as GitHubCachePayload;

    expect(refreshed.latestWorkflowRuns).toEqual(runsPayload.workflow_runs);
  });

  // Bug: Runs 304 path overwrote freshly fetched commits with stale cache.
  it('keeps latest commits when runs return 304 after commits update', async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'cv-site-cache-'));
    const cachePath = path.join(tempDir, 'github.json');
    const nowMs = Date.UTC(2026, 0, 8, 12, 0, 0);
    const stalePayload: GitHubCachePayload = {
      updatedAt: new Date(nowMs - 8 * 60 * 60 * 1000).toISOString(),
      etagRuns: 'etag-runs',
      latestWorkflowRuns: [
        {
          workflow_id: 41,
          name: 'Old Build',
          html_url: 'https://example.com/run-old-41',
          status: 'completed',
          conclusion: 'success',
        },
      ],
    };

    await fs.writeFile(cachePath, JSON.stringify(stalePayload), 'utf-8');

    const commitsPayload = [
      {
        html_url: 'https://example.com/commit-41',
        commit: {
          message: 'feat: add commits',
          author: { date: new Date(nowMs - 5_000).toISOString() },
        },
      },
    ];

    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(
        createResponse({ status: 304, ok: false, json: async () => ({}) })
      )
      .mockResolvedValueOnce(
        createResponse({
          status: 200,
          ok: true,
          json: async () => commitsPayload,
        })
      );

    await getGithubData({
      owner: 'owner',
      repo: 'repo',
      cachePath,
      ttlMs: 6 * 60 * 60 * 1000,
      nowMs,
      fetchImpl,
    });

    const refreshedRaw = await fs.readFile(cachePath, 'utf-8');
    const refreshed = JSON.parse(refreshedRaw) as GitHubCachePayload;

    expect(refreshed.latestCommits).toEqual(commitsPayload);
  });

  // Bug: Runs fetch failure + commits success erased cached runs.
  it('preserves cached runs if runs request fails but commits succeed', async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'cv-site-cache-'));
    const cachePath = path.join(tempDir, 'github.json');
    const nowMs = Date.UTC(2026, 0, 9, 12, 0, 0);
    const stalePayload: GitHubCachePayload = {
      updatedAt: new Date(nowMs - 8 * 60 * 60 * 1000).toISOString(),
      latestWorkflowRuns: [
        {
          workflow_id: 51,
          name: 'Cached Build',
          html_url: 'https://example.com/run-cached-51',
          status: 'completed',
          conclusion: 'success',
        },
      ],
    };

    await fs.writeFile(cachePath, JSON.stringify(stalePayload), 'utf-8');

    const commitsPayload = [
      {
        html_url: 'https://example.com/commit-51',
        commit: {
          message: 'feat: keep cache',
          author: { date: new Date(nowMs - 5_000).toISOString() },
        },
      },
    ];

    const fetchImpl = vi
      .fn()
      .mockRejectedValueOnce(new Error('network failure'))
      .mockResolvedValueOnce(
        createResponse({
          status: 200,
          ok: true,
          json: async () => commitsPayload,
        })
      );

    await getGithubData({
      owner: 'owner',
      repo: 'repo',
      cachePath,
      ttlMs: 6 * 60 * 60 * 1000,
      nowMs,
      fetchImpl,
    });

    const refreshedRaw = await fs.readFile(cachePath, 'utf-8');
    const refreshed = JSON.parse(refreshedRaw) as GitHubCachePayload;

    expect(refreshed.latestWorkflowRuns).toEqual(
      stalePayload.latestWorkflowRuns
    );
  });

  // Bug: Dual fetch failures returned empty data instead of cached fallback.
  it('falls back to stale cache when both requests fail', async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'cv-site-cache-'));
    const cachePath = path.join(tempDir, 'github.json');
    const nowMs = Date.UTC(2026, 0, 10, 12, 0, 0);
    const stalePayload: GitHubCachePayload = {
      updatedAt: new Date(nowMs - 8 * 60 * 60 * 1000).toISOString(),
      latestWorkflowRuns: [
        {
          workflow_id: 61,
          name: 'Cached Build',
          html_url: 'https://example.com/run-cached-61',
          status: 'completed',
          conclusion: 'success',
        },
      ],
      latestCommits: [
        {
          html_url: 'https://example.com/commit-cached-61',
          commit: {
            message: 'cached commit',
            author: { date: new Date(nowMs - 10_000).toISOString() },
          },
        },
      ],
    };

    await fs.writeFile(cachePath, JSON.stringify(stalePayload), 'utf-8');

    const fetchImpl = vi
      .fn()
      .mockRejectedValueOnce(new Error('runs down'))
      .mockRejectedValueOnce(new Error('commits down'));

    const result = await getGithubData({
      owner: 'owner',
      repo: 'repo',
      cachePath,
      ttlMs: 6 * 60 * 60 * 1000,
      nowMs,
      fetchImpl,
    });

    expect(result.latestWorkflowRuns).toEqual(stalePayload.latestWorkflowRuns);
    expect(result.latestCommits).toEqual(stalePayload.latestCommits);
  });

  // Bug: Malformed runs payload cleared cached runs even though data existed.
  it('preserves cached runs when runs response is malformed and commits fail', async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'cv-site-cache-'));
    const cachePath = path.join(tempDir, 'github.json');
    const nowMs = Date.UTC(2026, 0, 11, 12, 0, 0);
    const stalePayload: GitHubCachePayload = {
      updatedAt: new Date(nowMs - 8 * 60 * 60 * 1000).toISOString(),
      latestWorkflowRuns: [
        {
          workflow_id: 71,
          name: 'Cached Build',
          html_url: 'https://example.com/run-cached-71',
          status: 'completed',
          conclusion: 'success',
        },
      ],
    };

    await fs.writeFile(cachePath, JSON.stringify(stalePayload), 'utf-8');

    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(
        createResponse({
          status: 200,
          ok: true,
          json: async () => ({ unexpected: true }),
        })
      )
      .mockRejectedValueOnce(new Error('commits down'));

    const result = await getGithubData({
      owner: 'owner',
      repo: 'repo',
      cachePath,
      ttlMs: 6 * 60 * 60 * 1000,
      nowMs,
      fetchImpl,
    });

    expect(result.latestWorkflowRuns).toEqual(stalePayload.latestWorkflowRuns);
  });

  // Bug: Malformed commits payload cleared cached commits even though data existed.
  it('preserves cached commits when commits response is malformed and runs fail', async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'cv-site-cache-'));
    const cachePath = path.join(tempDir, 'github.json');
    const nowMs = Date.UTC(2026, 0, 12, 12, 0, 0);
    const stalePayload: GitHubCachePayload = {
      updatedAt: new Date(nowMs - 8 * 60 * 60 * 1000).toISOString(),
      latestCommits: [
        {
          html_url: 'https://example.com/commit-cached-81',
          commit: {
            message: 'cached commit',
            author: { date: new Date(nowMs - 10_000).toISOString() },
          },
        },
      ],
    };

    await fs.writeFile(cachePath, JSON.stringify(stalePayload), 'utf-8');

    const fetchImpl = vi
      .fn()
      .mockRejectedValueOnce(new Error('runs down'))
      .mockResolvedValueOnce(
        createResponse({
          status: 200,
          ok: true,
          json: async () => ({ unexpected: true }),
        })
      );

    const result = await getGithubData({
      owner: 'owner',
      repo: 'repo',
      cachePath,
      ttlMs: 6 * 60 * 60 * 1000,
      nowMs,
      fetchImpl,
    });

    expect(result.latestCommits).toEqual(stalePayload.latestCommits);
  });

  // Bug: Fresh cache timestamp but missing data skipped refetch and stayed empty.
  it('refetches when cache is fresh but missing data', async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'cv-site-cache-'));
    const cachePath = path.join(tempDir, 'github.json');
    const nowMs = Date.UTC(2026, 0, 13, 12, 0, 0);
    const payload: GitHubCachePayload = {
      updatedAt: new Date(nowMs - 60_000).toISOString(),
    };

    await fs.writeFile(cachePath, JSON.stringify(payload), 'utf-8');

    const runsPayload = {
      workflow_runs: [
        {
          workflow_id: 91,
          name: 'Build',
          html_url: 'https://example.com/run-91',
          status: 'completed',
          conclusion: 'success',
        },
      ],
    };
    const commitsPayload = [
      {
        html_url: 'https://example.com/commit-91',
        commit: {
          message: 'feat: populate cache',
          author: { date: new Date(nowMs - 5_000).toISOString() },
        },
      },
    ];

    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(
        createResponse({
          status: 200,
          ok: true,
          json: async () => runsPayload,
        })
      )
      .mockResolvedValueOnce(
        createResponse({
          status: 200,
          ok: true,
          json: async () => commitsPayload,
        })
      );

    const result = await getGithubData({
      owner: 'owner',
      repo: 'repo',
      cachePath,
      ttlMs: 6 * 60 * 60 * 1000,
      nowMs,
      fetchImpl,
    });

    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(result.latestWorkflowRuns).toEqual(runsPayload.workflow_runs);
    expect(result.latestCommits).toEqual(commitsPayload);
  });
});
