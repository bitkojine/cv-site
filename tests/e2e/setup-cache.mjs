import { promises as fs } from 'node:fs';
import path from 'node:path';

/* eslint-disable no-undef */
const repoRoot = process.cwd();
const cacheDir = path.join(repoRoot, '.cache');
const cachePath = path.join(cacheDir, 'github.json');
const now = new Date();

const owner = 'bitkojine';
const repo = 'cv-site';

const fetchJson = async (url) => {
  const response = await fetch(url, {
    headers: {
      Accept: 'application/vnd.github+json',
    },
  });
  if (!response.ok) {
    throw new Error(`GitHub API error ${response.status} for ${url}`);
  }
  return response.json();
};

const runsUrl = new URL(
  `https://api.github.com/repos/${owner}/${repo}/actions/runs`
);
runsUrl.searchParams.set('per_page', '30');
runsUrl.searchParams.set('branch', 'main');
const runsData = await fetchJson(runsUrl.toString());
const commitsData = await fetchJson(
  `https://api.github.com/repos/${owner}/${repo}/commits?per_page=5`
);

const latestRuns = new Map();
if (runsData?.workflow_runs?.length) {
  for (const run of runsData.workflow_runs) {
    if (!latestRuns.has(run.workflow_id)) {
      latestRuns.set(run.workflow_id, run);
    }
  }
}

const payload = {
  updatedAt: now.toISOString(),
  latestWorkflowRuns: Array.from(latestRuns.values()),
  latestCommits: Array.isArray(commitsData) ? commitsData : [],
};

await fs.mkdir(cacheDir, { recursive: true });
await fs.writeFile(cachePath, JSON.stringify(payload, null, 2), 'utf-8');
