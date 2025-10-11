import prisma from './prisma/client';
import { shutdownRedis } from './services/redisClient';

export default async function globalTeardown() {
  try {
    await prisma.$disconnect();
  } catch (e) {
    // ignore
  }
  try {
    await shutdownRedis();
  } catch (e) {
    // ignore
  }
}
