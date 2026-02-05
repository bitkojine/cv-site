---
title: 'How I Built This Website with AI'
date: 2026-02-04
description: 'From a simple HTML CV to a full Astro site, built through real back‑and‑forth with AI assistants.'
tags: ['ai', 'astro', 'web-development', 'open-source']
draft: false
---

# How I Built This Website with AI

This site was not generated in one shot. It was built in small steps, the same way I build most things: a clear goal, a quick prototype, then a lot of iteration. The twist is that I had AI assistants pair‑programming with me the whole time.

## The First Draft

I started with a single HTML page that acted as my CV. It was plain, fast, and good enough for a week. Then real life happened: I wanted better mobile layout, a PDF export, and a place to post longer writing.

That is where the AI helped most. Not by replacing decisions, but by accelerating execution. I would describe the change I wanted, get a concrete suggestion, test it, and refine.

## The Move to Astro

The biggest architectural change was migrating the site to Astro. That gave me content collections for blog posts, cleaner components, and a structure I can scale without anxiety. The AI was useful here for the repetitive parts: configuration, wiring up build steps, and the little gotchas you forget until they break.

## The Polishing Pass

Polish matters. We spent time on dark‑mode contrast, SEO metadata, and accessibility. Those are easy to postpone, but the AI made it easier to do them sooner. When I felt stuck, I could describe the problem and get a focused fix without losing momentum.

## What I Learned

A few takeaways I keep coming back to:

- AI is best as a teammate, not a replacement.
- Clear intent beats clever prompts.
- Small iterations compound quickly.
- A clean git history is an underrated form of documentation.

## Open Source, Open Process

Everything is public on GitHub: [github.com/bitkojine/cv-site](https://github.com/bitkojine/cv-site). You can see the commit history and the decisions that shaped the site.

If you are curious about AI pair‑programming, start small. Pick a tiny bug or a boring refactor. Explain the goal clearly, test the result, and iterate. That loop is where the real value shows up.
