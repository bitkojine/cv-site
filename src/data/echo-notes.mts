export type EchoSeverity = 'informational' | 'critical' | 'diagnostic';

export interface EchoMode {
  id: string;
  label: string;
  summary: string;
  prompts: string[];
}

export interface EchoNote {
  id: string;
  severity: EchoSeverity;
  variants: {
    full: string;
    compressed: string;
    lens: string;
  };
  actionPrompts: string[];
  whyExists: string;
  focusSection: string;
  crossRoute?: {
    href: string;
    label: string;
  };
  checklist?: string[];
  modes?: EchoMode[];
  minimumWordCount?: number;
}

const ECHO_NOTES_BY_PATH: Record<string, EchoNote> = {
  '/': {
    id: 'home',
    severity: 'informational',
    variants: {
      full: 'Start with the recruiter path, then route intentionally. This homepage exists to direct each visitor to one page with one clear teaching objective.',
      compressed:
        'Route by objective, not curiosity. Pick the page that matches your decision domain.',
      lens: 'Treat this page as a traffic router.',
    },
    actionPrompts: [
      'Which visitor route best matches your decision goal?',
      'What should you learn from that route in under 2 minutes?',
    ],
    whyExists:
      'This system avoids generic browsing and forces intent-based navigation so each visitor reaches high-signal material faster.',
    focusSection: 'Recruiter Path',
    crossRoute: {
      href: '/hiring',
      label: 'Open /hiring for high-signal evaluation',
    },
    minimumWordCount: 120,
  },
  '/hiring': {
    id: 'hiring',
    severity: 'critical',
    variants: {
      full: 'Assess senior backend judgment through scope, tradeoffs, reliability, and delivery behavior. Tool trivia is explicitly low-signal here.',
      compressed: 'Assess scope + tradeoffs, not syntax.',
      lens: 'Look for decision quality.',
    },
    actionPrompts: [
      'What reliability tradeoff was chosen and why?',
      'What was deliberately not built in phase one?',
      'Which failure mode is explicitly owned?',
    ],
    modes: [
      {
        id: 'recruiter',
        label: 'Recruiter View',
        summary:
          'Use this view to evaluate seniority signal from evidence and conversation quality.',
        prompts: [
          'Can the candidate teach decisions with constraints, not just tools?',
          'Do they show ownership of failure paths and incident behavior?',
          'Can they defend what was postponed or rejected?',
        ],
      },
      {
        id: 'engineer',
        label: 'Engineer View',
        summary:
          'Use this view to prepare strong answers grounded in real delivery tradeoffs.',
        prompts: [
          'Bring one system story with constraints, options, and outcome.',
          'State one tradeoff you regret and what you changed after.',
          'Show how reliability decisions affected roadmap delivery.',
        ],
      },
    ],
    whyExists:
      'Hiring pages should reduce noise. This note enforces evidence-led evaluation so interviews target ownership-level thinking.',
    focusSection: '60-Second Fit Summary',
    crossRoute: {
      href: '/hiring/evidence',
      label: 'Go deeper in /hiring/evidence',
    },
    minimumWordCount: 260,
  },
  '/hiring/evidence': {
    id: 'hiring-evidence',
    severity: 'diagnostic',
    variants: {
      full: 'Run the interview from artifacts. Ask for context, option analysis, tradeoffs, and outcomes, then check how clearly the decision can be taught back.',
      compressed: 'Interview from artifacts, not memory.',
      lens: 'Test teachability under constraints.',
    },
    actionPrompts: [
      'Which option was rejected and why?',
      'What incident or failure changed the design afterward?',
      'What metric proved the decision worked?',
    ],
    whyExists:
      'Evidence libraries are only useful if they change interview behavior from trivia to decision analysis.',
    focusSection: 'Case Studies',
    crossRoute: {
      href: '/hiring/pack',
      label: 'Forward the concise /hiring/pack',
    },
    minimumWordCount: 420,
  },
  '/hiring/pack': {
    id: 'hiring-pack',
    severity: 'critical',
    variants: {
      full: 'This is the forwardable hiring artifact. Keep this loop concise, evidence-led, and decision-focused.',
      compressed: 'Forward signal, not noise.',
      lens: 'Concise proof beats verbose claims.',
    },
    actionPrompts: [
      'Can this pack be read in under 2 minutes?',
      'Does it direct interviewers to tradeoff discussion?',
      'Will forwarding this improve loop quality?',
    ],
    whyExists:
      'Hiring loops degrade when context gets re-explained manually. This artifact keeps evaluation signal consistent across interviewers.',
    focusSection: 'Top Evidence',
    crossRoute: {
      href: '/hiring/evidence',
      label: 'Review full artifacts on /hiring/evidence',
    },
    minimumWordCount: 220,
  },
  '/build': {
    id: 'build',
    severity: 'informational',
    variants: {
      full: 'Evaluate execution discipline here: scoped commitments, constraint design, and delivery cadence under real product pressure.',
      compressed: 'Measure execution cadence, not ambition.',
      lens: 'Constraint design predicts delivery.',
    },
    actionPrompts: [
      'What scope boundary prevents delivery drift?',
      'What blocker escalation rule keeps momentum?',
      'Which output is guaranteed per execution block?',
    ],
    whyExists:
      'Operator conversations should focus on throughput quality, not broad capability claims.',
    focusSection: 'Execution Model',
    crossRoute: {
      href: '/vision',
      label: 'Then read /vision for sequencing logic',
    },
    minimumWordCount: 220,
  },
  '/vision': {
    id: 'vision',
    severity: 'diagnostic',
    variants: {
      full: 'Use this page to evaluate sequencing logic: where to place bets, when to defer, and how technical choices shape capital allocation.',
      compressed: 'Sequence bets before scaling bets.',
      lens: 'Priority quality reveals strategic maturity.',
    },
    actionPrompts: [
      'What is the next irreversible decision?',
      'Which opportunity is intentionally delayed?',
      'How does this sequence reduce downside risk?',
    ],
    whyExists:
      'Strategic pages should teach portfolio thinking and sequencing discipline, not generic optimism.',
    focusSection: 'Roadmap Sequence',
    crossRoute: {
      href: '/build',
      label: 'See execution constraints on /build',
    },
    minimumWordCount: 200,
  },
  '/dev': {
    id: 'dev',
    severity: 'diagnostic',
    variants: {
      full: 'Treat this as an engineering precision page: determinism, replayability, and design choices that shrink debugging surface area.',
      compressed: 'Reduce ambiguity. Increase reproducibility.',
      lens: 'Debugging surface area is the metric.',
    },
    actionPrompts: [
      'Which side-effect boundaries are explicitly controlled?',
      'How is failure reproduced without guessing?',
      'What design choice reduced debugging time most?',
    ],
    whyExists:
      'Developer pages should show reasoning clarity through architecture and failure handling, not stack tourism.',
    focusSection: 'Engineering Methodology',
    crossRoute: {
      href: '/blog',
      label: 'Study applied patterns in /blog',
    },
    minimumWordCount: 240,
  },
  '/operating-system': {
    id: 'operating-system',
    severity: 'critical',
    variants: {
      full: 'Read this as a systems brief: visitor intent routing, signal filtering, and feedback loops that convert traffic into qualified outcomes.',
      compressed: 'Optimize system loops, not page vanity.',
      lens: 'Funnel quality is a systems property.',
    },
    actionPrompts: [
      'Where is signal lost in the current visitor flow?',
      'Which loop increases qualified conversations?',
      'What metric confirms conversion quality improved?',
    ],
    whyExists:
      'Meta pages must show operational mechanics, not branding narratives.',
    focusSection: 'Visitor Flow Stages',
    crossRoute: {
      href: '/hiring',
      label: 'Inspect the primary loop at /hiring',
    },
    minimumWordCount: 260,
  },
  '/linkedin': {
    id: 'linkedin',
    severity: 'informational',
    variants: {
      full: 'Use this as a distribution mirror. Keep wording parity with the primary site and avoid hype drift across platforms.',
      compressed: 'Mirror signal, do not rewrite signal.',
      lens: 'Consistency protects trust.',
    },
    actionPrompts: [
      'Is this wording aligned with the primary site?',
      'Did any platform edit reduce clarity?',
      'Would a recruiter see the same positioning in both places?',
    ],
    whyExists:
      'External channels should distribute signal, not mutate it into platform-shaped noise.',
    focusSection: 'Quick Sync Checklist',
    crossRoute: {
      href: '/',
      label: 'Return to the primary site objective map',
    },
    minimumWordCount: 180,
  },
  '/blog': {
    id: 'blog-index',
    severity: 'diagnostic',
    variants: {
      full: 'Treat the blog as a curriculum. Each post should teach a reusable decision pattern, not list tools.',
      compressed: 'Extract patterns, not preferences.',
      lens: 'One post, one reusable decision pattern.',
    },
    actionPrompts: [
      'Which post teaches the decision you need right now?',
      'Can you restate the pattern in your own system?',
      'What failure mode should you watch after adopting it?',
    ],
    whyExists:
      'Blog indexes should guide learning intent, not serve as passive archives.',
    focusSection: 'Engineering notes and building in public',
    minimumWordCount: 120,
  },
  '/test/workflow-badge': {
    id: 'workflow-test',
    severity: 'diagnostic',
    variants: {
      full: 'This test route validates release-safety visibility. Use it to check whether status signals remain readable and actionable.',
      compressed: 'Visibility failures become delivery failures.',
      lens: 'Status clarity drives response speed.',
    },
    actionPrompts: [
      'Can a failure state be recognized instantly?',
      'Is the status language unambiguous?',
      'Would this UI speed up incident triage?',
    ],
    whyExists:
      'Operational test pages exist to prevent blind spots before they reach production paths.',
    focusSection: 'Workflow Badge Test',
    minimumWordCount: 80,
  },
};

