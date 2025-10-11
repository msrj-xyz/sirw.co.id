import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email().optional(),
  phone: z.string().min(6).optional(),
  password: z.string().min(8),
  fullName: z.string().min(1).optional(),
  nik: z.string().regex(/^\d{16}$/).optional(),
  rtNumber: z.string().optional(),
  rwNumber: z.string().optional(),
  address: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email().optional(),
  phone: z.string().optional(),
  password: z.string().min(1),
});

export const forgotPasswordSchema = z.object({ email: z.string().email() });
export const resetPasswordSchema = z.object({ token: z.string(), password: z.string().min(8) });
export const verifyEmailSchema = z.object({ email: z.string().email(), token: z.string() });
export const sendOtpSchema = z.object({ key: z.string(), method: z.enum(['email', 'sms']), to: z.string() });
export const verifyOtpSchema = z.object({ key: z.string(), code: z.string() });
export const socialGoogleSchema = z.object({ token: z.string() });
