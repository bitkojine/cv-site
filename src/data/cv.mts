import rawCvData from './cv.json';
import { type CV, CVSchema } from './schema.mts';

export const cvData: CV = CVSchema.parse(rawCvData);
