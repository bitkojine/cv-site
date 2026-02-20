import { describe, expect, it } from 'vitest';
import {
  ECHO_BLOG_POST_NOTES,
  getEchoSignalMetrics,
  resolveEchoNote,
} from '../../src/data/echo-notes.mts';
import { readdirSync } from 'node:fs';
import { resolve } from 'node:path';

describe('echo notes', () => {
  it('resolves route-specific notes with prompts', () => {
    const hiring = resolveEchoNote('/hiring');
    expect(hiring.id).toBe('hiring');
    expect(hiring.actionPrompts.length).toBeGreaterThanOrEqual(3);
    expect(hiring.modes?.length).toBe(2);
  });

  it('resolves blog post note with loop checklist', () => {
    const blogPost = resolveEchoNote('/blog/building-with-ai');
    expect(blogPost.id).toBe('blog-post-building-with-ai');
    expect(blogPost.checklist?.length).toBe(3);
  });

  it('defines explicit Echo notes for all published blog posts', () => {
    const blogDir = resolve(__dirname, '../../src/content/blog');
    const blogSlugs = readdirSync(blogDir)
      .filter((name) => name.endsWith('.md'))
      .map((name) => `/blog/${name.replace(/\.md$/, '')}`);
    const mappedSlugs = Object.keys(ECHO_BLOG_POST_NOTES).sort((a, b) =>
      a.localeCompare(b)
    );

    expect(mappedSlugs).toEqual(blogSlugs.sort((a, b) => a.localeCompare(b)));
    blogSlugs.forEach((slug) => {
      const note = resolveEchoNote(slug);
      expect(note.id).not.toBe('blog-post-generic');
    });
  });

  it('uses a strict fallback for unmapped routes', () => {
    const fallback = resolveEchoNote('/missing-route');
    expect(fallback.id).toBe('fallback');
    expect(fallback.variants.full).toContain(
      'lacks a defined teaching objective'
    );
  });

  it('computes internal signal metrics', () => {
    const metrics = getEchoSignalMetrics();
    expect(metrics.noteCount).toBeGreaterThan(10);
    expect(metrics.averageWordsPerVariant).toBeGreaterThan(4);
    expect(metrics.questionCount).toBeGreaterThan(20);
    expect(metrics.decisionVocabularyCount).toBeGreaterThan(10);
  });
});
