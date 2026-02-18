import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const BLOG_DIR = path.join(process.cwd(), 'src/content/blog');

function getBlogPosts() {
  const files = fs.readdirSync(BLOG_DIR);
  return files
    .filter((file) => file.endsWith('.md') || file.endsWith('.mdx'))
    .map((file) => {
      const content = fs.readFileSync(path.join(BLOG_DIR, file), 'utf-8');
      const match = content.match(/title:\s*['"]?(.*?)['"]?$/m);
      return {
        file,
        title: match ? match[1] : '',
        draft: content.includes('draft: true'),
      };
    })
    .filter((post) => post.title && !post.draft);
}

test.describe('Blog Index', () => {
  test('should verify all published posts are visible', async ({ page }) => {
    const posts = getBlogPosts();
    console.log(`Found ${posts.length} published posts to verify.`);

    await page.goto('/blog');

    for (const post of posts) {
      console.log(`Verifying post: "${post.title}" (${post.file})`);
      await expect(
        page.getByRole('heading', { name: post.title, exact: false }).first()
      ).toBeVisible();
    }
  });
});
