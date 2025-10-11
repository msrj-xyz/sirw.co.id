import { REDIS_URL, REDIS_PASSWORD } from '../config';

type RedisLike = {
  connect: () => Promise<unknown>;
  disconnect?: () => Promise<unknown> | void;
  ping?: () => Promise<string>;
  setex?: (key: string, ttl: number, value: string) => Promise<unknown> | void;
  get?: (key: string) => Promise<string | null>;
} | null;
let client: RedisLike = null;

import { log } from '../lib/logger';

function fmtErr(err: unknown) {
  if (!err) return String(err);
  if (typeof err === 'string') return err;
  if (err instanceof Error) return err.message;
  try { return JSON.stringify(err); } catch (e) { return String(err); }
}

// Avoid starting a Redis connection during tests — tests use in-memory fallbacks
if (REDIS_URL && process.env.NODE_ENV !== 'test') {
  (async () => {
    try {
      // lazyConnect so it doesn't start reconnecting immediately
      const { default: IORedis } = await import('ioredis');
      const opts: Record<string, unknown> = { lazyConnect: true, enableOfflineQueue: false, maxRetriesPerRequest: 1 };
      if (REDIS_PASSWORD) opts.password = REDIS_PASSWORD;
      client = new IORedis(REDIS_URL, opts);
      // attempt a single connect; if it fails, disable redis usage
      client.connect().catch((err: unknown) => {
        log.error('Redis connection failed, falling back to in-memory stores:', fmtErr(err));
        try { if (client && typeof client.disconnect === 'function') void client.disconnect(); } catch (_e) { /* ignore */ }
        client = null;
      });
    } catch (err) {
      log.error('Failed to initialize Redis client:', fmtErr(err));
      client = null;
    }
  })();
}

export default function getRedisClient() {
  return client;
}

export async function shutdownRedis() {
  try {
    if (client && typeof client.disconnect === 'function') {
      await client.disconnect();
    }
  } catch (e) {
    // ignore
  } finally {
    client = null;
  }
}
