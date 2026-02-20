# cv-site

Static Astro site for [robertasrudys.com](https://robertasrudys.com), deployed on GitHub Pages behind Cloudflare.

## Why This Repo Exists

- Serve a fast static personal site with role-based landing flows.
- Keep quality high with strict local hooks and CI gates.
- Monitor availability, TLS health, and daily site posture without a backend.

## Core Content Principle

- Proof comes from teachability: if I can teach a system or decision clearly, it is strong evidence of deep understanding.
- The site should keep moving toward this standard across hiring content: less trivia, more clear explanation of scope, tradeoffs, reliability, and delivery decisions.

## Live URLs

- Primary: [https://robertasrudys.com](https://robertasrudys.com)
- GitHub Pages origin: [https://bitkojine.github.io/cv-site/](https://bitkojine.github.io/cv-site/)

## Tech Stack

- Astro 5 + TypeScript
- Zod for runtime data validation (CV data, content schemas, and script inputs)
- Vitest for unit tests
- Playwright for E2E/UI stress tests
- ESLint + Prettier
- GitHub Actions for CI/CD + monitoring

## Site Routes

- `/` role selector
- `/hiring`
- `/build`
- `/vision`
- `/dev`
- `/operating-system`
- `/linkedin`
- `/blog`
- `/blog/[slug]`
- `/test/workflow-badge` (test fixture route)

## Quick Start

Requirements:

- Node.js 20+
- npm

Commands:

```bash
npm ci
npm run dev
```

Local site: `http://localhost:4321`

## Scripts

| Command                       | Purpose                                             |
| ----------------------------- | --------------------------------------------------- |
| `npm run dev`                 | Start dev server                                    |
| `npm run build`               | Build static output to `dist/`                      |
| `npm run preview`             | Preview built output                                |
| `npm run lint`                | ESLint                                              |
| `npm run lint:workflows`      | Lint GitHub workflows via `actionlint`              |
| `npm run lint:comments`       | Enforce zero-comment policy in `src/` and `tests/`  |
| `npm run test:unit`           | Run Vitest                                          |
| `npm run test:e2e`            | Run Playwright suite                                |
| `npm run test:e2e:ci`         | Run Playwright with `--fail-on-flaky-tests`         |
| `npm run audit:lighthouse`    | Run Lighthouse sweep + archive artifacts            |
| `npm run audit:lighthouse:ci` | Run Lighthouse with 100-score threshold enforcement |
| `npm run audit:sonar:issues`  | Fetch Sonar open issues and write audit artifacts   |
| `npm run audit:sonar:next`    | Print prioritized next issue batch to fix           |
| `npm run fetch-activity`      | Refresh cached GitHub activity data                 |

## Data Validation

- `src/data/cv.mts` validates `src/data/cv.json` at import-time using `CVSchema`.
- `src/content/config.ts` validates blog frontmatter via Astro content schema.
- `src/scripts/fetch-github-activity.mts` validates cache metadata and GitHub API JSON shape before writing outputs.

## Quality Gates

Local hooks (`.husky`):

- `pre-commit`: zero-comment policy, lint, workflow lint, format check, unit tests, build, E2E
- `pre-push`: dead-branch protection, branch-sync protection vs `origin/main`, workflow lint

CI workflows (`.github/workflows`):

- `ci.yml`: lint, workflow lint, format check, unit tests, build, and PR branch-sync enforcement
- `e2e.yml`: dedicated E2E workflow (fails on flaky tests)
- `lighthouse.yml`: dedicated Lighthouse workflow (100-threshold enforcement + artifact upload)
- `deploy.yml`: build + deploy to GitHub Pages

## Monitoring and Alerts

Production monitoring workflows:

- `site-availability-monitor.yml` (every 15 min)
  - Checks edge status and alerts on request failures / 5xx / Cloudflare 526
- `ssl-monitor.yml` (daily)
  - Checks edge cert and origin cert expiry state
- `static-site-daily-brief.yml` (daily)
  - Sends operations/security snapshot email

Alert channels:

- GitHub Actions failures
- GitHub Issues (automated alert issues)
- Email (if SMTP secrets are configured)

Required SMTP secrets for email alerts:

- `ALERT_SMTP_SERVER`
- `ALERT_SMTP_PORT` (optional, default `587`)
- `ALERT_SMTP_USERNAME`
- `ALERT_SMTP_PASSWORD`
- `ALERT_EMAIL_FROM`
- `ALERT_EMAIL_TO`

## Cloudflare + GitHub Pages TLS Notes

If Cloudflare is set to `Full (Strict)`, GitHub Pages origin cert validity must be healthy. If GitHub is still provisioning certs, strict mode can fail.

Current safe operational pattern:

- Use Cloudflare `Full` while GitHub Pages cert is provisioning or unstable.
- Switch to `Full (Strict)` when origin cert checks are healthy.
- Keep monitor enforcement flags aligned with current mode.

## Stress Testing

Burst stress harness is available under `stress/`:

```bash
BASE_URL=http://127.0.0.1:4321 ./stress/run_all.sh
```

Artifacts are written to `stress/artifacts/<timestamp>/`.

## Project Structure

- `src/pages/` routes
- `src/components/` UI components
- `src/layouts/` page layouts
- `src/lib/` client/runtime helpers
- `src/data/` schema + data source
- `tests/unit/` unit tests
- `tests/e2e/` Playwright suites
- `scripts/` repo automation and policy scripts
- `.github/workflows/` CI/CD and monitoring workflows
- `stress/` load/stability harness and artifacts

## Contributor Workflow

1. Create a fresh `codex/*` branch from latest `main`.
2. Run local checks before push.
3. Open PR to `main`.
4. Merge only when `CI` and `E2E` workflows are green.

Branch protections are intentionally strict to prevent stale branch pushes and branch drift.

## Troubleshooting

- CI skipped after merge:
  - Check `ci.yml` dependency/`if` logic for skipped prerequisite jobs.
- Workflow passes locally but fails in GitHub:
  - Run `npm run lint:workflows` locally (Linux-grade `actionlint` + shellcheck coverage).
  - Rebase onto latest `origin/main` and re-run checks.
- Cloudflare SSL issues:
  - Validate both edge and origin cert state in `ssl-monitor.yml` outputs.

## Sonar Fix Loop

Set environment variables:

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

Artifacts are written to `audit/sonar/<timestamp>/` with `latest-run.txt` pointing to the current run.

## Site Configuration

- Astro site URL is configured in `astro.config.mts`.
- Sitemap generation is enabled.
