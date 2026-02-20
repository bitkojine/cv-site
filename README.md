# cv-site

[![CI](https://github.com/bitkojine/cv-site/actions/workflows/ci.yml/badge.svg)](https://github.com/bitkojine/cv-site/actions/workflows/ci.yml)
[![E2E](https://github.com/bitkojine/cv-site/actions/workflows/e2e.yml/badge.svg)](https://github.com/bitkojine/cv-site/actions/workflows/e2e.yml)
[![Deploy](https://github.com/bitkojine/cv-site/actions/workflows/deploy.yml/badge.svg)](https://github.com/bitkojine/cv-site/actions/workflows/deploy.yml)

Static Astro site for [robertasrudys.com](https://robertasrudys.com), deployed on GitHub Pages behind Cloudflare.

## Live Site

- Primary: [https://robertasrudys.com](https://robertasrudys.com)
- GitHub Pages origin: [https://bitkojine.github.io/cv-site/](https://bitkojine.github.io/cv-site/)

## Highlights

- Astro 5 + TypeScript static site with role-based landing flow
- Strict local and CI quality gates (lint, format, tests, build, workflow lint)
- Production monitors for availability, TLS health, and daily ops/security brief
- Audit tooling for Lighthouse and Sonar issue triage

## Tech Stack

- Astro 5, TypeScript, Zod
- Vitest + Playwright
- ESLint, Prettier, Stylelint, markdownlint, shellcheck, yamllint
- GitHub Actions (CI/CD + monitoring)
- GitHub Pages + Cloudflare

## Site Map

- `/`
- `/hiring`
- `/hiring/evidence`
- `/hiring/pack`
- `/cv`
- `/build`
- `/vision`
- `/dev`
- `/operating-system`
- `/system-map`
- `/library`
- `/linkedin`
- `/blog`
- `/blog/[slug]`
- `/test/workflow-badge` (test fixture)

## Quick Start

Requirements:

- Node.js 20+
- npm

Install and run:

```bash
npm ci
npm run dev
```

Local URL: `http://localhost:4321`

## Scripts

| Command                            | Purpose                                              |
| ---------------------------------- | ---------------------------------------------------- |
| `npm run dev`                      | Start local Astro dev server                         |
| `npm run start`                    | Alias for `npm run dev`                              |
| `npm run build`                    | Build static output into `dist/`                     |
| `npm run preview`                  | Preview the built site                               |
| `npm run fetch-activity`           | Refresh cached GitHub activity data                  |
| `npm run lint`                     | Main lint gate (policy checks + Astro sync + ESLint) |
| `npm run lint:workflows`           | Lint GitHub workflows via `actionlint`               |
| `npm run lint:no-plus-years`       | Block relative year strings like `+X years`          |
| `npm run lint:no-javascript-files` | Enforce no `.js` source files policy                 |
| `npm run lint:md`                  | Markdown lint                                        |
| `npm run lint:css`                 | CSS lint                                             |
| `npm run lint:sh`                  | Shell script lint                                    |
| `npm run lint:yaml`                | Workflow YAML lint                                   |
| `npm run lint:json`                | JSON validation                                      |
| `npm run lint:extra`               | Run markdown/CSS/shell/YAML/JSON lint bundle         |
| `npm run lint:comments`            | Enforce zero-comment policy                          |
| `npm run format`                   | Format repo with Prettier                            |
| `npm run test`                     | Run unit tests (`test:unit`)                         |
| `npm run test:unit`                | Run Vitest                                           |
| `npm run test:e2e`                 | Run Playwright E2E suite                             |
| `npm run test:e2e:ci`              | E2E with fail-on-flaky enabled                       |
| `npm run test:e2e:ui-stress`       | Run UI stress Playwright spec only                   |
| `npm run audit:lighthouse`         | Lighthouse audit and artifact archive                |
| `npm run audit:lighthouse:ci`      | Lighthouse audit with `LIGHTHOUSE_MIN_SCORE=100`     |
| `npm run audit:sonar:issues`       | Pull open Sonar issues into audit artifacts          |
| `npm run audit:sonar:next`         | Print prioritized next Sonar fix batch               |

## Quality Gates

Local hooks (`.husky`):

- `pre-commit`: zero-comment policy, lint, workflow lint, format check, unit tests, build, E2E
- `pre-push`: dead-branch protection, branch sync protection, workflow lint

GitHub workflows (`.github/workflows`):

- `ci.yml`: lint, workflow lint, format check, unit tests, build, PR branch-sync check
- `e2e.yml`: Playwright E2E with fail-on-flaky
- `deploy.yml`: build + deploy to GitHub Pages
- `sonar.yml`: Sonar scan on push/PR/manual trigger

## Monitoring

Production monitors:

- `site-availability-monitor.yml` (every 15 minutes)
- `ssl-monitor.yml` (daily)
- `static-site-daily-brief.yml` (daily)

Alert channels:

- GitHub Actions failures
- GitHub Issues (automated monitor issues)
- Email (when SMTP secrets are configured)

SMTP secrets for monitor emails:

- `ALERT_SMTP_SERVER`
- `ALERT_SMTP_PORT` (optional, default `587`)
- `ALERT_SMTP_USERNAME`
- `ALERT_SMTP_PASSWORD`
- `ALERT_EMAIL_FROM`
- `ALERT_EMAIL_TO`

## Deployment and TLS

- Hosting: GitHub Pages (published `dist/`) behind Cloudflare.
- If Cloudflare mode is `Full (Strict)`, GitHub Pages origin cert must be valid.
- During origin cert provisioning windows, use `Full` and switch back to `Full (Strict)` once checks are healthy.

## Stress Testing

Run the burst harness in `stress/`:

```bash
BASE_URL=http://127.0.0.1:4321 ./stress/run_all.sh
```

Artifacts are written to `stress/artifacts/<timestamp>/`.

## Sonar Fix Loop

Required/optional environment variables:

- `SONAR_TOKEN` (required)
- `SONAR_PROJECT_KEY` (required)
- `SONAR_HOST_URL` (optional, defaults to `https://sonarcloud.io`)
- `SONAR_BRANCH` (optional)
- `SONAR_PULL_REQUEST` (optional)

Run:

```bash
npm run audit:sonar:issues
npm run audit:sonar:next
```

Artifacts are written to `audit/sonar/<timestamp>/` and linked by `audit/sonar/latest-run.txt`.

## Project Structure

- `src/pages/`: routes
- `src/components/`: UI components
- `src/layouts/`: page layouts
- `src/lib/`: runtime helpers
- `src/data/`: CV schema/data source
- `src/content/`: blog content
- `src/scripts/`: TypeScript utility scripts
- `tests/unit/`: unit tests
- `tests/e2e/`: Playwright suites
- `scripts/`: shell/automation scripts
- `stress/`: load and stress harness
- `.github/workflows/`: CI/CD and monitoring workflows

## Contributing

1. Branch from latest `main` using `codex/*`.
2. Run local checks before pushing.
3. Open a PR to `main`.
4. Merge only when required workflows are green.

## Notes

- Site URL and sitemap integration are configured in `astro.config.mts`.
