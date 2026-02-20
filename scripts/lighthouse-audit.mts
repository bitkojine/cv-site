#!/usr/bin/env node
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { spawnSync, spawn } from 'node:child_process';

const args = new Set(process.argv.slice(2));
const skipBuild = args.has('--skip-build');

const minScore = Number.parseInt(process.env.LIGHTHOUSE_MIN_SCORE ?? '100', 10);
const port = Number.parseInt(process.env.LIGHTHOUSE_PORT ?? '4321', 10);
const baseUrl =
  process.env.LIGHTHOUSE_BASE_URL ?? `http://127.0.0.1:${String(port)}`;
const timestamp = new Date()
  .toISOString()
  .replaceAll(':', '-')
  .replaceAll('.', '-');
const outDir = resolve(process.cwd(), 'audit', 'lighthouse', timestamp);
const routes = [
  '/',
  '/hiring',
  '/hiring/evidence',
  '/hiring/pack',
  '/build',
  '/vision',
  '/dev',
  '/operating-system',
  '/blog',
  '/blog/welcome',
];
const scoreCategories = [
  'performance',
  'accessibility',
  'best-practices',
  'seo',
];

function run(cmd, cmdArgs, options = {}) {
  const result = spawnSync(cmd, cmdArgs, {
    stdio: 'inherit',
    shell: false,
    ...options,
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function sleep(ms) {
  return new Promise((resolveSleep) => {
    setTimeout(resolveSleep, ms);
  });
}

function slugify(route) {
  const normalized = route.replace(/^\//, '').replaceAll('/', '-');
  return normalized.length === 0 ? 'home' : normalized;
}

function categoryScore(report, key) {
  return Math.round((report.categories[key]?.score ?? 0) * 100);
}

function parseReport(reportPath) {
  try {
    return JSON.parse(readFileSync(reportPath, 'utf8'));
  } catch {
    return null;
  }
}

function hasValidScores(report) {
  return scoreCategories.every((key) => {
    const value = report?.categories?.[key]?.score;
    return Number.isFinite(value);
  });
}

function buildLighthouseArgs(url, mode, outputPath, throttlingMethod) {
  const baseArgs = [
    '--no-install',
    '-y',
    'lighthouse',
    url,
    '--only-categories=performance,accessibility,best-practices,seo',
    `--throttling-method=${throttlingMethod}`,
    '--quiet',
    '--chrome-flags=--headless --no-sandbox --disable-dev-shm-usage',
    '--output=json',
    '--output=html',
    `--output-path=${outputPath}`,
  ];

  if (mode === 'desktop') {
    return [...baseArgs, '--preset=desktop'];
  }

  return [...baseArgs, '--emulated-form-factor=mobile'];
}

async function runLighthouseWithRetry({
  url,
  route,
  mode,
  outputPath,
  maxAttempts = 5,
}) {
  const reportPath = `${outputPath}.report.json`;
  const throttlingPlan = [
    'provided',
    'provided',
    'provided',
    'devtools',
    'devtools',
  ];

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const throttlingMethod =
      throttlingPlan[attempt - 1] ?? throttlingPlan[throttlingPlan.length - 1];
    const result = spawnSync(
      'npx',
      buildLighthouseArgs(url, mode, outputPath, throttlingMethod),
      {
        encoding: 'utf8',
        shell: false,
      }
    );

    if (result.stdout) process.stdout.write(result.stdout);
    if (result.stderr) process.stderr.write(result.stderr);

    const report = parseReport(reportPath);
    const valid = report !== null && hasValidScores(report);
    const output = `${result.stdout ?? ''}\n${result.stderr ?? ''}`;
    const hasLanternError =
      output.includes('LanternError') ||
      output.includes('missing metric scores for specified navigation') ||
      Boolean(report?.runtimeError);

    if (result.status === 0 && valid && !hasLanternError) {
      return report;
    }

    if (attempt < maxAttempts) {
      const nextThrottlingMethod =
        throttlingPlan[attempt] ?? throttlingPlan[throttlingPlan.length - 1];
      const methodSwitchNote =
        nextThrottlingMethod !== throttlingMethod
          ? `; switching throttling method to ${nextThrottlingMethod}`
          : '';
      process.stdout.write(
        `Retrying Lighthouse for ${route} [${mode}] (attempt ${String(attempt + 1)}/${String(maxAttempts)}, method=${nextThrottlingMethod}${methodSwitchNote})...\n`
      );
      await sleep(1500 * attempt);
      continue;
    }

    const runtimeCode = report?.runtimeError?.code
      ? ` runtimeError=${report.runtimeError.code}`
      : '';
    const lanternHint = hasLanternError ? ' Lantern/trace error detected.' : '';
    throw new Error(
      `Lighthouse failed for ${route} [${mode}] after ${String(maxAttempts)} attempts (last method=${throttlingMethod}).${runtimeCode}${lanternHint}`
    );
  }

  throw new Error(`Unreachable Lighthouse retry state for ${route} [${mode}]`);
}

async function main() {
  rmSync(outDir, { force: true, recursive: true });
  mkdirSync(join(outDir, 'mobile'), { recursive: true });
  mkdirSync(join(outDir, 'desktop'), { recursive: true });

  if (!skipBuild) {
    run('npm', ['run', 'build']);
  }

  const server = spawn(
    'python3',
    ['-m', 'http.server', String(port), '--directory', 'dist'],
    {
      stdio: 'ignore',
    }
  );

  const cleanup = () => {
    if (!server.killed) {
      server.kill('SIGTERM');
    }
  };

  process.on('exit', cleanup);
  process.on('SIGINT', () => {
    cleanup();
    process.exit(130);
  });
  process.on('SIGTERM', () => {
    cleanup();
    process.exit(143);
  });

  await sleep(1200);

  const rows = [];

  for (const route of routes) {
    const slug = slugify(route);
    const url = `${baseUrl}${route}`;
    const reports = {
      mobile: await runLighthouseWithRetry({
        url,
        route,
        mode: 'mobile',
        outputPath: join(outDir, 'mobile', slug),
      }),
      desktop: await runLighthouseWithRetry({
        url,
        route,
        mode: 'desktop',
        outputPath: join(outDir, 'desktop', slug),
      }),
    };

    for (const mode of ['mobile', 'desktop']) {
      const report = reports[mode];
      rows.push({
        mode,
        route,
        performance: categoryScore(report, 'performance'),
        accessibility: categoryScore(report, 'accessibility'),
        bestPractices: categoryScore(report, 'best-practices'),
        seo: categoryScore(report, 'seo'),
      });
    }
    process.stdout.write(`Audited ${route}\n`);
  }

  cleanup();

  const summary = {
    runAt: new Date().toISOString(),
    minScore,
    rows,
  };

  const failing = rows.filter((row) =>
    [row.performance, row.accessibility, row.bestPractices, row.seo].some(
      (score) => score < minScore
    )
  );

  summary.failCount = failing.length;
  summary.passing = failing.length === 0;

  writeFileSync(
    join(outDir, 'summary.json'),
    `${JSON.stringify(summary, null, 2)}\n`
  );

  const markdownLines = [
    '# Lighthouse Summary',
    '',
    `- Run at: ${summary.runAt}`,
    `- Threshold: ${String(minScore)}`,
    `- Status: ${summary.passing ? 'PASS' : 'FAIL'}`,
    '',
    '| Mode | Route | Perf | A11y | Best | SEO |',
    '| --- | --- | ---: | ---: | ---: | ---: |',
  ];

  for (const row of rows) {
    markdownLines.push(
      `| ${row.mode} | ${row.route} | ${String(row.performance)} | ${String(row.accessibility)} | ${String(row.bestPractices)} | ${String(row.seo)} |`
    );
  }

  writeFileSync(join(outDir, 'summary.md'), `${markdownLines.join('\n')}\n`);
  writeFileSync(
    resolve(process.cwd(), 'audit', 'lighthouse', 'latest-run.txt'),
    `${outDir}\n`
  );

  process.stdout.write(`Lighthouse artifacts: ${outDir}\n`);

  if (!summary.passing) {
    process.stderr.write('Lighthouse threshold check failed.\n');
    process.exit(1);
  }
}

await main();
