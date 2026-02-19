import { z } from 'zod';

export const ContactSchema = z
  .object({
    email: z.string().email(),
    location: z.string(),
    remote: z.string(),
    stack: z.string(),
  })
  .strict();

export const PersonalInfoSchema = z
  .object({
    name: z.string(),
    title: z.string(),
    contact: ContactSchema,
    profile: z.string(),
  })
  .strict();

export const SkillSchema = z
  .object({
    label: z.string(),
    value: z.string(),
  })
  .strict();

const NormalizedDateSchema = z.string().regex(/^\d{4}(-(0[1-9]|1[0-2]))?$/),
  EndDateSchema = z.union([NormalizedDateSchema, z.literal('Present')]);

export const ExperienceSchema = z
  .object({
    title: z.string(),
    company: z.string(),
    location: z.string().optional(),
    startDate: NormalizedDateSchema,
    endDate: EndDateSchema.nullable().optional(),
    description: z.array(z.string()),
  })
  .strict();

export const CVSchema = z
  .object({
    personalInfo: PersonalInfoSchema,
    coreSkills: z.array(SkillSchema),
    experience: z.array(ExperienceSchema),
    independentProjects: z.array(ExperienceSchema),
    lookingFor: z.array(z.string()),
  })
  .strict();

export type CV = z.infer<typeof CVSchema>;

const EvidenceThemes = [
  'reliability',
  'performance',
  'architecture',
  'delivery',
  'data',
  'quality',
] as const;

const EvidenceType = ['case-study', 'decision', 'pattern'] as const;

const NarrativeItemSchema = z
  .object({
    id: z.string(),
    title: z.string(),
    context: z.string(),
    situation: z.string(),
    constraints: z.array(z.string()).min(1),
    options: z.array(z.string()).min(1),
    decision: z.string(),
    tradeoffs: z.array(z.string()).min(1),
    outcome: z.string(),
    learnings: z.array(z.string()).min(1),
    discussionPrompts: z.array(z.string()).min(1).optional(),
    evaluationSignals: z.array(z.string()).min(1).optional(),
    antiPatterns: z.array(z.string()).min(1).optional(),
    themes: z.array(z.enum(EvidenceThemes)).min(1),
    stackHints: z.array(z.string()).min(1),
    snippet: z.string().optional(),
  })
  .strict();

export const SeniorSignalSchema = z
  .object({
    id: z.string(),
    title: z.string(),
    claim: z.string(),
    evidenceRef: z.string(),
    evidenceType: z.enum(EvidenceType),
    themes: z.array(z.enum(EvidenceThemes)).min(1),
  })
  .strict();

export const FitSummarySchema = z
  .object({
    roleFocus: z.string(),
    yearsExperience: z.string(),
    domains: z.array(z.string()).min(1),
    collaborationStyle: z.string(),
    timezoneOverlap: z.string(),
    availability: z.string(),
  })
  .strict();

export const InterviewPolicySchema = z
  .object({
    statement: z.string(),
    prompt: z.string(),
  })
  .strict();

export const HiringEvidenceSchema = z
  .object({
    fitSummary: FitSummarySchema,
    interviewPolicy: InterviewPolicySchema,
    stackMatchOptions: z.array(z.string()).min(1),
    seniorSignals: z.array(SeniorSignalSchema).min(1),
    caseStudies: z.array(NarrativeItemSchema).min(1),
    decisionRecords: z.array(NarrativeItemSchema).min(1),
    productionPatterns: z.array(NarrativeItemSchema).min(1),
    redFlags: z.array(z.string()).min(1),
  })
  .strict();

export type HiringEvidence = z.infer<typeof HiringEvidenceSchema>;
