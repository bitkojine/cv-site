import { mkdirSync, writeFileSync, appendFileSync } from 'node:fs';
import { join } from 'node:path';
import { spawn } from 'node:child_process';
import os from 'node:os';
import http from 'node:http';
import https from 'node:https';
import { performance } from 'node:perf_hooks';

const {
  process,
  fetch,
  AbortController,
  URL,
  setTimeout,
  clearTimeout,
  setInterval,
  clearInterval,
} = globalThis;

const TOTAL_BUDGET_MS = 5 * 60 * 1000;
const START_TS = Date.now();
const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const artifactsDir = join(process.cwd(), 'stress', 'artifacts', stamp);
mkdirSync(artifactsDir, { recursive: true });
mkdirSync(join(artifactsDir, 'screenshots'), { recursive: true });

const BASE_URL = (process.env.BASE_URL || 'http://127.0.0.1:4321').replace(
  /\/$/,
  ''
);
const AUTO_START_SERVER = process.env.AUTO_START_SERVER !== '0';
const endpoints = [
  '/',
  '/hiring',
  '/build',
  '/vision',
  '/dev',
  '/blog',
  '/linkedin',
  '/github-activity.json',
];
const writeTargets = ['/hiring', '/build', '/vision', '/dev', '/blog'];
const fuzzTargets = ['/', '/hiring', '/dev', '/blog', '/github-activity.json'];
const issues = [];
const assumptions = [];

const phaseResults = {};
const runnerLog = join(artifactsDir, 'runner.log');
const resourceLog = join(artifactsDir, 'resource-samples.jsonl');
const failuresFile = join(artifactsDir, 'failed-payloads.json');
const reproductionFile = join(artifactsDir, 'reproduction-commands.txt');
const errorSampleLimit = 100;

