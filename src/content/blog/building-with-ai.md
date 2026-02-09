---
title: 'How I Built This Website with AI'
date: 2026-02-09
description: 'An updated look at how this site evolved from a single HTML CV into an Astro project through practical AI pair-programming.'
tags: ['ai', 'astro', 'web-development', 'open-source']
draft: false
---

# How I Built This Website with AI

This site was not generated in one shot. It was built the same way I build most software: define the goal, ship a simple version, then iterate. The difference is that AI was in the loop the whole time as a pair-programmer, not an autopilot.

## Where It Started

The first version was a single HTML file for my CV. It was fast and easy to host, but limits showed up quickly:

- I wanted reusable components instead of repeating markup.
- I wanted a blog with metadata and tags.
- I wanted better mobile behavior without rewriting everything.

AI helped me move faster on implementation details, but product decisions still came from me.

## The Astro Migration

The biggest technical change was moving to Astro. That gave me:

- content collections for typed blog posts,
- clear component boundaries,
- and a project structure that can grow without turning messy.

AI was most useful during migration for repetitive wiring: route setup, content schema updates, and refactoring old markup into components.

## How I Actually Worked With AI

The workflow was simple and repeatable:

1. Define one concrete change.
2. Ask AI for an implementation path.
3. Apply the patch in small commits.
4. Run tests or preview locally.
5. Keep what works, revise what does not.

This mattered more than prompt tricks. Tight feedback loops beat giant one-shot prompts.

## What AI Was Good At

- Generating first drafts of components and styles.
- Refactoring repetitive code safely.
- Suggesting edge cases for accessibility and SEO.
- Speeding up docs, commit messages, and cleanup tasks.

## What Still Required Human Judgment

- Choosing architecture and tradeoffs.
- Deciding when to keep things simple.
- Reviewing quality and rejecting weak suggestions.
- Prioritizing polish versus shipping.

## What Changed Since The First Version

The project now has a cleaner blog pipeline, stronger metadata handling, and better structure for future posts and feature work. It feels less like a static page and more like a maintainable product.

## Lessons I Keep Reusing

- AI is best as a teammate, not a replacement.
- Clear intent beats clever prompting.
- Small iterations compound quickly.
- Good git hygiene makes AI collaboration easier to audit.

## Open Source, Open Process

Everything is public on GitHub: [github.com/bitkojine/cv-site](https://github.com/bitkojine/cv-site). You can see the commit history and the decisions that shaped the site.

If you are exploring AI pair-programming, start with a small change. Give clear context, verify every change locally, and iterate in short loops. That is where the practical value compounds.
