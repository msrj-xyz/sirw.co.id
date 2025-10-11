import { z } from 'zod';

export const updateProfileSchema = z.object({ fullName: z.string().optional(), phone: z.string().optional(), email: z.string().email().optional() });

export const changePasswordSchema = z.object({ currentPassword: z.string().min(1), newPassword: z.string().min(8) });