let localServerProc = null;
let proxyServer = null;
let resourceSampler = null;
const failureSamples = [];
const readDuration = (name, fallback) => {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};
const DURATIONS = {
  baselineMs: readDuration('DURATION_BASELINE_MS', 25000),
  burstMs: readDuration('DURATION_BURST_MS', 85000),
  breakpointStepMs: readDuration('DURATION_BREAKPOINT_STEP_MS', 14000),
  writeMs: readDuration('DURATION_WRITE_MS', 55000),
  uiMs: readDuration('DURATION_UI_MS', 55000),
  fuzzMs: readDuration('DURATION_FUZZ_MS', 40000),
  dependencyMs: readDuration('DURATION_DEP_MS', 35000),
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}\n`;
  appendFileSync(runnerLog, line);
  process.stdout.write(line);
}

function budgetCheck(label) {
  const elapsed = Date.now() - START_TS;
  if (elapsed > TOTAL_BUDGET_MS) {
    throw new Error(
      `Global 5-minute budget exceeded before ${label}. elapsed_ms=${elapsed}`
    );
  }
}

function percentile(values, p) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, Math.min(sorted.length - 1, idx))];
}

function summarizeMetric(metric, durationMs) {
  const total = metric.total || 0;
  const errorCount = metric.errors + metric.timeouts + metric.non2xx5xx;
  return {
    totalRequests: total,
    success: metric.success,
    errors: metric.errors,
    timeouts: metric.timeouts,
    non2xx5xx: metric.non2xx5xx,
    statusCounts: metric.statusCounts,
    p50Ms: Number(percentile(metric.latencies, 50).toFixed(2)),
    p95Ms: Number(percentile(metric.latencies, 95).toFixed(2)),
    p99Ms: Number(percentile(metric.latencies, 99).toFixed(2)),
    rps: Number((total / (durationMs / 1000)).toFixed(2)),
    errorRate: total ? Number((errorCount / total).toFixed(4)) : 0,
  };
}

function newMetric() {
  return {
    total: 0,
    success: 0,
    errors: 0,
    timeouts: 0,
    non2xx5xx: 0,
    latencies: [],
    statusCounts: {},
  };
}

function pushFailureSample(sample) {
  if (failureSamples.length < errorSampleLimit) failureSamples.push(sample);
}

async function runWorkers({
  name,
  durationMs,
  concurrency,
  pickRequest,
  timeoutMs = 4000,
  expectedStatuses = null,
}) {
  budgetCheck(name);
  log(
    `phase ${name} start duration=${durationMs}ms concurrency=${concurrency}`
  );
  const startedAt = performance.now();
  const endAt = startedAt + durationMs;
  const aggregate = newMetric();
  const byEndpoint = {};
  let stop = false;

  const workers = Array.from({ length: concurrency }, (_, workerId) =>
    (async () => {
      while (!stop && performance.now() < endAt) {
        const req = pickRequest(workerId);
        const endpointMetric = byEndpoint[req.path] || newMetric();
        byEndpoint[req.path] = endpointMetric;
        const t0 = performance.now();
        const ac = new AbortController();
        const timeout = setTimeout(() => ac.abort(), timeoutMs);
        try {
          const res = await fetch(`${req.baseUrl || BASE_URL}${req.path}`, {
            method: req.method || 'GET',
            headers: req.headers || {},
            body: req.body,
            signal: ac.signal,
          });
          const elapsed = performance.now() - t0;
          clearTimeout(timeout);
          aggregate.total++;
          endpointMetric.total++;
          aggregate.latencies.push(elapsed);
          endpointMetric.latencies.push(elapsed);
          aggregate.statusCounts[res.status] =
            (aggregate.statusCounts[res.status] || 0) + 1;
          endpointMetric.statusCounts[res.status] =
            (endpointMetric.statusCounts[res.status] || 0) + 1;
          const expected = expectedStatuses || req.expectedStatuses;
          const ok = expected
            ? expected.includes(res.status)
            : res.status < 500;
          if (ok) {
            aggregate.success++;
            endpointMetric.success++;
          } else {
            aggregate.non2xx5xx++;
            endpointMetric.non2xx5xx++;
            const bodyText = await res.text().catch(() => '');
            pushFailureSample({
              phase: name,
              path: req.path,
              method: req.method || 'GET',
              status: res.status,
              body: req.body || null,
              responseExcerpt: bodyText.slice(0, 600),
            });
          }
        } catch (err) {
          clearTimeout(timeout);
          aggregate.total++;
          endpointMetric.total++;
          if (String(err).includes('AbortError')) {
            aggregate.timeouts++;
            endpointMetric.timeouts++;
          } else {
            aggregate.errors++;
            endpointMetric.errors++;
          }
          pushFailureSample({
            phase: name,
            path: req.path,
            method: req.method || 'GET',
            error: String(err),
            body: req.body || null,
          });
        }
      }
    })()
  );

  await Promise.all(workers);
  stop = true;
  const durationActual = performance.now() - startedAt;
  const summary = {
    name,
    durationMs: Math.round(durationActual),
    concurrency,
    aggregate: summarizeMetric(aggregate, durationActual),
    endpoints: Object.fromEntries(
      Object.entries(byEndpoint).map(([k, v]) => [
        k,
        summarizeMetric(v, durationActual),
      ])
    ),
  };
  writeFileSync(
    join(artifactsDir, `${name}.json`),
    JSON.stringify(summary, null, 2)
  );
  log(`phase ${name} done`);
  return summary;
}

async function ensureServerReachable() {
  try {
    const res = await fetch(`${BASE_URL}/`, { method: 'GET' });
    return res.status > 0;
  } catch {
    return false;
  }
}

async function startLocalServerIfNeeded() {
  const up = await ensureServerReachable();
  if (up) return;
  if (!AUTO_START_SERVER) {
    throw new Error(
      `BASE_URL unreachable and AUTO_START_SERVER=0: ${BASE_URL}`
    );
  }
  assumptions.push(
    'BASE_URL not provided or unreachable; started local Astro dev server at http://127.0.0.1:4321.'
  );
  localServerProc = spawn(
    'npm',
    ['run', 'dev', '--', '--host', '127.0.0.1', '--port', '4321'],
    {
      stdio: 'pipe',
      cwd: process.cwd(),
    }
  );
  localServerProc.stdout.on('data', (d) =>
    appendFileSync(join(artifactsDir, 'server.log'), d.toString())
  );
  localServerProc.stderr.on('data', (d) =>
    appendFileSync(join(artifactsDir, 'server.log'), d.toString())
  );

  const startWait = Date.now();
  while (Date.now() - startWait < 30000) {
    if (await ensureServerReachable()) {
      log('local server is reachable');
      return;
    }
    await sleep(500);
  }
  throw new Error('Local server failed to become reachable within 30s.');
}

function startResourceSampling() {
  resourceSampler = setInterval(() => {
    const sample = {
      ts: new Date().toISOString(),
      uptimeSec: Math.round(process.uptime()),
      loadAvg: os.loadavg(),
      freeMem: os.freemem(),
      totalMem: os.totalmem(),
    };
    appendFileSync(resourceLog, `${JSON.stringify(sample)}\n`);
  }, 5000);
}

function stopResourceSampling() {
  if (resourceSampler) clearInterval(resourceSampler);
}

async function runBaseline() {
  return runWorkers({
    name: 'A_baseline_smoke',
    durationMs: DURATIONS.baselineMs,
    concurrency: Number(process.env.BASELINE_VUS || 8),
    pickRequest: () => ({
      path: endpoints[Math.floor(Math.random() * endpoints.length)],
      method: 'GET',
      expectedStatuses: [200, 301, 302, 304],
    }),
    timeoutMs: 2500,
  });
}

async function runHighBurst() {
  return runWorkers({
    name: 'B_high_intensity_burst',
    durationMs: DURATIONS.burstMs,
    concurrency: Number(process.env.BURST_VUS || 180),
    pickRequest: (wid) => ({
      path: endpoints[wid % endpoints.length],
      method: 'GET',
      expectedStatuses: [200, 301, 302, 304],
    }),
    timeoutMs: 5000,
  });
}

async function runBreakpoint() {
  budgetCheck('C_breakpoint_stress_escalation');
  const steps = [100, 200, 400, 600];
  const eachMs = DURATIONS.breakpointStepMs;
  const stepSummaries = [];
  let firstFailure = null;
  for (const vus of steps) {
    const name = `C_breakpoint_vus_${vus}`;
    const summary = await runWorkers({
      name,
      durationMs: eachMs,
      concurrency: vus,
      pickRequest: (wid) => ({
        path: endpoints[wid % endpoints.length],
        method: 'GET',
        expectedStatuses: [200, 301, 302, 304],
      }),
      timeoutMs: 6000,
    });
    stepSummaries.push(summary);
    const p99 = summary.aggregate.p99Ms;
    const errRate = summary.aggregate.errorRate;
    if (!firstFailure && (p99 > 5000 || errRate > 0.05)) {
      firstFailure = { vus, p99Ms: p99, errorRate: errRate };
    }
  }
  const final = { steps: stepSummaries, firstFailure };
  writeFileSync(
    join(artifactsDir, 'C_breakpoint_stress_escalation.json'),
    JSON.stringify(final, null, 2)
  );
  return final;
}

async function runWriteAttack() {
  const body = JSON.stringify({
    sameResourceId: 'fixed-resource-key',
    actor: 'stress-test-user',
    payload: 'double-submit-probe',
  });
  return runWorkers({
    name: 'D_concurrency_attack_writes',
    durationMs: DURATIONS.writeMs,
    concurrency: Number(process.env.WRITE_VUS || 120),
    pickRequest: (wid) => ({
      path: writeTargets[wid % writeTargets.length],
      method: ['POST', 'PUT', 'PATCH'][wid % 3],
      headers: {
        'content-type': 'application/json',
        'x-idempotency-key': 'same-key',
      },
      body,
      expectedStatuses: [404, 405, 415, 400],
    }),
    timeoutMs: 4500,
  });
}

function fuzzPayloads() {
  const huge = 'X'.repeat(128 * 1024);
  return [
    {
      method: 'POST',
      body: '{bad-json',
      headers: { 'content-type': 'application/json' },
    },
    {
      method: 'POST',
      body: JSON.stringify({ missing: true }),
      headers: { 'content-type': 'application/json' },
    },
    {
      method: 'POST',
      body: JSON.stringify({ age: 'not-a-number', email: 1234 }),
      headers: { 'content-type': 'application/json' },
    },
    {
      method: 'POST',
      body: JSON.stringify({ blob: huge }),
      headers: { 'content-type': 'application/json' },
    },
    {
      method: 'POST',
      body: JSON.stringify({ unicode: '💥\u0000\u2028\u2029中文العربية' }),
      headers: { 'content-type': 'application/json' },
    },
    { method: 'GET', body: null, headers: { 'x-test': huge.slice(0, 4096) } },
  ];
}

async function runFuzzBurst() {
  return runWorkers({
    name: 'F_api_fuzz_burst',
    durationMs: DURATIONS.fuzzMs,
    concurrency: Number(process.env.FUZZ_VUS || 70),
    pickRequest: (wid) => {
      const payload = fuzzPayloads()[wid % fuzzPayloads().length];
      return {
        path: fuzzTargets[wid % fuzzTargets.length],
        method: payload.method,
        headers: payload.headers,
        body: payload.body,
        expectedStatuses: [400, 404, 405, 415, 422],
      };
    },
    timeoutMs: 4000,
  });
}

async function runUiChaos() {
  budgetCheck('E_smart_ui_chaos');
  log('phase E_smart_ui_chaos start');
  const mod = await import('@playwright/test');
  const { chromium } = mod;
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const result = {
    name: 'E_smart_ui_chaos',
    durationMs: DURATIONS.uiMs,
    consoleErrors: [],
    uncaughtExceptions: [],
    failedRequests: [],
    screenshots: [],
    frozenStateDetected: false,
  };

  page.on('console', (msg) => {
    if (msg.type() === 'error') result.consoleErrors.push(msg.text());
  });
  page.on('pageerror', (err) => result.uncaughtExceptions.push(String(err)));
  page.on('requestfailed', (req) => {
    result.failedRequests.push({
      url: req.url(),
      method: req.method(),
      failure: req.failure()?.errorText || 'unknown',
    });
  });

  await context.route('**/*', async (route) => {
    const jitter = 200 + Math.floor(Math.random() * 300);
    await sleep(jitter);
    if (Math.random() < 0.01) {
      await route.abort('failed');
      return;
    }
    await route.continue();
  });

  const paths = [
    ...new Set(endpoints.filter((p) => p !== '/github-activity.json')),
  ];
  const start = Date.now();
  let loops = 0;
  let lastMutation = Date.now();
  try {
    await page.goto(`${BASE_URL}/`, {
      waitUntil: 'domcontentloaded',
      timeout: 12000,
    });
  } catch (err) {
    result.uncaughtExceptions.push(`initial_goto_failed: ${String(err)}`);
  }
  while (Date.now() - start < DURATIONS.uiMs) {
    loops++;
    const path = paths[Math.floor(Math.random() * paths.length)];
    await page
      .goto(`${BASE_URL}${path}`, {
        waitUntil: 'domcontentloaded',
        timeout: 7000,
      })
      .catch(() => {});

    const formFields = page.locator('input, textarea');
    const fieldCount = await formFields.count();
    for (let i = 0; i < Math.min(5, fieldCount); i++) {
      await formFields
        .nth(i)
        .fill('x'.repeat(256))
        .catch(() => {});
      lastMutation = Date.now();
    }

    for (let i = 0; i < 5; i++) {
      await page.mouse
        .click(40 + Math.random() * 900, 40 + Math.random() * 500)
        .catch(() => {});
      lastMutation = Date.now();
    }
    await page.goBack().catch(() => {});
    await page.goForward().catch(() => {});

    if (loops % 15 === 0) {
      await context.setOffline(true);
      await sleep(600);
      await context.setOffline(false);
    }
    if (loops % 10 === 0) {
      const shot = join(artifactsDir, 'screenshots', `ui-chaos-${loops}.png`);
      await page.screenshot({ path: shot, fullPage: true }).catch(() => {});
      result.screenshots.push(shot);
    }
    if (Date.now() - lastMutation > 15000) result.frozenStateDetected = true;
  }
  await browser.close();
  writeFileSync(
    join(artifactsDir, 'E_smart_ui_chaos.json'),
    JSON.stringify(result, null, 2)
  );
  log('phase E_smart_ui_chaos done');
  return result;
}

async function startDelayProxy(targetBaseUrl) {
  const parsed = new URL(targetBaseUrl);
  const port = Number(process.env.DEP_PROXY_PORT || 7777);
  proxyServer = http.createServer(async (req, res) => {
    const delay = 300 + Math.floor(Math.random() * 500);
    await sleep(delay);
    const target = `${targetBaseUrl}${req.url}`;
    try {
      const upstream = await fetch(target, {
        method: req.method,
        headers: req.headers,
      });
      if (!res.headersSent) {
        res.writeHead(
          upstream.status,
          Object.fromEntries(upstream.headers.entries())
        );
      }
      const txt = await upstream.text();
      if (!res.writableEnded) res.end(txt);
    } catch (err) {
      const body = JSON.stringify({
        error: 'upstream_timeout',
        message: String(err),
      });
      if (!res.headersSent) {
        res.writeHead(504, { 'content-type': 'application/json' });
      }
      if (!res.writableEnded) res.end(body);
      pushFailureSample({
        phase: 'G_dependency_latency_simulation',
        path: req.url || '',
        method: req.method || 'GET',
        error: String(err),
      });
    }
  });
  await new Promise((resolve, reject) => {
    proxyServer.once('error', reject);
    proxyServer.listen(port, '127.0.0.1', resolve);
  });
  const proxyProto = parsed.protocol === 'https:' ? https : http;
  proxyProto.globalAgent.maxSockets = 1000;
  return `http://127.0.0.1:${port}`;
}

