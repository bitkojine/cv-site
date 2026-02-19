import { describe, expect, it } from 'vitest';
import { CVSchema } from '../../src/data/schema.mts';
import rawCvData from '../../src/data/cv.json';
import { cvData } from '../../src/data/cv.mts';

describe('CVSchema', () => {
  it('validates a correct CV object', () => {
    const validCV = {
        personalInfo: {
          name: 'John Doe',
          title: 'Developer',
          contact: {
            email: 'john@example.com',
            location: 'City, Country',
            stack: 'Full Stack',
            remote: 'Remote',
          },
          profile: 'A passionate developer.',
        },
        coreSkills: [{ label: 'Languages', value: 'TypeScript, Rust' }],
        experience: [
          {
            title: '.NET Engineer',
            company: 'Example Corp',
            location: 'EU Remote',
            startDate: '2024-06',
            endDate: null,
            description: ['Built API services'],
          },
        ],
        independentProjects: [],
        lookingFor: ['Remote work'],
      },
      result = CVSchema.safeParse(validCV);
    expect(result.success).toBe(true);
  });

  it('fails on missing required fields', () => {
    const invalidCV = {
        personalInfo: {
          name: 'John Doe',
        },
      },
      result = CVSchema.safeParse(invalidCV);
    expect(result.success).toBe(false);
  });

  it('validates the repository cv.json fixture', () => {
    const result = CVSchema.safeParse(rawCvData);
    expect(result.success).toBe(true);
  });

  it('rejects unexpected top-level fields', () => {
    const invalidCV = {
        ...rawCvData,
        unknownField: true,
      },
      result = CVSchema.safeParse(invalidCV);
    expect(result.success).toBe(false);
  });

  it('rejects invalid month in normalized date', () => {
    const invalidCV = {
        ...rawCvData,
        experience: [
          {
            ...rawCvData.experience[0],
            startDate: '2024-13',
          },
        ],
      },
      result = CVSchema.safeParse(invalidCV);
    expect(result.success).toBe(false);
  });

  it('exposes parsed cvData through the runtime accessor', () => {
    expect(cvData.personalInfo.name).toBeTypeOf('string');
    expect(cvData.coreSkills.length).toBeGreaterThan(0);
  });
});
