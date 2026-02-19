import { describe, expect, it } from 'vitest';
import { getGithubData } from '../../src/lib/github-actions.mts';

interface MockResponse {
  ok: boolean;
  json: () => Promise<unknown>;
}

describe('getGithubData', () => {
  it('includes the branch query parameter', async () => {
    const calls: string[] = [],
     fetchImpl = async (url: string): Promise<MockResponse> => {
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
    },

     result = await getGithubData({
      owner: 'owner',
      repo: 'repo',
      fetchImpl,
    });

    expect(call).toBe(2);
    expect(result.workflowRuns).toEqual([]);
    expect(result.latestWorkflowRuns).toEqual([]);
    expect(result.latestCommits).toEqual([]);
  });

  it('returns full workflow history and deduped latest workflow runs', async () => {
    const workflowRuns = [
      {
        workflow_id: 10,
        name: 'Deploy to GitHub Pages',
        html_url: 'https://example.com/runs/3',
        status: 'in_progress',
        conclusion: null,
      },
      {
        workflow_id: 10,
        name: 'Deploy to GitHub Pages',
        html_url: 'https://example.com/runs/2',
        status: 'completed',
        conclusion: 'success',
      },
      {
        workflow_id: 20,
        name: 'CI',
        html_url: 'https://example.com/runs/1',
        status: 'completed',
        conclusion: 'success',
      },
    ];

    let call = 0;
    const fetchImpl = async (): Promise<MockResponse> => {
      call += 1;
      if (call === 1) {
        return {
          ok: true,
          json: async () => ({ workflow_runs: workflowRuns }),
        };
      }
      return { ok: true, json: async () => [] };
    },

     result = await getGithubData({
      owner: 'owner',
      repo: 'repo',
      fetchImpl,
    });

    expect(result.workflowRuns).toEqual(workflowRuns);
    expect(result.latestWorkflowRuns).toEqual([
      workflowRuns[0],
      workflowRuns[2],
    ]);
  });

  it('drops malformed workflow entries that fail schema validation', async () => {
    let call = 0;
    const fetchImpl = async (): Promise<MockResponse> => {
      call += 1;
      if (call === 1) {
        return {
          ok: true,
          json: async () => ({
            workflow_runs: [
              {
                workflow_id: 10,
                name: 'CI',
                html_url: 'https://example.com/runs/1',
                status: 'completed',
                conclusion: 'success',
              },
              {
                workflow_id: 11,
                name: 'Deploy',
                html_url: 'https://example.com/runs/2',
                status: 'done',
                conclusion: 'success',
              },
            ],
          }),
        };
      }
      return { ok: true, json: async () => [] };
    },

     result = await getGithubData({
      owner: 'owner',
      repo: 'repo',
      fetchImpl,
    });

    expect(result.workflowRuns).toEqual([]);
    expect(result.latestWorkflowRuns).toEqual([]);
  });
});
