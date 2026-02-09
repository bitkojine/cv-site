import { describe, it, expect } from 'vitest';
import { CVSchema } from '../../src/data/schema';

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
    };

    const result = CVSchema.safeParse(validCV);
    expect(result.success).toBe(true);
  });

  it('fails on missing required fields', () => {
    const invalidCV = {
      personalInfo: {
        name: 'John Doe',
        // Missing other required fields
      },
    };

    const result = CVSchema.safeParse(invalidCV);
    expect(result.success).toBe(false);
  });
});
