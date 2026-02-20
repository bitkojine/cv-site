export interface EchoMode {
  id: string;
  label: string;
  summary: string;
  prompts: string[];
}

export interface EchoNote {
  id: string;
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
      href: '/library',
      label: 'Go deeper in /library',
    },
    minimumWordCount: 260,
  },
  '/library': {
    id: 'engineering-learning-library',
    variants: {
      full: 'Use this library to learn practical backend patterns from real decisions, tradeoffs, and outcomes.',
      compressed: 'Learn from real decisions and tradeoffs.',
      lens: 'Focus on reusable engineering patterns.',
    },
    actionPrompts: [
      'Pick one artifact and explain the decision in your own words.',
      'Identify one tradeoff and one alternative option.',
      'Extract one pattern you can apply to your own system.',
    ],
    whyExists:
      'This page is a learning resource first: practical examples you can reuse in your own backend work.',
    focusSection: 'Case Studies',
    crossRoute: {
      href: '/hiring/pack',
      label: 'Forward the concise /hiring/pack',
    },
    minimumWordCount: 420,
  },
  '/hiring/pack': {
    id: 'hiring-pack',
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
      href: '/library',
      label: 'Review full artifacts on /library',
    },
    minimumWordCount: 220,
  },
  '/build': {
    id: 'build',
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
    variants: {
      full: 'Read this as the top-level system view: visitor intent routing, page links, word counts, and feedback loops that convert traffic into qualified outcomes.',
      compressed: 'Optimize system loops, not page vanity.',
      lens: 'Funnel quality is a systems property.',
    },
    actionPrompts: [
      'Where is signal lost in the current visitor flow?',
      'Which loop increases qualified conversations?',
      'What metric confirms conversion quality improved?',
      'Does every route have clear reachability and bounded content length?',
    ],
    whyExists:
      'Meta pages must show operational mechanics, not branding narratives.',
    focusSection: 'Admin Top View',
    crossRoute: {
      href: '/hiring',
      label: 'Inspect the primary loop at /hiring',
    },
    minimumWordCount: 260,
  },
  '/linkedin': {
    id: 'linkedin',
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

export const ECHO_BLOG_POST_NOTES: Record<string, EchoNote> = {
  '/blog/bitcoin-vs-usd': {
    id: 'blog-post-bitcoin-vs-usd',
    variants: {
      full: 'Use this post to evaluate monetary-risk reasoning: compare custody, inflation exposure, and failure boundaries rather than brand narratives.',
      compressed: 'Compare risk models, not slogans.',
      lens: 'Economic tradeoffs must be explicit.',
    },
    actionPrompts: [
      'Which risk is reduced and which risk is introduced?',
      'What assumptions make this comparison valid?',
      'Which failure mode would invalidate the conclusion?',
    ],
    checklist: [
      'Decision pattern extracted',
      'Tradeoff stated',
      'Failure mode named',
    ],
    whyExists:
      'Financial-opinion content should teach explicit reasoning structure, not just position statements.',
    focusSection: 'Post body',
    minimumWordCount: 180,
  },
  '/blog/building-with-ai': {
    id: 'blog-post-building-with-ai',
    variants: {
      full: 'Use this post to study AI-assisted delivery loops: prompt quality, guardrails, and verification discipline under speed pressure.',
      compressed: 'Speed without guardrails is debt.',
      lens: 'AI output quality is process quality.',
    },
    actionPrompts: [
      'Which guardrail prevented low-quality automation?',
      'What review step preserved correctness?',
      'Where does human judgment remain non-negotiable?',
    ],
    checklist: [
      'Decision pattern extracted',
      'Tradeoff stated',
      'Failure mode named',
    ],
    whyExists:
      'AI workflow posts should teach repeatable execution patterns, not novelty demos.',
    focusSection: 'Post body',
    minimumWordCount: 180,
  },
  '/blog/choosing-orms': {
    id: 'blog-post-choosing-orms',
    variants: {
      full: 'Use this post to evaluate abstraction boundaries: where ORM speed helps and where direct query control protects reliability.',
      compressed: 'Pick abstraction per risk profile.',
      lens: 'Abstraction choices are operational choices.',
    },
    actionPrompts: [
      'Where does abstraction hide critical performance risk?',
      'Which boundary needs direct query visibility?',
      'What tradeoff justified the final data-access approach?',
    ],
    checklist: [
      'Decision pattern extracted',
      'Tradeoff stated',
      'Failure mode named',
    ],
    whyExists:
      'Tool-choice content should map decisions to runtime behavior and failure cost.',
    focusSection: 'Post body',
    minimumWordCount: 180,
  },
  '/blog/latest-dotnet-features': {
    id: 'blog-post-latest-dotnet-features',
    variants: {
      full: 'Use this post to separate novelty from adoption value: assess which runtime features improve delivery, reliability, or maintainability now.',
      compressed: 'Adopt by impact, not release hype.',
      lens: 'Feature value depends on constraints.',
    },
    actionPrompts: [
      'Which feature changes production behavior materially?',
      'What migration risk accompanies adoption?',
      'What should remain untouched in this cycle?',
    ],
    checklist: [
      'Decision pattern extracted',
      'Tradeoff stated',
      'Failure mode named',
    ],
    whyExists:
      'Release-summary posts should teach prioritization logic, not feature cataloging.',
    focusSection: 'Post body',
    minimumWordCount: 180,
  },
  '/blog/latest-postgresql-features': {
    id: 'blog-post-latest-postgresql-features',
    variants: {
      full: 'Use this post to evaluate database feature adoption through migration safety, observability impact, and rollback practicality.',
      compressed: 'Database change is risk management.',
      lens: 'Adoption requires rollback discipline.',
    },
    actionPrompts: [
      'Which feature justifies migration effort?',
      'How is rollback handled if behavior regresses?',
      'What metric confirms the change is worth it?',
    ],
    checklist: [
      'Decision pattern extracted',
      'Tradeoff stated',
      'Failure mode named',
    ],
    whyExists:
      'Database posts should teach safe-change strategy, not just announce capabilities.',
    focusSection: 'Post body',
    minimumWordCount: 180,
  },
  '/blog/stopping-the-zombie-attack': {
    id: 'blog-post-stopping-the-zombie-attack',
    variants: {
      full: 'Use this post to analyze branch protection as system control: prevent stale flow, enforce freshness, and reduce merge debt.',
      compressed: 'Process controls protect code quality.',
      lens: 'Workflow design shapes delivery safety.',
    },
    actionPrompts: [
      'Which control removed the highest-risk workflow failure?',
      'What developer friction was intentionally accepted?',
      'How is policy effectiveness measured over time?',
    ],
    checklist: [
      'Decision pattern extracted',
      'Tradeoff stated',
      'Failure mode named',
    ],
    whyExists:
      'Process posts should teach enforceable controls, not optional conventions.',
    focusSection: 'Post body',
    minimumWordCount: 180,
  },
  '/blog/welcome': {
    id: 'blog-post-welcome',
    variants: {
      full: 'Use this post to understand the learning contract: every entry should teach a reusable decision pattern with explicit constraints.',
      compressed: 'Set the learning standard early.',
      lens: 'Clarity of intent drives content quality.',
    },
    actionPrompts: [
      'What kind of decision patterns will this blog prioritize?',
      'Which low-signal content patterns are explicitly rejected?',
      'How will future posts prove practical usefulness?',
    ],
    checklist: [
      'Decision pattern extracted',
      'Tradeoff stated',
      'Failure mode named',
    ],
    whyExists:
      'Introductory posts should establish standards that future content can be audited against.',
    focusSection: 'Post body',
    minimumWordCount: 150,
  },
  '/blog/why-i-left-linkedin': {
    id: 'blog-post-why-i-left-linkedin',
    variants: {
      full: 'Use this post to study channel strategy tradeoffs: control vs reach, signal quality vs platform convenience, and long-term compounding.',
      compressed: 'Own the channel, own the signal.',
      lens: 'Distribution strategy is a product decision.',
    },
    actionPrompts: [
      'Which channel constraint became unacceptable?',
      'What was gained and lost by moving platforms?',
      'How does this decision improve long-term signal quality?',
    ],
    checklist: [
      'Decision pattern extracted',
      'Tradeoff stated',
      'Failure mode named',
    ],
    whyExists:
      'Career-channel posts should teach strategic distribution thinking, not personal branding theater.',
    focusSection: 'Post body',
    minimumWordCount: 180,
  },
};

const DEFAULT_ECHO_NOTE: EchoNote = {
  id: 'fallback',
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
    return (
      ECHO_BLOG_POST_NOTES[pathname] ?? {
        id: 'blog-post-generic',
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
      }
    );
  }
  return ECHO_NOTES_BY_PATH[pathname] ?? DEFAULT_ECHO_NOTE;
}

export function getEchoSignalMetrics() {
  const notes = [
    ...Object.values(ECHO_NOTES_BY_PATH),
    ...Object.values(ECHO_BLOG_POST_NOTES),
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
