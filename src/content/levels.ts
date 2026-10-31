// Kept apart from schema.ts so screens can use levels without loading zod.
export const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1'] as const;
export type Level = (typeof LEVELS)[number];
