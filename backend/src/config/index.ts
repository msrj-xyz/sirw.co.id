import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

export const PORT = process.env.PORT || 4000;
export const DATABASE_URL = process.env.DATABASE_URL as string;
export const REDIS_URL = process.env.REDIS_URL as string;
export const JWT_PRIVATE_KEY_PATH = process.env.JWT_PRIVATE_KEY_PATH || './dev-keys/private.key';
export const JWT_PUBLIC_KEY_PATH = process.env.JWT_PUBLIC_KEY_PATH || './dev-keys/public.key';
