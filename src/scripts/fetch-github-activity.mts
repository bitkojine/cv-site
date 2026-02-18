import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const GITHUB_USERNAME = 'bitkojine';
const OUTPUT_DIR = join(process.cwd(), 'public');
const OUTPUT_FILE = join(OUTPUT_DIR, 'github-activity.json');

async function fetchActivity() {
  console.log(`Fetching GitHub activity for ${GITHUB_USERNAME}...`);

  const token = process.env.GITHUB_TOKEN;
  const headers: Record<string, string> = {
    'User-Agent': 'cv-site-builder',
  };

  if (token) {
    headers['Authorization'] = `token ${token}`;
    console.log('Using GITHUB_TOKEN for authentication.');
  } else {
    console.warn(
      'No GITHUB_TOKEN found. Proceeding unauthenticated (rate limits apply).'
    );
  }

  try {
    const response = await fetch(
      `https://api.github.com/users/${GITHUB_USERNAME}/events/public?per_page=15`,
      { headers }
    );

    if (!response.ok) {
      throw new Error(
        `GitHub API error: ${response.status} ${response.statusText}`
      );
    }

    const events = await response.json();

    if (!existsSync(OUTPUT_DIR)) {
      mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    writeFileSync(OUTPUT_FILE, JSON.stringify(events, null, 2));
    console.log(`Successfully saved activity to ${OUTPUT_FILE}`);
  } catch (error) {
    console.error('Failed to fetch GitHub activity:', error);
    if (!existsSync(OUTPUT_FILE)) {
      writeFileSync(OUTPUT_FILE, JSON.stringify([]));
    }
  }
}

fetchActivity();
