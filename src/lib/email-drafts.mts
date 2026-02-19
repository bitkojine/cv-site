import { cvData } from '../data/cv.mts';

export interface EmailDraft {
  subject: string;
  body: string;
}

export interface EmailCtaConfig {
  label: string;
  variant: 'primary' | 'secondary';
  draft: EmailDraft;
  recipientEmail: string;
}

function joinLines(lines: string[]): string {
  return lines.join('\n');
}

function getBaseEmailAddress(email: string): string {
  const [localPart, domain] = email.split('@'),
    baseLocalPart = localPart.split('+')[0];
  return `${baseLocalPart}@${domain}`;
}

function buildTaggedGmailAddress(baseEmail: string, tag: string): string {
  const [localPart, domain] = baseEmail.split('@');
  return `${localPart}+${tag}@${domain}`;
}

function createEmailCta(
  label: string,
  variant: 'primary' | 'secondary',
  draft: EmailDraft,
  tag: string
): EmailCtaConfig {
  return {
    label,
    variant,
    draft,
    recipientEmail: buildTaggedGmailAddress(websiteEmailBase, tag),
  };
}

export function createMailtoHref(email: string, draft: EmailDraft): string {
  return `mailto:${email}?subject=${encodeURIComponent(draft.subject)}&body=${encodeURIComponent(draft.body)}`;
}

export function createDraftTooltip(draft: EmailDraft): string {
  return `Subject: ${draft.subject}\n\n${draft.body}`;
}

export const emailDrafts = {
  hiring: {
    requestResume: {
      subject: 'Request Resume',
      body: joinLines([
        'Hi Robertas,',
        '',
        'I would like to request your resume for an open role.',
        '',
        'Company:',
        'Role title:',
        'Link to job description (optional):',
        '',
        'Please send your latest resume when possible.',
      ]),
    },
    scheduleIntro: {
      subject: 'Schedule Intro',
      body: joinLines([
        'Hi Robertas,',
        '',
        'I would like to schedule a short intro conversation.',
        '',
        'Company:',
        'Role title (optional):',
        'Preferred meeting window (with time zone):',
        'Optional context:',
        '',
        'Looking forward to connecting.',
      ]),
    },
  },
  build: {
    workTogether: {
      subject: 'Work Together',
      body: joinLines([
        'Hi Robertas,',
        '',
        'I need focused execution support for a product bottleneck.',
        '',
        'Current bottleneck:',
        'Desired outcome:',
        'Target timeline (optional):',
        '',
        'Please share your availability and suggested next steps.',
      ]),
    },
    bookCall: {
      subject: 'Book a Call',
      body: joinLines([
        'Hi Robertas,',
        '',
        'I would like to book a call to discuss potential collaboration.',
        '',
        'Company / project:',
        'What you need help with (one sentence):',
        'Preferred call window (optional):',
        '',
        'Thanks.',
      ]),
    },
  },
  vision: {
    getProductUpdates: {
      subject: 'Get Product Updates',
      body: joinLines([
        'Hi Robertas,',
        '',
        'I would like to get updates on what you are building.',
        '',
        'Name (optional):',
        'Best email for updates:',
        'Optional focus area:',
        '',
        'Please share the best way to stay updated.',
      ]),
    },
    requestInvestmentDetails: {
      subject: 'Request Investment Details',
      body: joinLines([
        'Hi Robertas,',
        '',
        'I am interested in exploring investment in your work.',
        '',
        'Name / firm:',
        'What stage details are you looking for?',
        'Optional context:',
        '',
        'Please share investment details and suggested next steps.',
      ]),
    },
  },
  ops: {
    discussWebsiteSystem: {
      subject: 'Discuss Website System',
      body: joinLines([
        'Hi Robertas,',
        '',
        'I want to discuss how your website system can scale from inbound traffic to signed outcomes.',
        '',
        'I am visiting as:',
        'What I want to evaluate:',
        'Preferred call window (optional):',
        '',
        'Please share suggested next steps.',
      ]),
    },
    requestPipelineSnapshot: {
      subject: 'Get This Website Flow Summary',
      body: joinLines([
        'Hi Robertas,',
        '',
        'I would like a compact summary of this website flow and conversion system.',
        '',
        'I care most about:',
        'Time horizon:',
        'Optional context:',
        '',
        'Please share relevant details.',
      ]),
    },
    exploreAdvisoryFit: {
      subject: 'Explore Advisory Fit',
      body: joinLines([
        'Hi Robertas,',
        '',
        'I am interested in an advisory/operator conversation about your website system.',
        '',
        'My role:',
        'How I could help:',
        'Preferred next step:',
        '',
        'Open to a short intro if useful.',
      ]),
    },
  },
  dev: {
    getUpdates: {
      subject: 'Get Open Source Updates',
      body: joinLines([
        'Hi Robertas,',
        '',
        'I am following your open source work and would like to stay updated.',
        '',
        'Name / GitHub handle (optional):',
        'Projects I care about (optional):',
        'Optional note:',
        '',
        'Thanks for building in public.',
      ]),
    },
    collaborate: {
      subject: 'Collaborate on Open Source',
      body: joinLines([
        'Hi Robertas,',
        '',
        'I am interested in collaborating on one of your open source projects.',
        '',
        'Name / GitHub handle:',
        'Project:',
        'Area of interest (optional):',
        'Optional context:',
        '',
        'Looking forward to your thoughts.',
      ]),
    },
  },
} as const;

