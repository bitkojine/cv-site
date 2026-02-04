---
title: 'How I Built This Website with AI'
date: 2026-02-04
description: 'From a simple HTML CV to a full Astro-powered site with dark mode, PDF export, and a blog — all built collaboratively with AI code assistants.'
tags: ['ai', 'astro', 'web-development', 'open-source']
draft: false
---

# How I Built This Website with AI

This entire website was built collaboratively with AI. Not generated and forgotten — actually _pair programmed_ with AI assistants through dozens of iterations. Here's the story told through my commit history.

## The Evolution

### Phase 1: The Simple HTML CV (December 2025)

It started as a basic HTML file synced from a private CV repository. The early commits tell the story:

```
8e3b533 Simplify to single CV - remove selector feature
768b045 Increase mobile button sizes for better touch targets
f6c13d0 Redesign control panel for better mobile-first UX
```

I had multiple CV variants (backend, fullstack, risk tech) but eventually simplified to one. Each iteration was me describing what I wanted, the AI suggesting code, and us iterating until it felt right.

### Phase 2: The Astro Migration (February 2026)

The big leap came when I decided to migrate from raw HTML to Astro:

```
5bb4e06 Migrate CV site to Astro with modern mobile-first design
de96899 Add GitHub Action for automated Astro deployment
ad59abb feat: upgrade CV website to production quality
```

This wasn't just copying code. The AI helped me:

- Structure the project with proper TypeScript
- Set up content collections for blog posts
- Implement a component-based architecture
- Configure GitHub Actions for deployment

### Phase 3: Production Polish

Then came the polish. Each commit represents a conversation:

```
288e65d fix(styles): improve dark mode color contrast for dates and links
79e503a feat: implement SEO improvements
5ff15de feat: add E2E tests and remove copy profile feature
e0e054b chore: upgrade to production quality with tests, linting, and mts refactor
```

The AI pushed me to add things I might have skipped:

- **Zod validation** for CV data
- **Playwright E2E tests** for critical paths
- **ESLint and Prettier** configuration
- **JSON-LD structured data** for SEO

### Phase 4: The Blog

Most recently, adding a self-hosted blog:

```
e4cd137 feat: add blog section with content collections
46e6806 feat: add blog post about LinkedIn blocking experience
```

After LinkedIn blocked my account, the AI helped me build a proper blogging platform in hours. Content collections, markdown rendering, tags — the whole thing.

## How AI Pair Programming Works

It's not about asking AI to "build me a website." That produces generic, soulless output.

Instead, it's a conversation:

1. **Me**: "The dark mode toggle causes a flash of light mode on page load"
2. **AI**: Suggests an inline script in `<head>` to check localStorage before render
3. **Me**: "That works but now there's a different flash..."
4. _Iterate together until solved_

Each feature went through this cycle. Some required 3 iterations. Some required 20.

## What I've Learned

**AI doesn't replace understanding.** I still need to know what I want. The AI is incredibly fast at _implementing_, but it needs clear direction.

**Git history is documentation.** Every commit message captures a decision. Looking back, I can see exactly how this site evolved — from mobile button sizing bugs to SEO improvements.

**Iteration is the process.** The first AI suggestion is rarely perfect. But the fifth? Usually solid. The tenth? Often better than I would have written myself.

**It's genuinely collaborative.** I chose the architecture. I picked the colors. I decided what ships. The AI handled the syntax, the edge cases, the boilerplate I would have copied from Stack Overflow anyway.

## The Code Is Open

Everything is on GitHub: [github.com/bitkojine/cv-site](https://github.com/bitkojine/cv-site)

You can see every commit. Every iteration. Every fix.

That's the real story — not a finished product, but a project that evolved through dozens of AI-assisted coding sessions.

---

_Want to try AI pair programming? Start small. Pick a bug or a simple feature. Describe what you want in plain English. See what comes back. Then iterate._
