import getRedisClient from './redisClient';

const store: Record<string, { code: string; expiresAt: number }> = {};

export function generateOtp(key: string, digits = 6, ttlSec = 300) {
  const code = Math.floor(Math.random() * Math.pow(10, digits)).toString().padStart(digits, '0');
  const redisClient = getRedisClient();
  if (redisClient && typeof redisClient.setex === 'function') {
    // fire-and-forget; if it fails, we'll fallback locally
    try {
      const p = redisClient.setex(`otp:${key}`, ttlSec, code);
      if (p && typeof (p as Promise<unknown>)['catch'] === 'function') (p as Promise<unknown>).catch(() => {});
    } catch (e) {
      // ignore and fallback
    }
    return code;
  }

  store[key] = { code, expiresAt: Date.now() + ttlSec * 1000 };
  return code;
}

export function verifyOtp(key: string, code: string): Promise<boolean> {
  const redisClient = getRedisClient();
  if (redisClient && typeof redisClient.get === 'function') {
    try {
      return (redisClient.get(`otp:${key}`) as Promise<string | null>).then((val) => (val ?? null) === code).catch(() => false);
    } catch (e) {
      return Promise.resolve(false);
    }
  }

  const entry = store[key];
  if (!entry) return Promise.resolve(false);
  if (Date.now() > entry.expiresAt) return Promise.resolve(false);
  return Promise.resolve(entry.code === code);
}