const websiteEmailBase = getBaseEmailAddress(cvData.personalInfo.contact.email);

export const contactEmailAliases = {
  header: cvData.personalInfo.contact.email,
  cta: {
    hiringRequestResume: buildTaggedGmailAddress(
      websiteEmailBase,
      'www-hiring-resume'
    ),
    hiringScheduleIntro: buildTaggedGmailAddress(
      websiteEmailBase,
      'www-hiring-intro'
    ),
    buildWorkTogether: buildTaggedGmailAddress(websiteEmailBase, 'www-build'),
    buildBookCall: buildTaggedGmailAddress(websiteEmailBase, 'www-build-call'),
    visionGetProductUpdates: buildTaggedGmailAddress(
      websiteEmailBase,
      'www-vision-updates'
    ),
    visionRequestInvestmentDetails: buildTaggedGmailAddress(
      websiteEmailBase,
      'www-vision-invest'
    ),
    opsDiscussWebsiteSystem: buildTaggedGmailAddress(
      websiteEmailBase,
      'www-ops'
    ),
    opsRequestPipelineSnapshot: buildTaggedGmailAddress(
      websiteEmailBase,
      'www-ops-pipeline'
    ),
    opsExploreAdvisoryFit: buildTaggedGmailAddress(
      websiteEmailBase,
      'www-ops-advisory'
    ),
    devGetUpdates: buildTaggedGmailAddress(websiteEmailBase, 'www-dev-updates'),
    devCollaborate: buildTaggedGmailAddress(websiteEmailBase, 'www-dev-collab'),
  },
} as const;

export const visitorModes = {
  hiring: 'Recruiter / Hiring Manager',
  build: 'Founder / Operator',
  vision: 'Investor / Advisor',
  ops: 'Investor / Advisor / Operator',
  dev: 'Developer / Builder',
} as const;

export const roleEmailCtas = {
  hiring: [
    createEmailCta(
      'Send Resume Request',
      'primary',
      emailDrafts.hiring.requestResume,
      'www-hiring-resume'
    ),
    createEmailCta(
      'Send Intro Request',
      'secondary',
      emailDrafts.hiring.scheduleIntro,
      'www-hiring-intro'
    ),
  ],
  build: [
    createEmailCta(
      'Send Work Request',
      'primary',
      emailDrafts.build.workTogether,
      'www-build'
    ),
    createEmailCta(
      'Send Call Request',
      'secondary',
      emailDrafts.build.bookCall,
      'www-build-call'
    ),
  ],
  vision: [
    createEmailCta(
      'Send Product Update Request',
      'primary',
      emailDrafts.vision.getProductUpdates,
      'www-vision-updates'
    ),
    createEmailCta(
      'Send Investment Request',
      'secondary',
      emailDrafts.vision.requestInvestmentDetails,
      'www-vision-invest'
    ),
  ],
  ops: [
    createEmailCta(
      'Send Website System Request',
      'primary',
      emailDrafts.ops.discussWebsiteSystem,
      'www-ops'
    ),
    createEmailCta(
      'Send Flow Summary Request',
      'secondary',
      emailDrafts.ops.requestPipelineSnapshot,
      'www-ops-pipeline'
    ),
    createEmailCta(
      'Send Advisory Request',
      'secondary',
      emailDrafts.ops.exploreAdvisoryFit,
      'www-ops-advisory'
    ),
  ],
  dev: [
    createEmailCta(
      'Send Open Source Update Request',
      'primary',
      emailDrafts.dev.getUpdates,
      'www-dev-updates'
    ),
    createEmailCta(
      'Send Collaboration Request',
      'secondary',
      emailDrafts.dev.collaborate,
      'www-dev-collab'
    ),
  ],
} as const satisfies Record<string, readonly EmailCtaConfig[]>;
