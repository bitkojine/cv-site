import { describe, expect, it } from 'vitest';
import {
  getEchoSignalMetrics,
  resolveEchoNote,
} from '../../src/data/echo-notes.mts';

describe('echo notes', () => {
  it('resolves route-specific notes with severity and prompts', () => {
    const hiring = resolveEchoNote('/hiring');
    expect(hiring.id).toBe('hiring');
    expect(hiring.severity).toBe('critical');
    expect(hiring.actionPrompts.length).toBeGreaterThanOrEqual(3);
    expect(hiring.modes?.length).toBe(2);
  });

  it('resolves blog post note with loop checklist', () => {
    const blogPost = resolveEchoNote('/blog/building-with-ai');
    expect(blogPost.id).toBe('blog-post');
    expect(blogPost.checklist?.length).toBe(3);
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
