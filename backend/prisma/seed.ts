import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import prisma from '../src/prisma/client';
import { log } from '../src/lib/logger';
import { Prisma } from '@prisma/client';

/**
 * Seed script that creates:
 * - one super_admin user
 * - one regular user
 * - two residents (one linked to regular user, one standalone)
 * - one sample refresh token for the super_admin
 *
 * The script is idempotent: it checks for uniqueness by email / nik / tokenHash
 * and will not create duplicates on repeated runs.
 */

async function ensureUser(data: {
  email?: string;
  phone?: string;
  password?: string;
  role?: string;
  isActive?: boolean;
  emailVerified?: boolean;
  phoneVerified?: boolean;
  isApproved?: boolean;
  twoFactorEnabled?: boolean;
  twoFactorSecret?: string | null;
  oauthProvider?: string | null;
  oauthProviderId?: string | null;
  lastLoginAt?: Date | null;
  lastLoginIp?: string | null;
  failedLoginAttempts?: number;
  lockedUntil?: Date | null;
}) {
  if (!data.email && !data.phone) throw new Error('email or phone required for user seed');
  const where = data.email ? { email: data.email } : { phone: data.phone! };
  const existing = await prisma.user.findUnique({ where });
  if (existing) return existing;

  const password = data.password || 'Password123!';
  const passwordHash = await bcrypt.hash(password, 12);
  return prisma.user.create({
    data: {
      email: data.email,
      phone: data.phone,
      passwordHash,
      role: data.role || 'warga',
      isActive: data.isActive ?? true,
      emailVerified: data.emailVerified ?? false,
      phoneVerified: data.phoneVerified ?? false,
      isApproved: data.isApproved ?? false,
      twoFactorEnabled: data.twoFactorEnabled ?? false,
      twoFactorSecret: data.twoFactorSecret ?? null,
      oauthProvider: data.oauthProvider ?? null,
      oauthProviderId: data.oauthProviderId ?? null,
      lastLoginAt: data.lastLoginAt ?? null,
      lastLoginIp: data.lastLoginIp ?? null,
      failedLoginAttempts: data.failedLoginAttempts ?? 0,
      lockedUntil: data.lockedUntil ?? null,
    },
  });
}

async function ensureResident(data: {
  nik: string;
  kkNumber?: string | null;
  fullName: string;
  birthDate?: Date | null;
  birthPlace?: string | null;
  gender?: string | null;
  religion?: string | null;
  bloodType?: string | null;
  maritalStatus?: string | null;
  nationality?: string | null;
  email?: string | null;
  phone?: string | null;
  occupation?: string | null;
  education?: string | null;
  monthlyIncome?: string | null; // decimal as string
  rtNumber: string;
  rwNumber: string;
  address: string;
  postalCode?: string | null;
  residenceStatus: string;
  moveInDate?: Date | null;
  moveOutDate?: Date | null;
  isActive?: boolean;
  isKkHead?: boolean;
  userId?: string | null;
}) {
  const existing = await prisma.resident.findUnique({ where: { nik: data.nik } });
  if (existing) return existing;
  return prisma.resident.create({
    data: {
      nik: data.nik,
      kkNumber: data.kkNumber ?? null,
      fullName: data.fullName,
      birthDate: data.birthDate ?? null,
      birthPlace: data.birthPlace ?? null,
      gender: data.gender ?? null,
      religion: data.religion ?? null,
      bloodType: data.bloodType ?? null,
      maritalStatus: data.maritalStatus ?? null,
      nationality: data.nationality ?? 'Indonesia',
      email: data.email ?? null,
      phone: data.phone ?? null,
      occupation: data.occupation ?? null,
      education: data.education ?? null,
      monthlyIncome: data.monthlyIncome ? new Prisma.Decimal(data.monthlyIncome) : null,
      rtNumber: data.rtNumber,
      rwNumber: data.rwNumber,
      address: data.address,
      postalCode: data.postalCode ?? null,
      residenceStatus: data.residenceStatus,
      moveInDate: data.moveInDate ?? null,
      moveOutDate: data.moveOutDate ?? null,
      isActive: data.isActive ?? true,
      isKkHead: data.isKkHead ?? false,
      userId: data.userId ?? null,
    },
  });
}

