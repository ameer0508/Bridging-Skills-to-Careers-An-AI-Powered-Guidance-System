import { z } from 'zod';

export const registerSchema = z.object({
  fullName: z
    .string()
    .min(2, 'Full name must be at least 2 characters long')
    .max(100, 'Full name must not exceed 100 characters')
    .trim(),
  email: z
    .string()
    .email('Invalid email address format')
    .max(100, 'Email address must not exceed 100 characters')
    .toLowerCase()
    .trim(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters long')
    .max(100, 'Password must not exceed 100 characters')
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address format').toLowerCase().trim(),
  password: z.string().min(1, 'Password is required')
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required')
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshInput = z.infer<typeof refreshSchema>;
