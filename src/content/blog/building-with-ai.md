---
title: 'How I Built This Website with AI'
date: 2026-02-09
description: 'A commit-by-commit build log of this site: what changed, why it changed, and which files moved over time.'
tags: ['ai', 'astro', 'web-development', 'open-source']
draft: false
---

# How I Built This Website with AI

This write-up is now a real build log, not just a summary. It covers the full repository timeline and ties commits to concrete code changes.

## How To Read This

- The sections below explain the major phases and what code changed.
- The appendix lists every non-merge commit hash and message in chronological order.
- If you want full detail, open each commit diff in GitHub and compare files directly.

## Phase 1: Single-File CV Iteration (HTML)

The project started as one page:

- `de9f637` Initial commit: added `index.html` and `CNAME`.

Then a long series of content and UX iterations landed directly in `index.html` (CV syncs, layout adjustments, controls, copy flow, and print behavior). Most of these commits are the `Update CV from ...` entries plus targeted fixes like:

- `c4589bf` Add CV version toggle (`index.html`)
- `f6c13d0` Redesign control panel for mobile (`index.html`)
- `ab67a4e` / `38dca2c` / `ce0d42b` Orientation and text sizing fixes (`index.html`)
- `d90c315` through `da53cb9` LinkedIn copy UX refinement (`index.html`)

In this phase, AI was mostly used for rapid iteration loops: propose a small UI/code change, test it on mobile/print, and adjust.

## Phase 2: Astro Migration And Project Structure

The architecture shift happened at:

- `5bb4e06` Migrate CV site to Astro

Code moved from a single HTML file into structured app files:

- `src/pages/index.astro`
- `src/layouts/Layout.astro`
- `src/components/*`
- `src/data/cv.json`
- `src/styles/global.css`
- project config files like `astro.config.mjs`, `package.json`, `tsconfig.json`

Deployment and domain handling followed immediately:

- `de96899` GitHub Actions deploy workflow (`.github/workflows/deploy.yml`)
- `396d9e1` Move CNAME to `public/CNAME`
- `1688162` Base path/domain fix in `astro.config.mjs`

## Phase 3: Production Hardening (Quality, SEO, Tests)

Major commits in this phase:

- `ad59abb` production-quality upgrade
- `07ba630` print/PDF improvements
- `79e503a` SEO metadata + `robots.txt` + `og-image.png`
- `e0e054b` lint/test/tooling stack and `.mts` refactor
- `8af093f` split E2E workflow
- `5ff15de` add E2E tests and remove older copy-profile feature

Code focus was reliability and consistency across CI, print, mobile, and metadata.

## Phase 4: Live GitHub Data, Footer Telemetry, and Caching

This phase added live status visibility and then hardened data fetching:

- `b0b4d06` / `62d99bb` workflow statuses + latest commits in footer
- `25ac5d0` through `c15b77c` UX fixes for commit/status blocks
- `697aa08`, `49ac54f`, `67b0f59`, `d01e4e0`, `293dc1b` cache behavior and branch filtering
- `0cb1c03`, `4d22bd2`, `2de7394`, `cde30e8`, `2ec0ce8` workflow badge component quality and accessibility
- `3e4478b` temporary shift back to live API (cache removed)

Primary files touched:

- `src/pages/index.astro`
- `src/lib/github-cache.mts` / `src/lib/github-actions.mts` / `src/lib/github-status.mts`
- `src/components/WorkflowStatusBadge.astro`
- `tests/unit/*` and `tests/e2e/*`

## Phase 5: Blog, Content Collections, and Ongoing UX Refinement

Key commits:

- `e4cd137` add blog content collections and blog pages
- `46e6806`, `fc870e6`, `888be22`, `7554ba2` add/refine blog posts
- `9e05595`, `43ca811`, `fb3fe71`, `e82b877`, `c6f94ca`, `832d373` controls dock and layout refinement
- `86e2bf4` + follow-ups for timeline UI, mobile overflow, and print behavior
- `2d15cff` markdown-first redesign
- `9c40a80` refine redesign and restore build status

This is where the site shifted from "CV page" to "maintained product": reusable structure, better content surface, and stronger regression coverage.

## What The History Shows About AI Pair-Programming