async function runDependencyLatencySimulation() {
  assumptions.push(
    'Direct DB/cache latency injection is unavailable for this static app; simulated dependency slowdown through a local delay proxy (+300-800ms per request).'
  );
  const delayedBase = await startDelayProxy(BASE_URL);
  const result = await runWorkers({
    name: 'G_dependency_latency_simulation',
    durationMs: DURATIONS.dependencyMs,
    concurrency: Number(process.env.DEP_VUS || 90),
    pickRequest: (wid) => ({
      baseUrl: delayedBase,
      path: endpoints[wid % endpoints.length],
      method: 'GET',
      expectedStatuses: [200, 301, 302, 304],
    }),
    timeoutMs: 7000,
  });
  return result;
}

function detectIssues() {
  const baseline = phaseResults.A_baseline_smoke?.aggregate;
  const burst = phaseResults.B_high_intensity_burst?.aggregate;
  const breakpoint = phaseResults.C_breakpoint_stress_escalation;
  const writes = phaseResults.D_concurrency_attack_writes?.aggregate;
  const chaos = phaseResults.E_smart_ui_chaos;
  const fuzz = phaseResults.F_api_fuzz_burst?.aggregate;
  const dep = phaseResults.G_dependency_latency_simulation?.aggregate;

  if (baseline && baseline.p95Ms > 2000) {
    issues.push({
      title: 'Baseline p95 above 2s',
      severity: 'P1',
      repro: 'BASE_URL=http://127.0.0.1:4321 ./stress/run_all.sh',
      metrics: baseline,
      evidence: join(artifactsDir, 'A_baseline_smoke.json'),
      suspectedRootCause:
        'High base latency before load indicates expensive render path or saturated runtime.',
      suggestedFix:
        'Profile top routes and optimize initial response path; add cache headers for static routes.',
      verification: 'Re-run baseline phase and confirm p95 < 2s.',
    });
  }
  if (burst && burst.errorRate > 0.01) {
    issues.push({
      title: 'Error rate above 1% under high burst',
      severity: 'P1',
      repro: 'BASE_URL=http://127.0.0.1:4321 BURST_VUS=180 ./stress/run_all.sh',
      metrics: burst,
      evidence: join(artifactsDir, 'B_high_intensity_burst.json'),
      suspectedRootCause:
        'Connection or worker saturation under spike traffic.',
      suggestedFix:
        'Increase runtime concurrency limits and enforce queue/backpressure.',
      verification: 'Repeat burst; require errorRate <= 1%.',
    });
  }
  if (breakpoint?.firstFailure) {
    issues.push({
      title: `Instability threshold crossed at ${breakpoint.firstFailure.vus} VUs`,
      severity: 'P1',
      repro: 'BASE_URL=http://127.0.0.1:4321 ./stress/run_all.sh',
      metrics: breakpoint.firstFailure,
      evidence: join(artifactsDir, 'C_breakpoint_stress_escalation.json'),
      suspectedRootCause: 'Resource saturation as concurrency steps upward.',
      suggestedFix:
        'Cap concurrency and autoscale/queue before saturation threshold.',
      verification:
        'Step test should keep p99 < 5s and error rate < 5% through target load.',
    });
  }
  if (writes && writes.statusCounts['500']) {
    issues.push({
      title: 'Server 500s during write-concurrency attack',
      severity: 'P0',
      repro: 'BASE_URL=http://127.0.0.1:4321 WRITE_VUS=120 ./stress/run_all.sh',
      metrics: writes,
      evidence: join(artifactsDir, 'D_concurrency_attack_writes.json'),
      suspectedRootCause:
        'Write handler exception under duplicate submit pattern.',
      suggestedFix:
        'Add idempotency keys and optimistic locking; handle duplicate writes safely.',
      verification: 'No 5xx across 60s concurrent write attack.',
    });
  }
  if (
    chaos &&
    (chaos.uncaughtExceptions.length ||
      chaos.consoleErrors.length ||
      chaos.frozenStateDetected)
  ) {
    const unexpectedConsoleErrors = (chaos.consoleErrors || []).filter(
      (entry) =>
        !String(entry).includes('Failed to load resource') &&
        !String(entry).includes('net::ERR_FAILED') &&
        !String(entry).includes('net::ERR_ABORTED')
    );
    issues.push({
      title: 'UI chaos uncovered uncaught errors/freeze symptoms',
      severity: 'P1',
      repro: 'BASE_URL=http://127.0.0.1:4321 ./stress/run_all.sh',
      metrics: {
        consoleErrors: unexpectedConsoleErrors.length,
        uncaughtExceptions: chaos.uncaughtExceptions.length,
        failedRequests: chaos.failedRequests.length,
        frozenStateDetected: chaos.frozenStateDetected,
      },
      evidence: join(artifactsDir, 'E_smart_ui_chaos.json'),
      suspectedRootCause:
        'Client-side flow lacks guards for degraded network/offline transitions.',
      suggestedFix:
        'Handle rejected promises and network/offline events with resilient UI fallbacks.',
      verification:
        'Repeat UI chaos with 0 uncaught exceptions and no frozen-state flag.',
    });
    if (
      unexpectedConsoleErrors.length === 0 &&
      !chaos.uncaughtExceptions.length &&
      !chaos.frozenStateDetected
    ) {
      issues.pop();
    }
  }
  if (fuzz && fuzz.statusCounts['500']) {
    issues.push({
      title: 'API fuzz produced server 500 responses',
      severity: 'P0',
      repro: 'BASE_URL=http://127.0.0.1:4321 FUZZ_VUS=70 ./stress/run_all.sh',
      metrics: fuzz,
      evidence: join(artifactsDir, 'F_api_fuzz_burst.json'),
      suspectedRootCause:
        'Input validation gap or unhandled parsing exceptions.',
      suggestedFix:
        'Centralize schema validation and enforce stable 4xx error contract.',
      verification: 'Fuzz run should have no 5xx and no stack traces.',
    });
  }
  if (dep && dep.errorRate > 0.05) {
    issues.push({
      title: 'Dependency slowdown caused cascading failure',
      severity: 'P1',
      repro: 'BASE_URL=http://127.0.0.1:4321 ./stress/run_all.sh',
      metrics: dep,
      evidence: join(artifactsDir, 'G_dependency_latency_simulation.json'),
      suspectedRootCause:
        'No bulkhead/circuit-breaker behavior under elevated upstream latency.',
      suggestedFix:
        'Add timeout budgets, retries with jitter, and fail-fast degradation path.',
      verification: 'Latency simulation should keep error rate < 5%.',
    });
  }
}

