## Analysis & Backend Work Plan — SIRW

This document summarizes the analysis from the `documents` folder and presents a detailed backend work plan in English. It is intended as a development guide for the SIRW MVP backend.

---

## Executive Summary
- Product: SIRW (RT/RW Information System) — MVP targeted for a single RW (500–1000 residents).
- Platform: PWA frontend (React + Tailwind + Shadcn), Backend: Node.js + TypeScript + PostgreSQL.
- Core MVP features: authentication & RBAC, resident data management (+ CSV import), letters (template → approval → PDF + QR), finance (manual payment recording + verification), announcements & notifications, reports & complaints, panic button.
- Recommended infrastructure: GCP (Cloud SQL, GCS, Memorystore Redis), Bull for queues, FCM for push notifications, Puppeteer for PDF generation.

---

## Minimal API Contract (what the backend will provide)
- Inputs: HTTP JSON, multipart uploads (documents, proofs), CSV for bulk import.
- Outputs: RESTful JSON API v1, signed URLs for files, downloadable PDFs for letters (A4, print-ready), notifications (push/email), background job results.
- Error modes: input validation (422), auth/permission errors (401/403), rate limiting (429), job failures (logged + retried).

Success criteria for MVP: working authentication, resident CRUD + CSV import, letter workflow through PDF+QR, manual payment recording + verification, basic announcements + notifications.

---

## Important Edge Cases
1. Duplicate NIK/KK during CSV import — provide preview and per-row error reporting.
2. Race conditions for sequential letter numbering — use DB transactions/sequences or locking.
3. High load on PDF generation / large imports — use worker queues, batched processing, concurrency limits.
4. Token rotation and revocation — store refresh tokens hashed and use httpOnly cookies.
5. File access and signed URL expiry — signed URLs must be time-limited and access-controlled.

---

## Sprint Plan (high-level, MVP focus)

- Sprint 0 — Setup (1 week)
  - Repo scaffold: Node + TypeScript, ESLint, Prettier, Husky
  - Docker Compose for dev: Postgres + Redis
  - Initial Prisma schema + migration + minimal seed
  - CI skeleton (lint & test)

- Sprint 1 — Auth & Users (1 week)
  - Register/login (email+password), JWT (access + refresh), RBAC middleware
  - Admin approval workflow
  - Tests: unit + integration for auth

- Sprint 2 — Residents & CSV Import (1–2 weeks)
  - Residents CRUD, search, pagination
  - CSV import: preview contract + background import job (Bull)
  - Export residents

- Sprint 3 — Letter Management (2 weeks)
  - Letter templates, request creation, approval endpoints
  - Background PDF generation (Puppeteer) + upload to GCS
  - QR code generation + public verification endpoint

- Sprint 4 — Finance MVP (1–2 weeks)
  - Fee types, manual transaction records, upload proof, verification workflow
  - Basic financial dashboard queries

- Sprint 5 — Announcements & Notifications (1–2 weeks)
  - Announcement CRUD, scheduling, in-app list
  - Push notifications via FCM, email via SendGrid/SES

Advanced features (complaints, events, panic button, reporting) follow after the core is stable.

---

## Initial Technical Checklist (first-week deliverables)
1. `package.json` and `tsconfig.json`
2. Docker Compose file (Postgres 15, Redis 7)
3. Prisma schema (based on documents/database-schema-design.md) + migration
4. Basic Express app (TypeScript) with modular structure
5. Auth module: register/login/refresh/logout, password hashing (bcrypt)
6. RBAC middleware example
7. Worker service skeleton (Bull) and example queue job
8. README with Windows PowerShell dev setup instructions

---

## Dev Setup Commands (PowerShell)
The following commands will be placed in README so developers can quickly run a local dev environment on Windows PowerShell.

```powershell
# 1. Change to project folder (you are already on branch `backend`)
cd C:\Users\aic-devops\Downloads\temp\sirw.co.id

# 2. Copy env example
Copy-Item .env.example .env

# 3. Start local services (Postgres + Redis)
docker compose up -d

# 4. Install dependencies
npm install

# 5. Run Prisma migrations
npx prisma migrate dev --name init

# 6. Start dev server
npm run dev

```

Note: README will include environment variables details (DATABASE_URL, REDIS_URL, GCS credentials, JWT keys).

---

## Quality Gates (verification before merge)
- Build: TypeScript compile check (tsc --noEmit) — PASS
- Lint: ESLint — PASS
- Unit tests: Jest (critical modules like auth/resident) — minimal passing suite
- Integration smoke: register → login → create resident → CSV import smoke
- Security: review token storage and secret management (Secret Manager for production)

If all gates pass, deploy to staging and run UAT with a sample RW.

---

## Risks & Mitigations
- Performance risk for PDF generation → Mitigation: queue workers, limit concurrency, scale workers.
- Data migration errors → Mitigation: CSV preview, validation, dry-run, export failed rows.
- Security (tokens/files) → Mitigation: httpOnly cookies, signed URLs, audit logs.

---

## Next Steps (what I will do after your confirmation)
1. Create the project scaffold (package.json, tsconfig, docker-compose, src/) and commit to the `backend` branch.
2. Implement basic auth + Prisma schema + migrations.
3. Open a small PR (setup) so CI and the team can review early.

Please confirm if I should proceed with scaffolding now; I will create the initial files and run local migrations with Docker Compose, then report results.

---

Document created: 2025-10-09
