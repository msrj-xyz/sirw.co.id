# Rencana Kerja Backend — SIRW (untuk evaluasi)

Dokumen ini merangkum rencana kerja backend untuk MVP SIRW berdasarkan semua dokumen di folder `documents/` (PRD, database schema, API spec, technical requirements, user stories). Tujuan: menjadi bahan evaluasi dan persetujuan sebelum implementasi.

## 1. Ringkasan Eksekutif
- Produk: SIRW (Sistem Informasi RT/RW) — MVP untuk 1 RW (500–1000 warga).
- Platform backend: Node.js 22 + TypeScript 5.x, PostgreSQL 18, Redis 7.
- Fokus MVP: Auth & RBAC, Residents CRUD + CSV import, Letter workflow (template  approval  PDF+QR), Finance (manual payment + verification), Announcements & Notifications.

## 2. Kontrak Minimal (apa yang backend sediakan)
- Input: JSON HTTP, multipart/form-data (file uploads), CSV import.
- Output: RESTful JSON API v1, signed URLs untuk file, downloadable PDFs (A4), background job status, notification events.
- Error modes: validation (422), auth/permission (401/403), rate limiting (429), server errors (500).

## 3. Sprint Plan (MVP)

### Sprint 0  Setup (1 minggu)
- Buat branch kerja: `backend`.
- Scaffold project: `package.json`, `tsconfig.json`, ESLint, Prettier, Husky, lint-staged.
- Docker Compose dev: Postgres 15 + Redis 7 (+ Adminer optional).
- Prisma schema (mengacu `database-schema-design.md`) + migrasi awal + seed minimal (roles, admin).
- Skeleton Express + TypeScript (modular routes: auth, residents, letters, finance).
- Queue skeleton (Bull) + contoh job (CSV import).
- CI minimal (GitHub Actions): lint, tsc, unit tests.
- README dev setup (PowerShell).

### Sprint 1  Auth & Users (1 minggu)
- Register/login (email/phone), JWT (access 15m, refresh 7d, RS256), RBAC middleware.
- Password hashing bcrypt (cost 12), refresh token stored hashed.
- Unit + integration tests untuk auth.

### Sprint 2  Residents & CSV Import (15 minggu)
- Residents CRUD, search, pagination, document uploads.
- CSV import: preview with per-row validation, background processing (Bull), import summary and failed-rows export.

### Sprint 3  Letter Management (2 minggu)
- Letter templates, request endpoints, approval flow.
- Background PDF generation (Puppeteer) + QR generation + upload ke GCS (prod) / local tmp (dev).
- Public verification endpoint untuk QR.

### Sprint 4  Finance MVP (15 minggu)
- Fee types, manual transactions, proof upload, verification workflow, basic dashboard queries.

### Sprint 5  Announcements & Notifications (15 minggu)
- Announcement CRUD, scheduling, push notifications (FCM), read receipts, email via SendGrid/SES.

Catatan: fitur lanjutan (complaints, events, panic button, advanced reports) disusun setelah core stabil.

## 4. Deliverables Sprint 0 (yang akan dibuat pertama)
- Repo scaffold: `package.json`, `tsconfig.json`, linters, Husky.
- `docker-compose.yml` (postgres, redis).
- `prisma/schema.prisma` + initial migration + seed script.
- Basic Express app skeleton (`src/app.ts`, `src/server.ts`).
- Auth module skeleton (register/login/refresh/logout) + RBAC middleware.
- Queue worker skeleton (`src/queue/worker.ts`) dan contoh job file.
- README.md (PowerShell dev setup + environment variables example).
- CI workflow (`.github/workflows/ci.yml`) yang menjalankan lint & tsc.

## 5. Keputusan Teknis (butuh konfirmasi)
Mohon konfirmasi pilihan berikut (jawab singkat):

1. Buat branch kerja `backend`? (rekomendasi: Ya)
2. Library queue: `Bull v4` atau `BullMQ`? (default: `Bull v4`)
3. Simpan refresh tokens di DB (`refresh_tokens` hashed) + rotate on use? (default: Ya)
4. File storage production: Google Cloud Storage (GCS). Untuk dev gunakan local `./tmp` dan signed-URL emulasi? (default: Ya)
5. CI: GitHub Actions? (default: Ya)
6. Seed admin awal: buat `admin@example.test` (password sementara dicantumkan di `.env.example` untuk dev)? (default: Ya)
7. JWT signing: buat RSA keypair dev lokal; di prod gunakan Secret Manager? (default: Ya)

Jika Anda setuju dengan default semuanya, saya akan memulai scaffolding.

## 6. Environment & Dev commands (PowerShell)
Masukkan ke README. Contoh singkat untuk PowerShell:

```powershell
cd C:\Users\aic-devops\Downloads\temp\sirw.co.id
Copy-Item .env.example .env
docker compose up -d
npm install
npx prisma migrate dev --name init
npm run dev
```

## 7. Quality Gates (sebelum merge ke `master`)
- TypeScript build: `tsc --noEmit` (PASS)
- Lint: ESLint (PASS)
- Unit tests: Jest (critical modules: auth, residents import)
- Integration smoke: register  login  create resident  CSV import (smoke)
- Security: audit token handling, avoid secrets in repo (use Secret Manager for prod)

## 8. Edge Cases & Mitigasi
- Duplicate NIK/KK pada CSV import: preview + per-row errors + skip/rollback option.
- Race condition nomor surat: gunakan DB sequence / transaction lock.
- High load PDF gen / imports: worker queue, concurrency limits, autoscale workers.
- Token revocation/rotation: store refresh token hashes + revoke on logout/rotation.
- File access: signed URLs time-limited, IAM control.

## 9. Risiko & Mitigasi
- Risiko: Credential GCS/SendGrid belum tersedia  Mitigasi: stub local storage and document integration steps.
- Risiko: Build or test failures due to local env  Mitigasi: Docker Compose + README jelas.

## 10. Langkah Selanjutnya (jika disetujui)
1. Saya buat branch `backend` dan commit scaffold Sprint 0.
2. Jalankan Docker Compose, migrasi Prisma, seed admin, jalankan smoke tests.
3. Laporkan hasil build, lint, dan smoke tests; lanjutkan ke Sprint 1 jika semua PASS.

---

Dokumen dibuat: 2025-10-10
