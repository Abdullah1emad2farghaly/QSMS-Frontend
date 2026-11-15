import { z } from 'zod';

/** Generic, business-agnostic building blocks. Module schemas are added later. */
export const requiredString = z.string().trim().min(1);
export const emailField = z.string().trim().min(1).email();
