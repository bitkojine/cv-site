import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

type SonarSeverity = 'BLOCKER' | 'CRITICAL' | 'MAJOR' | 'MINOR' | 'INFO';
type SonarType = 'BUG' | 'VULNERABILITY' | 'CODE_SMELL';

interface SonarIssue {
  key: string;
  rule: string;
  severity: SonarSeverity;
  type: SonarType;
  component: string;
  project: string;
  message: string;
  line?: number;
  creationDate?: string;
  updateDate?: string;
}

interface SonarIssuesResponse {
  total: number;
  p: number;
  ps: number;
  issues: SonarIssue[];
}

interface SonarSummaryRow {
  severity: SonarSeverity;
  count: number;
}

const args = new Map(
  process.argv.slice(2).map((arg) => {
    const [k, ...rest] = arg.replace(/^--/, '').split('=');
    return [k, rest.join('=') || 'true'];
  })
);

const host = process.env.SONAR_HOST_URL ?? 'https://sonarcloud.io';
const token = process.env.SONAR_TOKEN ?? '';
const projectKey = process.env.SONAR_PROJECT_KEY ?? args.get('project') ?? '';
const branch = process.env.SONAR_BRANCH ?? args.get('branch') ?? '';
const pullRequest = process.env.SONAR_PULL_REQUEST ?? args.get('pr') ?? '';
const pageSize = Math.min(
  500,
  Math.max(50, Number.parseInt(args.get('ps') ?? '500', 10))
);
const outRoot = resolve(process.cwd(), 'audit', 'sonar');
const timestamp = new Date()
  .toISOString()
  .replaceAll(':', '-')
  .replaceAll('.', '-');
const outDir = join(outRoot, timestamp);

function fail(message: string): never {
  process.stderr.write(`${message}\n`);
  process.exit(1);
}

function ensureConfig() {
  if (!projectKey) {
    fail('Missing SONAR_PROJECT_KEY (or --project=...).');
  }
  if (!token) {
    fail('Missing SONAR_TOKEN.');
  }
}

function toFilePath(component: string) {
  const idx = component.indexOf(':');
  return idx >= 0 ? component.slice(idx + 1) : component;
}

function authHeader(value: string) {
  const credentials = `${value}:`;
  return `Basic ${Buffer.from(credentials).toString('base64')}`;
}

async function fetchIssuesPage(page: number): Promise<SonarIssuesResponse> {
  const url = new URL('/api/issues/search', host);
  url.searchParams.set('componentKeys', projectKey);
  url.searchParams.set('resolved', 'false');
  url.searchParams.set('ps', String(pageSize));
  url.searchParams.set('p', String(page));
  if (branch) {
    url.searchParams.set('branch', branch);
  }
  if (pullRequest) {
    url.searchParams.set('pullRequest', pullRequest);
  }

  const response = await fetch(url, {
    headers: {
      Authorization: authHeader(token),
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    const body = await response.text();
    fail(
      `Sonar API error ${String(response.status)} ${response.statusText}: ${body.slice(0, 500)}`
    );
  }

  return (await response.json()) as SonarIssuesResponse;
}

async function fetchAllIssues() {
  const issues: SonarIssue[] = [];
  let page = 1;
  let total = 0;

  for (;;) {
    const data = await fetchIssuesPage(page);
    total = data.total;
    issues.push(...data.issues);
    process.stdout.write(
      `Fetched Sonar issues page ${String(page)} (${String(data.issues.length)} issues)\n`
    );
    if (issues.length >= total || data.issues.length === 0) break;
    page += 1;
  }

  return { total, issues };
}

function countBySeverity(issues: SonarIssue[]): SonarSummaryRow[] {
  const order: SonarSeverity[] = [
    'BLOCKER',
    'CRITICAL',
    'MAJOR',
    'MINOR',
    'INFO',
  ];
  const counts = new Map<SonarSeverity, number>(
    order.map((severity) => [severity, 0])
  );

  for (const issue of issues) {
    counts.set(issue.severity, (counts.get(issue.severity) ?? 0) + 1);
  }

  return order.map((severity) => ({
    severity,
    count: counts.get(severity) ?? 0,
  }));
}

function countByType(issues: SonarIssue[]) {
  const order: SonarType[] = ['BUG', 'VULNERABILITY', 'CODE_SMELL'];
  const counts = new Map<SonarType, number>(order.map((type) => [type, 0]));
  for (const issue of issues) {
    counts.set(issue.type, (counts.get(issue.type) ?? 0) + 1);
  }
  return order.map((type) => ({ type, count: counts.get(type) ?? 0 }));
}

function topFiles(issues: SonarIssue[], limit = 15) {
  const counts = new Map<string, number>();
  for (const issue of issues) {
    const path = toFilePath(issue.component);
    counts.set(path, (counts.get(path) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([file, count]) => ({ file, count }));
}

async function main() {
  ensureConfig();
  mkdirSync(outDir, { recursive: true });

  const { total, issues } = await fetchAllIssues();
  const summary = {
    runAt: new Date().toISOString(),
    host,
    projectKey,
    branch,
    pullRequest,
    total,
    bySeverity: countBySeverity(issues),
    byType: countByType(issues),
    topFiles: topFiles(issues),
  };

  writeFileSync(
    join(outDir, 'issues.json'),
    `${JSON.stringify(issues, null, 2)}\n`
  );
  writeFileSync(
    join(outDir, 'summary.json'),
    `${JSON.stringify(summary, null, 2)}\n`
  );
  writeFileSync(join(outRoot, 'latest-run.txt'), `${outDir}\n`);

  const lines = [
    '# Sonar Issue Summary',
    '',
    `- Project: \`${projectKey}\``,
    `- Branch: \`${branch || 'default'}\``,
    `- Pull Request: \`${pullRequest || 'n/a'}\``,
    `- Total Open Issues: ${String(total)}`,
    '',
    '## By Severity',
    '',
    '| Severity | Count |',
    '| --- | ---: |',
    ...summary.bySeverity.map(
      (row) => `| ${row.severity} | ${String(row.count)} |`
    ),
    '',
    '## By Type',
    '',
    '| Type | Count |',
    '| --- | ---: |',
    ...summary.byType.map((row) => `| ${row.type} | ${String(row.count)} |`),
    '',
    '## Top Files',
    '',
    '| File | Count |',
    '| --- | ---: |',
    ...summary.topFiles.map(
      (row) => `| \`${row.file}\` | ${String(row.count)} |`
    ),
  ];
  writeFileSync(join(outDir, 'summary.md'), `${lines.join('\n')}\n`);

  process.stdout.write(`Sonar artifacts: ${outDir}\n`);
  process.stdout.write(`Open issues: ${String(total)}\n`);
}

await main();
