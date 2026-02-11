import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = resolve(__dirname, '../..');

function readProjectFile(relativePath: string): string {
  return readFileSync(resolve(ROOT, relativePath), 'utf8');
}

describe('peer share viral loop', () => {
  it('renders a dedicated forward prompt component with expected hooks', () => {
    const source = readProjectFile('src/components/PeerSharePrompt.astro');

    expect(source).toContain('data-peer-share-prompt');
    expect(source).toContain('data-peer-share-forward');
    expect(source).toContain('data-peer-share-forward-label');
    expect(source).toContain('Forward profile');
  });

  it('injects the peer share prompt into all role content pages', () => {
    const hiring = readProjectFile(
      'src/components/content/HiringContent.astro'
    );
    const build = readProjectFile('src/components/content/BuildContent.astro');
    const vision = readProjectFile(
      'src/components/content/VisionContent.astro'
    );

    expect(hiring).toContain(
      "import PeerSharePrompt from '../PeerSharePrompt.astro';"
    );
    expect(build).toContain(
      "import PeerSharePrompt from '../PeerSharePrompt.astro';"
    );
    expect(vision).toContain(
      "import PeerSharePrompt from '../PeerSharePrompt.astro';"
    );

    expect(hiring).toContain(
      'message="Forward this profile to one teammate hiring for backend product engineering."'
    );
    expect(build).toContain(
      'message="Forward this profile to one founder or operator who needs hands-on execution support."'
    );
    expect(vision).toContain(
      'message="Forward this profile to one investor or advisor reviewing execution-focused builders."'
    );
  });

  it('tracks peer-share prompt view and forward completion events', () => {
    const source = readProjectFile(
      'src/components/RoleClientEnhancements.astro'
    );

    expect(source).toContain("if (ref !== 'peer_share')");
    expect(source).toContain("'peer_share_prompt_viewed'");
    expect(source).toContain("'peer_share_forwarded'");
    expect(source).toContain("source: 'peer_share_prompt'");
  });
});
