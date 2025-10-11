import app from './app';
import { PORT } from './config';
import prisma from './prisma/client';
import getRedisClient from './services/redisClient';
import { log } from './lib/logger';

const port = process.env.PORT || PORT;

function fmtErr(err: unknown) {
  if (!err) return String(err);
  if (typeof err === 'string') return err;
  if (err instanceof Error) return err.message;
  try {
    return JSON.stringify(err);
  } catch (e) {
    return String(err);
  }
}

async function start() {
  log.info(`Starting server on http://localhost:${port}`);

  // Test database connection
  try {
    // attempt connect with short timeout
    const dbConnect = prisma.$connect();
    const timeout = new Promise((_, rej) => setTimeout(() => rej(new Error('DB connect timeout')), 3000));
    await Promise.race([dbConnect, timeout]);
    log.info('Database: OK');
  } catch (err) {
    log.error('Database: FAILED', fmtErr(err));
  }

  // Test Redis connection if available
  try {
    const redisClient = getRedisClient();
      if (!redisClient) {
      log.warn('Redis: not configured or unavailable — using in-memory fallback');
    } else {
      // try ping if available; ioredis returns a promise for ping
      try {
        if (typeof redisClient.ping === 'function') {
          const pong = await redisClient.ping();
          log.info('Redis: OK', typeof pong === 'string' ? pong : 'pong');
        } else {
          log.warn('Redis client does not support ping; assuming OK');
        }
      } catch (err) {
        log.error('Redis: FAILED (ping)', fmtErr(err));
      }
    }
  } catch (err) {
    log.error('Redis: check failed', fmtErr(err));
  }

  app.listen(port, () => {
    log.info(`Server running on http://localhost:${port}`);
  });
}

start().catch((err) => {
  log.error('Failed to start server:', fmtErr(err));
  process.exit(1);
});
