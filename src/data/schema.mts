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

const NormalizedDateSchema = z.string().regex(/^\d{4}(-(0[1-9]|1[0-2]))?$/);
const EndDateSchema = z.union([NormalizedDateSchema, z.literal('Present')]);

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
