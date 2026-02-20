# Technical Debt Assessment Report

## Scope and method

Assessed repository: `bitkojine/cv-site` (Astro + TypeScript static site).

Checks performed:

- `npm ci`
- `npm run lint`
- `npm run test:unit`
- `npm run build`
- `npx tsc --noEmit`
- `npm run test:e2e:ci`

## Architecture map

### Folder structure

- `src/pages`: route entrypoints.
- `src/components`: Astro UI components + one large client behavior script component.
- `src/layouts`: `SiteLayout` + legacy/unused `Layout` and `BaseLayout`.
- `src/data`, `src/content`: JSON + schema/content models.
- `src/lib`: runtime helpers.
- `scripts`, `stress`: tooling and operational scripts.
- `.github/workflows`: CI/CD + monitoring.

### Build flow

1. `npm run build` creates static output in `dist/`.
2. Deploy workflow uploads `dist` to GitHub Pages.
3. Cloudflare fronts GitHub Pages origin.

### Test strategy

- Vitest unit tests in `tests/unit`.
- Playwright E2E tests in `tests/e2e`.
- Additional stress tooling outside main CI gates.

### CI/CD + monitoring flow

- `ci.yml`: lint, workflow lint, format check, unit tests, build.
- `e2e.yml`: Playwright suite.
- `deploy.yml`: build and deploy.
- `site-availability-monitor.yml`: 15-minute availability checks.
- `ssl-monitor.yml`: daily cert checks.
- `static-site-daily-brief.yml`: daily operational/security brief.

## Automated signal review

- ✅ `npm run lint` passed.
- ✅ `npm run test:unit` passed.
- ✅ `npm run build` passed.
- ❌ `npx tsc --noEmit` failed immediately (exit code 2) during full-project compile.
  - First error appears in `eslint.config.mts` (`TS7016`: missing declaration file for `eslint-plugin-jsx-a11y`).
  - Error concentration by file from this run: `stress/run_all.mts` (77), `scripts/lighthouse-audit.mts` (21), `src/lib/mailto-links.mts` (4), `tests/unit/mailto-links.test.mts` (3), plus single-file errors in `vitest.config.mts`, `src/lib/ui-feedback.mts`, `src/content/config.ts`, and `eslint.config.mts`.
  - Dominant error families: implicit `any` (`TS7006`/`TS7031`/`TS7034`), invalid property/index access (`TS2339`/`TS7053`), incompatible DOM utility types (`TS2345`/`TS2559`/`TS2741`), and config typing mismatch (`TS2353`).
- ❌ `npm run test:e2e:ci` failed locally due missing Playwright browser binaries.

## Executive summary (top priorities)

1. TD-001: TypeScript strictness is declared but not enforceable in CI.
2. TD-002: Deploy path uses `npm install`, creating non-deterministic builds.
3. TD-003: Local and CI E2E setup differs; hooks can fail on fresh machines.
4. TD-004: Availability monitor may create noisy incident issue comments.
5. TD-005: Monitoring logic duplicated across multiple large workflows.
6. TD-006: CSP uses broad `'unsafe-inline'` allowances.
7. TD-007: Dead source files (unused layouts/components) increase cognitive load.
8. TD-008: Role labels/routes duplicated across pages/components/libs.
9. TD-009: `RoleClientEnhancements` is a large mixed-responsibility script.
10. TD-010: Some unit tests validate file text, not runtime behavior.

## Full backlog by category

### Type Safety

#### TD-001 — TypeScript strict mode is not enforceable in practice

