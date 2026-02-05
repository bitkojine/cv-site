import { describe, expect, it } from 'vitest';
import { getGithubData } from '../../src/lib/github-actions.mts';

type MockResponse = {
  ok: boolean;
  json: () => Promise<unknown>;
};

describe('getGithubData', () => {
  it('includes the branch query parameter', async () => {
    const calls: string[] = [];
    const fetchImpl = async (url: string): Promise<MockResponse> => {
      calls.push(url);
      return { ok: true, json: async () => ({ workflow_runs: [] }) };
    };

    await getGithubData({
      owner: 'owner',
      repo: 'repo',
      branch: 'main',
      fetchImpl,
    });

    expect(calls[0]).toContain('branch=main');
  });

  it('returns empty arrays on non-ok responses', async () => {
    let call = 0;
    const fetchImpl = async (): Promise<MockResponse> => {
      call += 1;
      return { ok: false, json: async () => ({}) };
    };

    const result = await getGithubData({
      owner: 'owner',
      repo: 'repo',
      fetchImpl,
    });

    expect(call).toBe(2);
    expect(result.latestWorkflowRuns).toEqual([]);
    expect(result.latestCommits).toEqual([]);
  });
});
