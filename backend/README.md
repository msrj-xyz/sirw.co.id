# backend/ — SIRW Backend scaffold

This folder contains a minimal backend scaffold for SIRW MVP. It's intended for local development and initial implementation (Sprint 0).

Quick start (PowerShell):

```powershell
cd C:\Users\aic-devops\Downloads\temp\sirw.co.id\backend
Copy-Item .env.example .env
# Start DB & Redis
docker compose up -d
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run dev
```

Notes:
- Update `.env` before running migrations.
- Generate dev RSA keypair for JWT (or use HS256 for quick local testing).