- **Severity:** High.
- **Confidence:** High.
- **Evidence:**
  - `tsconfig.json` uses `strict: true`, `allowJs: true`, and broad include (`"**/*`).
  - `.github/workflows/ci.yml` does not run `tsc`.
  - `npx tsc --noEmit` fails before completion (exit 2) as soon as typecheck reaches repo-wide includes.
  - Failure starts at config-layer typing (`eslint.config.mts`: missing `eslint-plugin-jsx-a11y` declaration), then cascades into tooling scripts and shared libs because `tsconfig.json` includes `**/*`.
  - Highest-volume failures are concentrated in non-runtime tooling scripts: `stress/run_all.mts` (77 errors, mostly implicit `any`/indexing/`never` misuse) and `scripts/lighthouse-audit.mts` (21 errors, largely implicit `any` and report-shape drift).
  - Additional structural type errors appear in app-adjacent code (`src/lib/mailto-links.mts`, `src/lib/ui-feedback.mts`) where custom document abstractions do not satisfy DOM interfaces.
- **Cost of inaction:** Hidden type regressions can ship unnoticed.
- **Suggested fix:**
  1. Add `npm run typecheck`.
  2. Add typecheck step in CI.
  3. Split app/tool tsconfigs and fix errors incrementally.
- **Effort:** Large.
- **Risk:** Medium.
- **Owner:** Frontend + DevEx.

### CI/CD

#### TD-002 — Deploy workflow dependency install is non-deterministic

- **Severity:** High.
- **Confidence:** High.
- **Evidence:** `deploy.yml` uses `npm install`, while other workflows use `npm ci`.
- **Cost of inaction:** Deploy may run with different dependency resolution than tested CI.
- **Suggested fix:** Replace deploy install with `npm ci` and keep lockfile-first path.
- **Effort:** Small.
- **Risk:** Low.
- **Owner:** Platform.

#### TD-003 — E2E setup mismatch between local hooks and CI

- **Severity:** High.
- **Confidence:** High.
- **Evidence:**
  - `.husky/pre-commit` always runs E2E.
  - CI installs browser (`e2e.yml`), but local scripts do not.
  - Local `npm run test:e2e:ci` failed with missing browser executable.
- **Cost of inaction:** Onboarding friction and hook bypass risk.
- **Suggested fix:**
  1. Add explicit local Playwright setup command.
  2. Make hook behavior browser-aware or move E2E to pre-push/CI.
  3. Document prerequisites clearly.
- **Effort:** Small.
- **Risk:** Low.
- **Owner:** DevEx.

### Ops/Monitoring

#### TD-004 — Alert issue comment noise risk in 15-minute monitor

- **Severity:** Medium.
- **Confidence:** High.
- **Evidence:** `site-availability-monitor.yml` runs every 15 minutes and comments on existing incident issue for each failing run.
- **Cost of inaction:** Alert fatigue and reduced incident signal quality.
- **Suggested fix:** Add cooldown/transition-based commenting and auto-close on recovery.
- **Effort:** Medium.
- **Risk:** Low.
- **Owner:** Platform/Ops.

#### TD-005 — Monitoring workflow logic duplication

- **Severity:** Medium.
- **Confidence:** High.
- **Evidence:** `ssl-monitor.yml` and `static-site-daily-brief.yml` duplicate cert classification, origin checks, and policy logic.
- **Cost of inaction:** Fixes must be repeated; drift risk grows.
- **Suggested fix:** Extract shared logic to `scripts/monitoring/*` and call from workflows.
- **Effort:** Medium.
- **Risk:** Medium.
- **Owner:** Platform.

### Security

#### TD-006 — CSP still allows broad inline execution

- **Severity:** Medium.
- **Confidence:** High.
- **Evidence:** `SiteLayout.astro` CSP contains `script-src 'self' 'unsafe-inline'` and `style-src 'self' 'unsafe-inline'`.
- **Cost of inaction:** Reduced XSS mitigation value.
- **Suggested fix:** externalize inline code and use nonce/hash CSP with edge headers.
- **Effort:** Medium.
- **Risk:** Medium.
- **Owner:** Frontend + Security.

#### TD-011 — Downloaded workflow binary lacks integrity verification

- **Severity:** Medium.
- **Confidence:** High.
- **Evidence:** `scripts/lint-workflows.sh` downloads and extracts `actionlint` without checksum validation.
- **Cost of inaction:** Supply-chain tampering risk.
- **Suggested fix:** Pin release checksum and verify before extract/execute.
- **Effort:** Small.
- **Risk:** Low.
- **Owner:** DevEx/Security.

