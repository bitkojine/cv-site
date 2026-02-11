export interface EmailDraft {
  subject: string;
  body: string;
}

function joinLines(lines: string[]): string {
  return lines.join('\n');
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

export const visitorModes = {
  hiring: 'Recruiter / Hiring Manager',
  build: 'Founder / Operator',
  vision: 'Investor / Advisor',
} as const;

export const roleEmailCtas = {
  hiring: [
    {
      label: 'Request Resume',
      variant: 'primary',
      draft: emailDrafts.hiring.requestResume,
    },
    {
      label: 'Schedule Intro',
      variant: 'secondary',
      draft: emailDrafts.hiring.scheduleIntro,
    },
  ],
  build: [
    {
      label: 'Work Together',
      variant: 'primary',
      draft: emailDrafts.build.workTogether,
    },
    {
      label: 'Book a Call',
      variant: 'secondary',
      draft: emailDrafts.build.bookCall,
    },
  ],
  vision: [
    {
      label: 'Get Product Updates',
      variant: 'primary',
      draft: emailDrafts.vision.getProductUpdates,
    },
    {
      label: 'Request Investment Details',
      variant: 'secondary',
      draft: emailDrafts.vision.requestInvestmentDetails,
    },
  ],
} as const;
