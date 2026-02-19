import rawHiringEvidence from './hiring-evidence.json';
import { type HiringEvidence, HiringEvidenceSchema } from './schema.mts';

export const hiringEvidenceData: HiringEvidence =
  HiringEvidenceSchema.parse(rawHiringEvidence);