### Architecture / Maintainability

#### TD-007 — Unused layouts/components remain in active tree

- **Severity:** Medium.
- **Confidence:** High.
- **Evidence:** No page imports `src/layouts/Layout.astro`, `src/layouts/BaseLayout.astro`, or `src/components/BuildStatus.astro`.
- **Cost of inaction:** Cognitive overhead and stale-code drift.
- **Suggested fix:** Remove/archive unused files and add an unused-code check.
- **Effort:** Small.
- **Risk:** Low.
- **Owner:** Frontend.

#### TD-008 — Role metadata is duplicated across layers

- **Severity:** Medium.
- **Confidence:** High.
- **Evidence:** Repeated role/path strings in `RoleClientEnhancements`, `ModeSwitch`, `DoorSelection`, `index.astro`, and `email-drafts.mts`.
- **Cost of inaction:** Multi-file synchronized edits and hidden coupling.
- **Suggested fix:** Introduce central role registry module used everywhere.
- **Effort:** Medium.
- **Risk:** Low.
- **Owner:** Frontend.

#### TD-009 — `RoleClientEnhancements` is a monolith

- **Severity:** Medium.
- **Confidence:** High.
- **Evidence:** Single script handles analytics, sharing, prompt UX, progressive reveal, scroll depth, and reading progress; includes multiple silent catches.
- **Cost of inaction:** Regression risk and low testability.
- **Suggested fix:** Split into typed modules and add focused tests.
- **Effort:** Medium.
- **Risk:** Medium.
- **Owner:** Frontend.

### Testing

#### TD-010 — Unit tests that assert source text provide weak confidence

- **Severity:** Medium.
- **Confidence:** High.
- **Evidence:** `layout-event-wiring.test.mts` and `peer-share-feature.test.mts` assert raw file content with `includes/toContain`.
- **Cost of inaction:** Runtime regressions can pass tests; refactors break tests without behavior change.
- **Suggested fix:** Replace with render/DOM behavior tests and keep only minimal contract smoke checks.
- **Effort:** Medium.
- **Risk:** Low.
- **Owner:** Frontend QA.

#### TD-012 — No coverage threshold governance for critical logic

- **Severity:** Low.
- **Confidence:** Medium.
- **Evidence:** `vitest.config.mts` has no coverage gate; critical client script lacks module-level coverage controls.
- **Cost of inaction:** Regressions in high-risk paths remain weakly signaled.
- **Suggested fix:** Add coverage collection and thresholds for critical modules.
- **Effort:** Medium.
- **Risk:** Low.
- **Owner:** Frontend QA + DevEx.

### Docs

#### TD-013 — Local setup assumptions are under-documented

- **Severity:** Low.
- **Confidence:** High.
- **Evidence:** README does not clearly call out Playwright browser installation for local E2E.
- **Cost of inaction:** Repeated onboarding friction.
- **Suggested fix:** Add prerequisite and troubleshooting section.
- **Effort:** Small.
- **Risk:** Low.
- **Owner:** DevEx.

## Quick wins

- TD-002: `npm ci` in deploy workflow.
- TD-003: explicit local Playwright setup and hook adjustment.
- TD-011: checksum verification for actionlint download.
- TD-007: remove/archive unused layout/component files.
- TD-001 (phase 1): add CI typecheck and resolve config-level errors.

## High-risk landmines

- Broken strict TypeScript contract without CI typecheck (TD-001).
- Monolithic client behavior script with silent failures (TD-009).
- CSP inline allowances reducing defense-in-depth (TD-006).

## Strategic refactors

1. Type-safety program: split tsconfigs + gradual error burn-down.
2. Central role domain model used by UI + analytics + email drafts.
3. Monitoring platformization: tested shared scripts invoked by workflows.
4. Client enhancement modularization with behavior-focused tests.
