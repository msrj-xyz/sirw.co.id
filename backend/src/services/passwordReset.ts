import getRedisClient from './redisClient';
import { v4 as uuidv4 } from 'uuid';

const store: Record<string, { userId: string; expiresAt: number }> = {};

export function createPasswordReset(userId: string, ttlSec = 3600) {
  const token = uuidv4();
  const redisClient = getRedisClient();
  if (redisClient && typeof redisClient.setex === 'function') {
    try {
      const p = redisClient.setex(`pwdreset:${token}`, ttlSec, userId);
      if (p && typeof (p as Promise<unknown>)['catch'] === 'function') (p as Promise<unknown>).catch(() => {});
      return token;
    } catch (e) {
      // fallback to in-memory
    }
  }

  store[token] = { userId, expiresAt: Date.now() + ttlSec * 1000 };
  return token;
}

export function verifyPasswordReset(token: string): Promise<string | null> {
  const redisClient = getRedisClient();
  if (redisClient && typeof redisClient.get === 'function') {
    try {
      return (redisClient.get(`pwdreset:${token}`) as Promise<string | null>).then((v) => v || null).catch(() => null);
    } catch (e) {
      return Promise.resolve(null);
    }
  }
  const entry = store[token];
  if (!entry) return Promise.resolve(null);
  if (Date.now() > entry.expiresAt) return Promise.resolve(null);
  return Promise.resolve(entry.userId);
}

export function deletePasswordResetsForUser(userId: string) {
  const redisClient = getRedisClient();
  if (redisClient) {
    // best-effort: not implemented in Redis adapter (would require scanning)
    return;
  }
  for (const k of Object.keys(store)) {
    if (store[k].userId === userId) delete store[k];
  }
}
