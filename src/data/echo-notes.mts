const ECHO_NOTES_BY_PATH: Record<string, string> = {
  '/': 'Start on the recruiter path first. This homepage is tuned to route each visitor into a page that teaches exactly one decision domain clearly.',
  '/hiring':
    'Use this page to assess senior backend depth through scope, tradeoffs, reliability, and delivery behavior instead of framework trivia.',
  '/hiring/evidence':
    'Run interviews from artifacts here: ask for context, decision logic, tradeoffs, and outcomes. Clear teach-back is the strongest signal.',
  '/hiring/pack':
    'This is the forwardable version for hiring loops. Keep it short: fit summary, top proof, and interview prompts that avoid low-signal screening.',
  '/build':
    'This page teaches execution discipline: scoped work blocks, explicit constraints, and delivery predictability under real product pressure.',
  '/vision':
    'Read this page for strategic reasoning: where to place bets, what to sequence next, and how to connect technical choices to business outcomes.',
  '/dev':
    'This page is for engineers: study determinism, reproducibility, and architecture choices that make systems easier to debug and evolve.',
  '/operating-system':
    'This page explains the website as a conversion system: visitor intent routing, signal filtering, and operational loops that compound quality.',
  '/linkedin':
    'Treat this as the distribution mirror. It teaches how to keep message parity across platforms without drifting into hype.',
  '/blog':
    'Use the blog index as a curriculum: each post should teach a decision pattern, not just list tools or repeat generic best practices.',
  '/test/workflow-badge':
    'This page documents release-safety instrumentation. It teaches how visibility and fast status checks reduce operational uncertainty.',
};

const BLOG_POST_NOTE =
  'This post page is part of the teaching loop: extract one reusable decision pattern, one tradeoff, and one failure mode to watch in production.';

const DEFAULT_ECHO_NOTE =
  'This page is part of an AI-assisted teaching system. If a concept cannot be explained clearly with constraints and tradeoffs, it needs more work.';

export function resolveEchoNote(pathname: string) {
  if (pathname.startsWith('/blog/')) {
    return BLOG_POST_NOTE;
  }
  return ECHO_NOTES_BY_PATH[pathname] ?? DEFAULT_ECHO_NOTE;
}
