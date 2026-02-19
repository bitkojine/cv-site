import rawCvData from './cv.json';
import { CVSchema, type CV } from './schema.mts';

export const cvData: CV = CVSchema.parse(rawCvData);
