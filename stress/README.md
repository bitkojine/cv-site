# Stress Test Report

- Run timestamp: 2026-02-19T16:42:50.097Z
- Base URL: http://127.0.0.1:4321
- Total wall-clock: 40.5s
- Budget check (<= 300s): PASS

## Assumptions

- Direct DB/cache latency injection is unavailable for this static app; simulated dependency slowdown through a local delay proxy (+300-800ms per request).

## What Broke

- No critical breakage detected under this 5-minute burst suite.

## What Degraded First

- Most degraded phase: G dependency-latency (p95=794.87ms, errorRate=0)
- Breakpoint threshold not crossed in configured escalation.

## Reproduction Commands

- Full suite:

```bash
BASE_URL=http://127.0.0.1:4321 ./stress/run_all.sh
```

- Focus burst only:

```bash
BASE_URL=http://127.0.0.1:4321 BURST_VUS=180 node stress/run_all.mjs
```

## Evidence

- Latency and error summaries: `/Users/name/trusted-git/public-repos/cv-site/stress/artifacts/2026-02-19T16-42-09-598Z/*.json`
- Resource samples: `/Users/name/trusted-git/public-repos/cv-site/stress/artifacts/2026-02-19T16-42-09-598Z/resource-samples.jsonl`
- Failed payloads: `/Users/name/trusted-git/public-repos/cv-site/stress/artifacts/2026-02-19T16-42-09-598Z/failed-payloads.json`
- UI screenshots: `/Users/name/trusted-git/public-repos/cv-site/stress/artifacts/2026-02-19T16-42-09-598Z/screenshots`
- Runner log: `/Users/name/trusted-git/public-repos/cv-site/stress/artifacts/2026-02-19T16-42-09-598Z/runner.log`
