import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = resolve(__dirname, '../..');

function readProjectFile(relativePath: string): string {
  return readFileSync(resolve(ROOT, relativePath), 'utf8');
}

function hasEventReporterInstall(source: string): boolean {
  return (
    source.includes('import { installGlobalEventReporter }') &&
    source.includes('installGlobalEventReporter(window);')
  );
}

describe('layout event wiring', () => {
  it('initializes the global event reporter in Layout.astro', () => {
    const source = readProjectFile('src/layouts/Layout.astro');
    expect(hasEventReporterInstall(source)).toBe(true);
  });

  it('initializes the global event reporter in SiteLayout.astro', () => {
    const source = readProjectFile('src/layouts/SiteLayout.astro');
    expect(hasEventReporterInstall(source)).toBe(true);
  });

  it('keeps event-emitting client enhancements attached to SiteLayout', () => {
    const source = readProjectFile('src/layouts/SiteLayout.astro');
    expect(source).toContain('<RoleClientEnhancements />');
  });
});