function buildReport() {
  const elapsedMs = Date.now() - START_TS;
  const baseline = phaseResults.A_baseline_smoke?.aggregate;
  const burst = phaseResults.B_high_intensity_burst?.aggregate;
  const dep = phaseResults.G_dependency_latency_simulation?.aggregate;
  const breakpoint = phaseResults.C_breakpoint_stress_escalation?.firstFailure;

  const firstDegraded = [
    {
      phase: 'A baseline',
      p95: baseline?.p95Ms || 0,
      errorRate: baseline?.errorRate || 0,
    },
    {
      phase: 'B burst',
      p95: burst?.p95Ms || 0,
      errorRate: burst?.errorRate || 0,
    },
    {
      phase: 'G dependency-latency',
      p95: dep?.p95Ms || 0,
      errorRate: dep?.errorRate || 0,
    },
  ].sort(
    (a, b) => b.p95 + b.errorRate * 1000 - (a.p95 + a.errorRate * 1000)
  )[0];

  const lines = [];
  lines.push('# Stress Test Report');
  lines.push('');
  lines.push(`- Run timestamp: ${new Date().toISOString()}`);
  lines.push(`- Base URL: ${BASE_URL}`);
  lines.push(`- Total wall-clock: ${(elapsedMs / 1000).toFixed(1)}s`);
  lines.push(
    `- Budget check (<= 300s): ${elapsedMs <= TOTAL_BUDGET_MS ? 'PASS' : 'FAIL'}`
  );
  lines.push('');
  lines.push('## Assumptions');
  if (!assumptions.length) lines.push('- None.');
  for (const a of assumptions) lines.push(`- ${a}`);
  lines.push('');
  lines.push('## What Broke');
  if (!issues.length)
    lines.push(
      '- No critical breakage detected under this 5-minute burst suite.'
    );
  for (const issue of issues) {
    lines.push(`- [${issue.severity}] ${issue.title}`);
    lines.push(`  - Repro: \`${issue.repro}\``);
    lines.push(`  - Evidence: \`${issue.evidence}\``);
    lines.push(`  - Suspected root cause: ${issue.suspectedRootCause}`);
    lines.push(`  - Suggested fix: ${issue.suggestedFix}`);
    lines.push(`  - Verification: ${issue.verification}`);
  }
  lines.push('');
  lines.push('## What Degraded First');
  lines.push(
    `- Most degraded phase: ${firstDegraded.phase} (p95=${firstDegraded.p95}ms, errorRate=${firstDegraded.errorRate})`
  );
  if (breakpoint) {
    lines.push(
      `- Breakpoint crossed at ${breakpoint.vus} VUs (p99=${breakpoint.p99Ms}ms, errorRate=${breakpoint.errorRate})`
    );
  } else {
    lines.push('- Breakpoint threshold not crossed in configured escalation.');
  }
  lines.push('');
  lines.push('## Reproduction Commands');
  lines.push('- Full suite:');
  lines.push('```bash');
  lines.push(`BASE_URL=${BASE_URL} ./stress/run_all.sh`);
  lines.push('```');
  lines.push('- Focus burst only:');
  lines.push('```bash');
  lines.push(`BASE_URL=${BASE_URL} BURST_VUS=180 node stress/run_all.mjs`);
  lines.push('```');
  lines.push('');
  lines.push('## Evidence');
  lines.push(`- Latency and error summaries: \`${artifactsDir}/*.json\``);
  lines.push(`- Resource samples: \`${resourceLog}\``);
  lines.push(`- Failed payloads: \`${failuresFile}\``);
  lines.push(`- UI screenshots: \`${join(artifactsDir, 'screenshots')}\``);
  lines.push(`- Runner log: \`${runnerLog}\``);

  writeFileSync(
    join(process.cwd(), 'stress', 'README.md'),
    `${lines.join('\n')}\n`
  );
  writeFileSync(reproductionFile, `BASE_URL=${BASE_URL} ./stress/run_all.sh\n`);
}

