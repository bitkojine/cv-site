import { afterEach, describe, expect, it, vi } from 'vitest';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { getGithubData, type GitHubCachePayload } from '../../src/lib/github-cache';

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
});
