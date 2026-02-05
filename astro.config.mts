import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
const isGitHubPages = process.env.GITHUB_ACTIONS === 'true';

export default defineConfig({
  site: isGitHubPages ? 'https://bitkojine.github.io' : 'http://localhost:4321',
  base: isGitHubPages ? '/cv-site/' : '/',
  integrations: [sitemap()],
});