async function cleanup() {
  stopResourceSampling();
  if (proxyServer) {
    await new Promise((resolve) => proxyServer.close(resolve));
  }
  if (localServerProc) {
    localServerProc.kill('SIGTERM');
  }
}

async function main() {
  try {
    log(`stress harness start base_url=${BASE_URL}`);
    await startLocalServerIfNeeded();
    startResourceSampling();

    phaseResults.A_baseline_smoke = await runBaseline();
    budgetCheck('after A');

    const burstPromise = runHighBurst()
      .then((v) => {
        phaseResults.B_high_intensity_burst = v;
        return v;
      })
      .catch((err) => {
        const failure = {
          name: 'B_high_intensity_burst',
          fatalError: String(err),
        };
        phaseResults.B_high_intensity_burst = failure;
        return failure;
      });
    await sleep(15000);
    const chaosPromise = runUiChaos()
      .then((v) => {
        phaseResults.E_smart_ui_chaos = v;
        return v;
      })
      .catch((err) => {
        const failure = {
          name: 'E_smart_ui_chaos',
          fatalError: String(err),
          uncaughtExceptions: [String(err)],
          consoleErrors: [],
          failedRequests: [],
        };
        phaseResults.E_smart_ui_chaos = failure;
        return failure;
      });
    await sleep(15000);
    const fuzzPromise = runFuzzBurst()
      .then((v) => {
        phaseResults.F_api_fuzz_burst = v;
        return v;
      })
      .catch((err) => {
        const failure = { name: 'F_api_fuzz_burst', fatalError: String(err) };
        phaseResults.F_api_fuzz_burst = failure;
        return failure;
      });
    await Promise.all([burstPromise, chaosPromise, fuzzPromise]);
    budgetCheck('after B/E/F');

    phaseResults.C_breakpoint_stress_escalation = await runBreakpoint();
    budgetCheck('after C');

    const writePromise = runWriteAttack().then((v) => {
      phaseResults.D_concurrency_attack_writes = v;
      return v;
    });
    const depPromise = runDependencyLatencySimulation().then((v) => {
      phaseResults.G_dependency_latency_simulation = v;
      return v;
    });
    await Promise.all([writePromise, depPromise]);
    budgetCheck('after D/G');

    detectIssues();
    writeFileSync(failuresFile, JSON.stringify(failureSamples, null, 2));
    writeFileSync(
      join(artifactsDir, 'phase-results.json'),
      JSON.stringify(phaseResults, null, 2)
    );
    writeFileSync(
      join(artifactsDir, 'issues.json'),
      JSON.stringify(issues, null, 2)
    );
    buildReport();
    log('stress harness completed');
  } catch (err) {
    appendFileSync(runnerLog, `\nFATAL: ${String(err)}\n`);
    throw err;
  } finally {
    await cleanup();
  }
}

await main();
