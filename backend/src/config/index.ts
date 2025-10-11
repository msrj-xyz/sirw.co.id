import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

export const NODE_ENV = process.env.NODE_ENV || 'development';
export const PORT = process.env.PORT || 4000;
export const DATABASE_URL = process.env.DATABASE_URL as string;
export const SMTP_HOST = process.env.SMTP_HOST || '';
export const SMTP_PORT = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : undefined;
export const SMTP_USER = process.env.SMTP_USER || '';
export const SMTP_PASS = process.env.SMTP_PASS || '';
export const MAIL_FROM = process.env.MAIL_FROM || 'noreply@example.test';
export const REDIS_URL = process.env.REDIS_URL || '';
export const REDIS_PASSWORD = process.env.REDIS_PASSWORD || '';
export const JWT_PRIVATE_KEY_PATH = process.env.JWT_PRIVATE_KEY_PATH || './dev-keys/private.key';
export const JWT_PUBLIC_KEY_PATH = process.env.JWT_PUBLIC_KEY_PATH || './dev-keys/public.key';
export const COOKIE_SECURE = NODE_ENV === 'production';
export const GCS_BUCKET = process.env.GCS_BUCKET || '';
export const GCS_KEYFILE = process.env.GCS_KEYFILE || '';
