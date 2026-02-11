import cvData from '../data/cv.json';

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
  const [localPart, domain] = email.split('@');
  const baseLocalPart = localPart.split('+')[0];
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
        'Employment type (full-time/contract):',
        'Location / time zone expectations:',
        'Salary range:',
        'Link to job description:',
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
        'Role title:',
        'Primary focus of the role:',
        'Preferred meeting window (with time zone):',
        'Call format (Google Meet/Zoom/Phone):',
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
        'Company / project:',
        'Current bottleneck:',
        'Expected outcome:',
        'Timeline:',
        'Current stack:',
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
        'What we need help with:',
        'Preferred call window (with time zone):',
        'Call format (Google Meet/Zoom/Phone):',
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
        'Name:',
        'Role (investor/advisor/operator):',
        'Areas I care most about:',
        'Preferred update cadence (monthly/quarterly):',
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
        'Name:',
        'Firm (if applicable):',
        'Role:',
        'Investment range:',
        'Timeline:',
        'What convinced me:',
        '',
        'Please share investment details and suggested next steps.',
      ]),
    },
  },
} as const;

// Tracks which inbox alias is used for each website intent.
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
  },
} as const;

export const visitorModes = {
  hiring: 'Recruiter / Hiring Manager',
  build: 'Founder / Operator',
  vision: 'Investor / Advisor',
} as const;

export const roleEmailCtas = {
  hiring: [
    createEmailCta(
      'Request Resume',
      'primary',
      emailDrafts.hiring.requestResume,
      'www-hiring-resume'
    ),
    createEmailCta(
      'Schedule Intro',
      'secondary',
      emailDrafts.hiring.scheduleIntro,
      'www-hiring-intro'
    ),
  ],
  build: [
    createEmailCta(
      'Work Together',
      'primary',
      emailDrafts.build.workTogether,
      'www-build'
    ),
    createEmailCta(
      'Book a Call',
      'secondary',
      emailDrafts.build.bookCall,
      'www-build-call'
    ),
  ],
  vision: [
    createEmailCta(
      'Get Product Updates',
      'primary',
      emailDrafts.vision.getProductUpdates,
      'www-vision-updates'
    ),
    createEmailCta(
      'Request Investment Details',
      'secondary',
      emailDrafts.vision.requestInvestmentDetails,
      'www-vision-invest'
    ),
  ],
} as const satisfies Record<string, readonly EmailCtaConfig[]>;
