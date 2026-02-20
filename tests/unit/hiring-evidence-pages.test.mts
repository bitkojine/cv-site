import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = resolve(__dirname, '../..');

function readProjectFile(relativePath: string): string {
  return readFileSync(resolve(ROOT, relativePath), 'utf8');
}

describe('hiring evidence pages', () => {
  it('tracks evidence interactions in hiring and evidence pages', () => {
    const hiring = readProjectFile(
      'src/components/content/HiringContent.astro'
    );
    const library = readProjectFile('src/pages/library.astro');

    expect(hiring).toContain("'evidence_opened'");
    expect(library).toContain("'evidence_search'");
  });

  it('ships dedicated routes for evidence library and hiring pack', () => {
    const evidenceRedirect = readProjectFile('src/pages/hiring/evidence.astro');
    const library = readProjectFile('src/pages/library.astro');
    const pack = readProjectFile('src/pages/hiring/pack.astro');

    expect(evidenceRedirect).toContain("const target = '/library'");
    expect(library).toContain('canonicalPath="/library"');
    expect(pack).toContain('canonicalPath="/hiring/pack"');
    expect(pack).toContain('data-pack-print');
  });
});
