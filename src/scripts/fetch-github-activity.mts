import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const GITHUB_USERNAME = 'bitkojine';
const OUTPUT_DIR = join(process.cwd(), 'public');
const OUTPUT_FILE = join(OUTPUT_DIR, 'github-activity.json');
const CACHE_DIR = join(process.cwd(), '.cache');
const METADATA_FILE = join(CACHE_DIR, 'github-metadata.json');

async function fetchActivity() {
  console.log(`Checking GitHub activity for ${GITHUB_USERNAME}...`);

  const token = process.env.GITHUB_TOKEN;
  const headers: Record<string, string> = {
    'User-Agent': 'cv-site-builder',
  };

  if (token) {
    headers['Authorization'] = `token ${token}`;
  }

  let lastEtag = '';
  if (existsSync(METADATA_FILE)) {
    try {
      const metadata = JSON.parse(readFileSync(METADATA_FILE, 'utf-8'));
      lastEtag = metadata.etag || '';
      if (lastEtag) {
        headers['If-None-Match'] = lastEtag;
      }
    } catch {
      console.warn('Could not read activity cache metadata.');
    }
  }

  try {
    const response = await fetch(
      `https://api.github.com/users/${GITHUB_USERNAME}/events/public?per_page=15`,
      { headers }
    );

    if (response.status === 304) {
      console.log('Activity unchanged (304 Not Modified).');
      if (process.env.GITHUB_OUTPUT) {
        writeFileSync(process.env.GITHUB_OUTPUT, 'changed=false\n', {
          flag: 'a',
        });
      }
      process.exit(0);
    }

    if (!response.ok) {
      throw new Error(
        `GitHub API error: ${response.status} ${response.statusText}`
      );
    }

    const events = await response.json();
    const newEtag = response.headers.get('etag') || '';

    if (!existsSync(OUTPUT_DIR)) {
      mkdirSync(OUTPUT_DIR, { recursive: true });
    }
    if (!existsSync(CACHE_DIR)) {
      mkdirSync(CACHE_DIR, { recursive: true });
    }

    writeFileSync(OUTPUT_FILE, JSON.stringify(events, null, 2));
    writeFileSync(METADATA_FILE, JSON.stringify({ etag: newEtag }, null, 2));

    console.log(`Successfully updated activity. New ETag: ${newEtag}`);
    if (process.env.GITHUB_OUTPUT) {
      writeFileSync(process.env.GITHUB_OUTPUT, 'changed=true\n', { flag: 'a' });
    }
    process.exit(0);
  } catch (error) {
    console.error('Failed to fetch GitHub activity:', error);
    if (!existsSync(OUTPUT_FILE)) {
      writeFileSync(OUTPUT_FILE, JSON.stringify([]));
    }
    process.exit(0);
  }
}

fetchActivity();
