import { z } from 'zod';

export const ContactSchema = z.object({
  email: z.string().email(),
  location: z.string(),
  remote: z.string(),
  stack: z.string(),
});

export const PersonalInfoSchema = z.object({
  name: z.string(),
  title: z.string(),
  contact: ContactSchema,
  profile: z.string(),
});

export const SkillSchema = z.object({
  label: z.string(),
  value: z.string(),
});

export const ExperienceSchema = z.object({
  title: z.string(),
  company: z.string(),
  period: z.string(),
  description: z.array(z.string()),
});

export const CVSchema = z.object({
  personalInfo: PersonalInfoSchema,
  coreSkills: z.array(SkillSchema),
  experience: z.array(ExperienceSchema),
  independentProjects: z.array(ExperienceSchema),
  lookingFor: z.array(z.string()),
});

export type CV = z.infer<typeof CVSchema>;