const BLOG_POST_NOTE: EchoNote = {
  id: 'blog-post',
  severity: 'diagnostic',
  variants: {
    full: 'Use this post to complete a full learning loop: extract the decision pattern, state the tradeoff, and name the failure mode to monitor.',
    compressed: 'Close the loop: pattern, tradeoff, failure mode.',
    lens: 'If you cannot teach it, you did not learn it.',
  },
  actionPrompts: [
    'What reusable decision pattern does this post teach?',
    'What tradeoff makes that pattern valid in context?',
    'Which failure mode becomes more likely if misapplied?',
  ],
  checklist: [
    'Decision pattern extracted',
    'Tradeoff stated',
    'Failure mode named',
  ],
  whyExists:
    'Posts should produce transferable decision quality, not passive consumption.',
  focusSection: 'Post body',
  minimumWordCount: 180,
};

const DEFAULT_ECHO_NOTE: EchoNote = {
  id: 'fallback',
  severity: 'critical',
  variants: {
    full: 'This route lacks a defined teaching objective. Define the decision pattern it teaches or remove the page.',
    compressed: 'No teaching objective detected.',
    lens: 'Undefined pages weaken the system.',
  },
  actionPrompts: [
    'What decision pattern should this route teach?',
    'Who is the intended learner for this route?',
    'Is this page adding signal or noise?',
  ],
  whyExists:
    'The system enforces explicit teaching objectives on every route to keep quality high.',
  focusSection: 'Primary content',
  minimumWordCount: 100,
};

