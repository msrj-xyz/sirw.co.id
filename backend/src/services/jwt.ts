import fs from 'fs';
import jwt from 'jsonwebtoken';
import { JWT_PRIVATE_KEY_PATH, JWT_PUBLIC_KEY_PATH } from '../config';

const privateKey = fs.existsSync(JWT_PRIVATE_KEY_PATH)
  ? fs.readFileSync(JWT_PRIVATE_KEY_PATH)
  : undefined;
const publicKey = fs.existsSync(JWT_PUBLIC_KEY_PATH) ? fs.readFileSync(JWT_PUBLIC_KEY_PATH) : undefined;

export function signAccessToken(payload: object) {
  if (privateKey) {
    return jwt.sign(payload, privateKey, { algorithm: 'RS256', expiresIn: '15m' });
  }
  // fallback to HS256 using a simple secret (dev only)
  return jwt.sign(payload, process.env.JWT_SECRET || 'dev-secret', { expiresIn: '15m' });
}

export function signRefreshToken(payload: object) {
  if (privateKey) {
    return jwt.sign(payload, privateKey, { algorithm: 'RS256', expiresIn: '7d' });
  }
  return jwt.sign(payload, process.env.JWT_SECRET || 'dev-secret', { expiresIn: '7d' });
}

export function verifyToken<T = unknown>(token: string) {
  try {
    if (publicKey) {
      return jwt.verify(token, publicKey) as T;
    }
    return jwt.verify(token, process.env.JWT_SECRET || 'dev-secret') as T;
  } catch (err) {
    return null;
  }
}
