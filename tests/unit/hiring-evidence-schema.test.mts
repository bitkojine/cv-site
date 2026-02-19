import { describe, expect, it } from 'vitest';
import rawHiringEvidence from '../../src/data/hiring-evidence.json';
import {
  HiringEvidenceSchema,
  type HiringEvidence,
} from '../../src/data/schema.mts';
import { hiringEvidenceData } from '../../src/data/hiring-evidence.mts';

describe('HiringEvidenceSchema', () => {
  it('validates the repository hiring evidence fixture', () => {
    const result = HiringEvidenceSchema.safeParse(rawHiringEvidence);
    expect(result.success).toBe(true);
  });

  it('requires seeded senior-level evidence content', () => {
    const data = HiringEvidenceSchema.parse(rawHiringEvidence);
    expect(data.caseStudies.length).toBeGreaterThanOrEqual(2);
    expect(data.decisionRecords.length).toBeGreaterThanOrEqual(3);
    expect(data.productionPatterns.length).toBeGreaterThanOrEqual(3);
    expect(data.seniorSignals.length).toBeGreaterThanOrEqual(6);
  });

  it('exposes parsed hiring evidence through runtime accessor', () => {
    const data: HiringEvidence = hiringEvidenceData;
    expect(data.fitSummary.roleFocus.length).toBeGreaterThan(0);
    expect(data.interviewPolicy.statement.length).toBeGreaterThan(0);
  });
});