export function resolveEchoNote(pathname: string): EchoNote {
  if (pathname.startsWith('/blog/')) {
    return BLOG_POST_NOTE;
  }
  return ECHO_NOTES_BY_PATH[pathname] ?? DEFAULT_ECHO_NOTE;
}

export function getEchoSignalMetrics() {
  const notes = [
    ...Object.values(ECHO_NOTES_BY_PATH),
    BLOG_POST_NOTE,
    DEFAULT_ECHO_NOTE,
  ];
  const decisionWords = ['tradeoff', 'constraint', 'failure', 'outcome'];
  const imperativeStarters = [
    'use',
    'treat',
    'run',
    'start',
    'assess',
    'read',
    'measure',
    'extract',
    'define',
  ];
  const variantTexts = notes.flatMap((note) => [
    note.variants.full,
    note.variants.compressed,
    note.variants.lens,
  ]);
  const totalWords = variantTexts.reduce((sum, text) => {
    return sum + text.split(/\s+/).filter(Boolean).length;
  }, 0);
  const imperativeCount = variantTexts.reduce((sum, text) => {
    const first = text.trim().split(/\s+/)[0]?.toLowerCase() ?? '';
    return sum + (imperativeStarters.includes(first) ? 1 : 0);
  }, 0);
  const questionCount = notes.reduce((sum, note) => {
    return (
      sum +
      note.actionPrompts.reduce((inner, prompt) => {
        return inner + (prompt.includes('?') ? 1 : 0);
      }, 0)
    );
  }, 0);
  const decisionVocabularyCount = variantTexts.reduce((sum, text) => {
    const lower = text.toLowerCase();
    const hits = decisionWords.reduce((wordSum, word) => {
      return wordSum + (lower.includes(word) ? 1 : 0);
    }, 0);
    return sum + hits;
  }, 0);

  return {
    noteCount: notes.length,
    averageWordsPerVariant: Number(
      (totalWords / variantTexts.length).toFixed(2)
    ),
    imperativeRatio: Number((imperativeCount / variantTexts.length).toFixed(2)),
    questionCount,
    decisionVocabularyCount,
  };
}
