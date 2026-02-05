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

  it('sends If-None-Match headers when etags exist', async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'cv-site-cache-'));
    const cachePath = path.join(tempDir, 'github.json');
    const nowMs = Date.UTC(2026, 0, 4, 12, 0, 0);
    const stalePayload: GitHubCachePayload = {
      updatedAt: new Date(nowMs - 7 * 60 * 60 * 1000).toISOString(),
      etagRuns: 'etag-runs',
      etagCommits: 'etag-commits',
    };

    await fs.writeFile(cachePath, JSON.stringify(stalePayload), 'utf-8');

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
});