async function ensureRefreshToken(userId: string, tokenPlain: string, expiresAt: Date) {
  const crypto = await import('crypto');
  const tokenHash = crypto.createHash('sha256').update(tokenPlain).digest('hex');
  const existing = await prisma.refreshToken.findUnique({ where: { tokenHash } });
  if (existing) return existing;
  return prisma.refreshToken.create({ data: { id: uuidv4(), userId, tokenHash, expiresAt } });
}

async function main() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@example.test';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'Admin123!';
  const regularEmail = process.env.SEED_USER_EMAIL || 'user@example.test';
  const regularPassword = process.env.SEED_USER_PASSWORD || 'User123!';

  // ensure users
  const admin = await ensureUser({ email: adminEmail, password: adminPassword, role: 'super_admin', isActive: true });
  log.info('Super admin:', admin.id, admin.email);

  const user = await ensureUser({ email: regularEmail, password: regularPassword, role: 'warga', isActive: true });
  log.info('Regular user:', user.id, user.email);

  // ensure residents (populate many fields)
  const resident1 = await ensureResident({
    nik: '3201010000010001',
    kkNumber: '3201010000010000',
    fullName: 'Budi Santoso',
    birthDate: new Date('1985-05-12'),
    birthPlace: 'Bandung',
    gender: 'M',
    religion: 'Islam',
    bloodType: 'O',
    maritalStatus: 'Married',
    nationality: 'Indonesia',
    email: 'budi.santoso@example.test',
    phone: '081234567890',
    occupation: 'Teacher',
    education: 'S1',
    monthlyIncome: '3500000',
    rtNumber: '01',
    rwNumber: '02',
    address: 'Jl. Merdeka No.1',
    postalCode: '40111',
    residenceStatus: 'owner',
    moveInDate: new Date('2010-01-01'),
    isKkHead: true,
    userId: user.id,
  });
  log.info('Resident created/exists:', resident1.nik);

  const resident2 = await ensureResident({
    nik: '3201010000010002',
    kkNumber: '3201010000010000',
    fullName: 'Siti Aminah',
    birthDate: new Date('1990-07-03'),
    birthPlace: 'Jakarta',
    gender: 'F',
    religion: 'Islam',
    bloodType: 'A',
    maritalStatus: 'Single',
    nationality: 'Indonesia',
    email: 'siti.aminah@example.test',
    phone: '081298765432',
    occupation: 'Nurse',
    education: 'D3',
    monthlyIncome: '3000000',
    rtNumber: '01',
    rwNumber: '02',
    address: 'Jl. Merdeka No.2',
    postalCode: '40112',
    residenceStatus: 'tenant',
    moveInDate: new Date('2018-06-01'),
    isKkHead: false,
    userId: null,
  });
  log.info('Resident created/exists:', resident2.nik);

  // ensure a sample refresh token for admin
  const sampleToken = process.env.SEED_SAMPLE_REFRESH_TOKEN || 'sample-refresh-token-please-change';
  const expires = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30); // 30 days
  const rt = await ensureRefreshToken(admin.id, sampleToken, expires);
  // attach device/ip data if not present
  try {
    await prisma.refreshToken.update({ where: { id: rt.id }, data: { deviceInfo: { browser: 'Chrome', os: 'Windows' }, ipAddress: '127.0.0.1' } });
  } catch (e) {
    // ignore update errors if not needed
  }
  log.info('RefreshToken created/exists for admin:', rt.id);
}

main()
  .catch((e) => {
    log.error((e as any)?.message ?? String(e));
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
