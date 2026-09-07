import { z } from 'zod';

export const updateProfileSchema = z
  .object({
    fullName: z
      .string()
      .min(2, 'Full name must be at least 2 characters long')
      .max(100, 'Full name must not exceed 100 characters')
      .trim()
      .optional(),
    avatar: z
      .string()
      .url('Avatar must be a valid URL')
      .or(z.literal('')) // Allow empty string to clear avatar
      .optional(),
    primaryCareerDomain: z.string().trim().optional(),
    secondaryCareerDomains: z.array(z.string().trim()).optional(),
    targetCareerId: z.string().trim().optional(),
    targetRole: z.string().trim().optional(),
    onboardingCompleted: z.boolean().optional(),
    onboardingCompletedAt: z.string().or(z.date()).optional(),
    profileCompleted: z.boolean().optional()
  })
  .strict('Unexpected properties detected in profile updates');

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
