# cv-site

Personal Astro site centered on a role-based entry experience.

## Stack

- Astro 5 + TypeScript
- Zod (data schema validation)
- Vitest (unit tests)
- Playwright (E2E tests)
- ESLint + Prettier

## Main Routes

- `/`: role selection entry (`Recruiter / Hiring Manager`, `Founder / Operator`, `Investor / Advisor`, `Developer / Builder`)
- `/hiring`: hiring-focused profile and CTA flow
- `/build`: founder/operator execution offer page
- `/vision`: investor/advisor strategy and milestone page
- `/dev`: developer/builder open source and methodology page
- `/blog`: blog index
- `/blog/[slug]`: blog posts
- `/linkedin`: LinkedIn copy-kit page
- `/test/workflow-badge`: workflow badge visual test page

## Navigation Reachability (From Homepage)

Verified internal journey from `/`:

1. `/` links to `/hiring`, `/build`, `/vision` via `src/components/DoorSelection.astro`.
2. Each role page links back to `/?choose=1` and across the three role pages via `src/components/ModeSwitch.astro`.
3. Share flow in `src/components/RoleClientEnhancements.astro` stays on the current role page and appends query params (`ref=peer_share`, `shared_role`).

Currently not linked from the homepage journey:

- `/blog` and `/blog/[slug]`
- `/linkedin`
- `/test/workflow-badge`

These routes are still built and present in sitemap output unless explicitly excluded.

## Current Architecture (Active)

- Active route/layout path:
  - `src/pages/index.astro`
  - `src/pages/hiring.astro`
  - `src/pages/build.astro`
  - `src/pages/vision.astro`
  - `src/layouts/SiteLayout.astro`
  - `src/components/DoorSelection.astro`
  - `src/components/ModeSwitch.astro`
  - `src/components/content/*.astro`
  - `src/components/RoleClientEnhancements.astro`
- Supporting libraries:
  - `src/lib/event-reporting.mts`
  - `src/lib/mailto-links.mts`
  - `src/lib/email-drafts.mts`
  - `src/lib/github-actions.mts`
  - `src/lib/github-status.mts`
  - `src/lib/build-version.mts`

## Legacy/Disconnected Pieces (Still in Repo)

- Legacy layout not used by current pages:
  - `src/layouts/Layout.astro`
- Legacy helper component only used by legacy layout:
  - `src/components/Controls.astro`
- Components with no active imports in current route stack:
  - `src/components/Header.astro`
  - `src/components/Section.astro`
  - `src/components/BlogCard.astro`
  - `src/components/BuildStatus.astro`
  - `src/components/ExperienceItem.astro`
  - `src/components/ExperienceTimelineItem.astro`

## Local Development

Prerequisites:

- Node.js 20+ (CI uses Node 20)
- npm

Install and run:

```bash
npm ci
npm run dev
```

Open `http://localhost:4321`.

## Scripts

- `npm run dev` / `npm start`: Astro dev server
- `npm run build`: production build to `dist/`
- `npm run preview`: preview built site
- `npm run lint`: ESLint
- `npm run lint:comments`: Zero Comment Policy audit
- `npm run format`: Prettier write
- `npm run test`: unit tests alias
- `npm run test:unit`: Vitest
- `npm run test:e2e`: Playwright (CI suite)

## Zero Comment Policy

This repository enforces a strict **Zero Comment Policy** for all production source files under `src/`.

### How it Works

- **Pre-commit Hook**: Every commit is automatically scanned (via Husky/Git Hooks). If any disallowed comments are found in `src/`, the commit is blocked (exit code 1).
- **Scanner**: A substring-based detection script looks for `//` and `/*` tokens. It is intentionally simple and avoids complex parsing.
- **Fail-Safe**: If the check cannot run reliably (e.g., Git errors), it fails closed and blocks the commit (exit code 2).

### Whitelist

The following patterns are permitted:

- `http://` and `https://`
- `/// <reference ...` (TypeScript reference tags)

### Violation Workflow

If a violation is detected:

1. **Move Documentation**: Transfer all reasoning, explanations, or context to `docs/ai-reasoning/inline-comment-attempts.md`.
2. **Cleanup**: Remove the comments from the source code.
3. **Retry**: Stage the changes and retry the commit.

### manual Audit

To check the entire codebase for comments:

```bash
npm run lint:comments
```

## Role-System Guardrails (Current UX)

- Keep exactly three role options on `/`.
- Keep each role page content isolated to its own route.
- Keep role switching reversible via the `ModeSwitch` UI.
- Preserve mobile-first interaction and layout behavior.

## Event Instrumentation

`src/lib/event-reporting.mts` installs `window.cvReportEvent` and `window.cvTrack`, which push to `window.dataLayer` when available.

`src/components/RoleClientEnhancements.astro` emits events including:

- `mode_selected`
- `mode_switched`
- `cta_clicked`
- `scroll_depth`
- `share_visit`
- `share_clicked`
- `share_completed`
- `peer_share_prompt_viewed`
- `peer_share_forwarded`

Attributes used by instrumentation:

- `data-role-door`
- `data-role-switch`
- `data-return-door`
- `data-cta`
- `data-cta-mode`
- `data-role-share`
- `data-peer-share-prompt`
- `data-peer-share-forward`
- `data-progressive`

## Email CTA Model

- CTA copy and draft templates live in `src/lib/email-drafts.mts`.
- Emails use tagged aliases for intent tracking (for example `+www-build`, `+www-vision-invest`).
- Click handling is obfuscated and hydrated client-side through `src/lib/mailto-links.mts` using `data-mailto-link` attributes.

## GitHub Build Status Badge

- Footer badge component: `src/components/LiveBuildBadge.astro`
- Fetches GitHub Actions runs from `bitkojine/cv-site` and resolves status via `src/lib/github-status.mts`
- Falls back to workflow URL if API calls fail during build

## CI and Deploy

- CI workflow: `.github/workflows/ci.yml`
  - lint, prettier check, unit tests, build, Playwright tests
- Deploy workflow: `.github/workflows/deploy.yml`
  - builds `dist/` and deploys to GitHub Pages on `main` pushes or manual dispatch
- SSL monitor workflow: `.github/workflows/ssl-monitor.yml`
  - runs daily and opens/updates a GitHub issue if origin certificate expiry risk is detected
- Availability monitor workflow: `.github/workflows/site-availability-monitor.yml`
  - runs every 15 minutes and alerts on request failures, HTTP 5xx, and Cloudflare `526`

## Alerting

Alerts are sent to:

- GitHub Issues (created/updated by monitor workflows)
- GitHub Actions run failures
- Email (if SMTP secrets are configured)

Email secrets to configure in repository settings:

- `ALERT_SMTP_SERVER` (for example `smtp.gmail.com`)
- `ALERT_SMTP_PORT` (optional, default `587`)
- `ALERT_SMTP_USERNAME`
- `ALERT_SMTP_PASSWORD`
- `ALERT_EMAIL_FROM`
- `ALERT_EMAIL_TO`

Site config is in `astro.config.mts` with:

- `site: https://robertasrudys.com`
- sitemap integration enabled

## Content and Data

- CV/profile source data: `src/data/cv.json`
- Data schema: `src/data/schema.mts`
- Blog content collection:
  - config: `src/content/config.ts`
  - posts: `src/content/blog/*.md`

## Testing

- Unit tests: `tests/unit`
- E2E tests: `tests/e2e`
- Workflow badge test route fixture: `src/pages/test/workflow-badge.astro`