The biggest pattern is not "AI wrote everything." The pattern is disciplined iteration:

- small scoped commits,
- explicit commit messages,
- quick verification loops,
- frequent follow-up fixes and reverts when needed.

That is the practical value: faster throughput without losing traceability.

## Latest Update: Redesign And Test Strategy Reset

The most recent iteration was a full markdown-first UI redesign and cleanup pass, followed by a temporary testing strategy change.

Key commits in this update window:

- `2d15cff` redesign the site to a markdown-first mobile-friendly layout
- `9c40a80` refine that redesign and restore build status
- `dce2494` expand this post into a complete commit-ledger narrative
- `4f43606` remove Playwright E2E workflows/tests while the new UI settles

Why remove E2E for now: after the redesign, the old browser assertions were tightly coupled to the previous interface and became noisy. Instead of carrying failing checks, the suite was intentionally retired so CI reflects real signal while unit tests and build checks stay active. The plan is to reintroduce E2E with selectors and flows designed for the new UI.

## Full Commit Ledger (Chronological)

Below is every non-merge commit hash and message from this repository timeline up to this update.

- `de9f637` Initial commit
- `5050317` Update CV from CV-Aligned.md - 2025-12-03 09:52:34
- `2ba6457` Update CV from private repo - 2025-12-03 07:53:28
- `c8d9a47` Update CV from CV-Aligned.md - 2025-12-03 09:57:47
- `8e25a22` Update CV from CV-Aligned.md - 2025-12-03 10:02:24
- `19330a0` Update CV from CV-Aligned.md - 2025-12-03 10:06:20
- `56ecabe` Update CV from CV-Aligned.md - 2025-12-03 10:09:41
- `65e2d73` Update CV from CV-Aligned.md - 2025-12-03 10:11:57
- `9f68079` Update CV from CV-Aligned.md - 2025-12-03 10:24:36
- `d3d1e54` Update CV from private repo - 2025-12-03 08:25:13
- `5c71cb6` Update CV from CV-Aligned.md - 2025-12-03 10:28:39
- `de405f7` Update CV from private repo - 2025-12-03 08:29:01
- `9598cbc` Update CV from private repo - 2025-12-03 16:58:26
- `9252999` Update CV from private repo - 2025-12-03 17:13:54
- `56696c1` Update CV from CV-Aligned.md - 2025-12-05 17:17:46
- `5c1c68a` Update CV from private repo - 2025-12-05 15:19:21
- `a72bb0f` Update CV from CV-Aligned.md - 2025-12-05 17:40:08
- `612aae6` Update CV from private repo - 2025-12-05 15:41:07
- `f2790eb` Update CV from CV-Aligned.md - 2025-12-08 12:44:15
- `9090be0` Update CV from private repo - 2025-12-08 10:45:14
- `805f4b4` Update CV from CV-Aligned.md - 2025-12-08 16:22:43
- `4496e88` Update CV from private repo - 2025-12-08 14:23:23
- `18b3d2b` Update CV from CV-Aligned.md - 2025-12-08 16:39:58
- `5512872` Update CV from private repo - 2025-12-08 14:40:29
- `c4589bf` Add CV version toggle - backend/fullstack/risktech variants
- `506ecc0` Update CV variants with improved content based on master CV
- `f6c13d0` Redesign control panel for better mobile-first UX
- `768b045` Increase mobile button sizes for better touch targets
- `1b85d27` Fix Risk Tech variant chronological order and content
- `8e3b533` Simplify to single CV - remove selector feature
- `dd408aa` Update CV from private repo - 2025-12-20 12:25:30
- `315bca3` 🚀 Add cool software engineering themed design
- `7a418be` Update CV from private repo - 2025-12-20 12:48:42
- `58d7b82` Update CV from private repo - 2025-12-20 12:53:17
- `b4bde9f` Update CV from private repo - 2025-12-20 13:01:56
- `b5a3ffc` Update CV from private repo - 2025-12-20 14:29:18
- `e5bbfdc` Update CV from private repo - 2025-12-20 14:33:37
- `60b8e9d` Update CV from private repo - 2025-12-20 14:38:29
- `697a202` Update CV from private repo - 2025-12-20 14:40:52
- `650a1b9` Update CV from private repo - 2025-12-20 14:49:02
- `ab67a4e` Fix mobile button font size bug on orientation change
- `38dca2c` Improve mobile orientation fix with explicit orientation queries
- `ce0d42b` Add JavaScript fix for mobile button sizing bug
- `432d0fd` Fix mobile text sizing and restore print top margin
- `a6c415d` Update CV from CV-Aligned.md - 2025-12-20 19:38:03
- `0dbde90` Update CV from private repo - 2025-12-20 17:40:26
- `adb19ea` Improve PROFILE and CORE SKILLS formatting for LinkedIn copy-paste
- `1be9bf7` Update CV from CV-Aligned.md - 2025-12-21 13:30:59
- `18ac6b4` Update CV from CV-Aligned.md - 2025-12-21 13:31:55
- `f411212` Update CV from private repo - 2025-12-21 11:32:11
- `d90c315` Add LinkedIn copy-to-clipboard feature with styled box
- `68e8f5a` Simplify copy button to icon only and remove duplicate content
- `a90f917` Update CV from CV-Aligned.md - 2025-12-21 13:42:09
- `f686b67` Re-add LinkedIn copy box to deployed site
- `32ced33` Remove duplicate content, keep only LinkedIn copy box
- `6934e5c` Remove LinkedIn code box; add inline copy button injected at heading; copy from DOM; ensure section prints normally
- `b4a6189` Update CV from CV-Aligned.md - 2025-12-21 13:53:02
- `00ac79b` Make copy button robust: anchor to parent heading, fallback search; section prints normally
- `2ed3259` Update CV from CV-Aligned.md - 2025-12-21 13:57:04
- `c514d58` Copy both PROFILE and CORE SKILLS; float copy button to top-right of heading
- `ce1a901` Update CV from CV-Aligned.md - 2025-12-21 14:01:52
- `f71a068` Include headings in copied text and add empty line between PROFILE and CORE SKILLS
- `044481e` Update CV from CV-Aligned.md - 2025-12-21 14:03:24
- `da53cb9` Do not copy emoji: strip copy button text from headings during copy
- `f446ca3` Update CV from CV-Aligned.md - 2025-12-21 14:06:59
- `5bb4e06` Migrate CV site to Astro with modern mobile-first design
- `de96899` Add GitHub Action for automated Astro deployment
- `396d9e1` Move CNAME to public directory for Astro build preservation
- `6cb5825` Trigger deployment after setting GitHub Actions as source
- `1688162` Explicitly set base path to root for custom domain resolution
- `ad59abb` feat: upgrade CV website to production quality
- `07ba630` feat: implement compact, print-friendly PDF layout for CV
- `d462c71` fix: resolve mobile buttons scrolling issue and background transparency
- `4285c3a` fix: refine Lithuanian timestamp format by removing space before d.
- `0c1c947` fix: add timezone name to Lithuanian timestamp
- `51cb3ba` feat(footer): add real-time GitHub Actions build status link
- `958a85d` feat(footer): add real-time GitHub Actions build status link
- `5b21996` refactor: convert astro config to typescript
- `53a9135` content(cv): refine job descriptions and remove fluff
- `79e503a` feat: implement SEO improvements
- `288e65d` fix(styles): improve dark mode color contrast for dates and links
- `e0e054b` chore: upgrade to production quality with tests, linting, and mts refactor
- `8af093f` ci: split e2e tests into separate workflow
- `c715220` style: fix formatting to pass CI
- `5ff15de` feat: add E2E tests and remove copy profile feature
- `898462f` fix(test): remove usage of any type in interactions test
- `2b85a00` style: fix prettier formatting issues
- `b0b4d06` feat: show all github workflow statuses and latest commits in footer
- `62d99bb` feat: show all github workflow statuses and latest commits in footer
- `25ac5d0` fix: workflow status display on desktop, left-align commits, show 5 commits
- `6fd6365` fix: use consistent timestamp format for commit dates
- `f340160` fix: improve commits header and workflow button styling
- `06c6e58` fix: use h2 section header style for commits
- `ef355f1` fix: remove horizontal bar above commits
- `9f2b5c7` fix: clarify timestamp as CV/Resume last updated
- `311fcd0` feat: style headline as domain name with spaced .com suffix
- `c15b77c` fix: remove hr above profile, add fallback links for rate-limited API
- `e4cd137` feat: add blog section with content collections
- `46e6806` feat: add blog post about LinkedIn blocking experience
- `fc870e6` feat: ensure commit list left-alignment in footer and add AI-assisted development blog post
- `9e05595` Add global controls dock and standalone spacing
- `43ca811` Improve CV page performance and controls dock
- `fb3fe71` Stabilize controls dock in standalone mode
- `f145952` Fix lint issues
- `e82b877` Refine controls dock standalone offset
- `4e12199` Add endorsement flow with tracking and tests
- `748ed1d` Improve performance for static build
- `2a46c50` Cache GitHub API data in deploy workflow
- `0467c25` fix: improve mobile layout and prevent overflow
- `86e2bf4` Add horizontal experience timeline with year selector
- `257b707` Prevent horizontal page scroll on mobile
- `93f7edc` Harden mobile layout against horizontal overflow
- `c6366b2` Remove experience card hover effects
- `2a2937b` Tighten timeline spacing and add current role
- `a02aa62` Make timeline print as plain text
- `f78d9c8` Normalize timeline card widths
- `e75417a` Unify typography and improve text contrast
- `256f6e5` Remove italic styles
- `832d373` refine controls palette and layout
- `c00de6a` Use near-black palette and unicode status icon
- `f0cd858` Update controls dock tests for CV-only download
- `9ef0503` Fix timeline year chip styling and selection behavior
- `c6f94ca` Prevent controls dock layout jump and remove click transparency
- `888be22` refine blog posts and add bitcoin vs usd
- `fb70197` Keep name lockup on one line
- `7554ba2` Add blog posts on .NET, PostgreSQL, and ORMs
- `c20ae02` chore: format
- `697aa08` Fix GitHub cache refresh on 304
- `49ac54f` Improve GitHub cache tests and fix regression
- `67b0f59` Harden GitHub cache and document regressions
- `4cffbc0` Add live GitHub commits E2E check
- `0240d96` Add workflow badge coverage
- `f756869` Document GitHub E2E bug intent
- `690e4c3` Revalidate running workflows
- `d01e4e0` Filter workflow status to main branch
- `293dc1b` Add cache bypass for debugging
- `0cb1c03` Add workflow badge component tests
- `4d22bd2` Rebuild workflow status badges
- `2de7394` Revalidate running workflow badges on client
- `3e4478b` Remove GitHub cache and use live API
- `cde30e8` Improve workflow badge accessibility
- `6a5b9f9` Align workflow badge text
- `af4870c` Clean print/PDF view for CV
- `3c44adb` Add autoplay snake background
- `9948296` Refine snake autoplay and pages config
- `679f826` Remove CNAME for repo pages
- `6cca69d` Revert "Remove CNAME for repo pages"
- `6479890` Revert "Refine snake autoplay and pages config"
- `74cfeff` Restore autoplay snake background
- `0c3dc99` Revert "Restore autoplay snake background"
- `927420d` Revert "Add autoplay snake background"
- `f28186a` Simplify workflow badge refresh
- `f0441b2` Fix workflow badge pulse in dark mode
- `93f4816` Simplify timeline cards and add debug grid toggle
- `8232a6b` Prevent horizontal scroll on mobile
- `20e7bb9` Fix timeline year label overlap
- `769c030` Remove CV last updated timestamp
- `cf56414` Refine timeline year badge and badge spacing
- `afaa0a3` Add layout jitter stress test and stabilize sections
- `8ecb2d7` Split GitHub API E2E into integration workflow
- `40d97bf` Format Playwright tests
- `cb12cea` Align timeline year markers
- `8ee983a` Align timeline line with year markers
- `7855e12` Remove footer top padding
- `2a53842` feat: refine liquid glass buttons
- `2ec0ce8` Fix workflow badge label casing (#2)
- `2d15cff` Redesign site to markdown-first mobile-friendly layout
- `9c40a80` Refine markdown redesign and restore build status section
- `85cba28` Update 'How I Built This Website with AI' blog post
- `3cb8f39` Emphasize commit history in AI build post
- `dce2494` Expand AI build post with full commit ledger and code-change timeline
- `4f43606` Remove Playwright E2E suite and workflows
