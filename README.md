# TSAcademy - Digital Banking System

Backend engineering assignment — full-stack digital bank with NIBSS by Phoenix integration. 

## Stack

| Layer | Tech |
|---|---|
| Backend | NestJS · Drizzle ORM · SQLite · Passport JWT · Zod · Axios |
| Frontend | Next.js 14 (App Router) · React · TypeScript · TailwindCSS · Zod |
| Architecture | Hexagonal (Ports & Adapters) · Domain-Driven Modular Monolith |
| Monorepo | pnpm workspaces |

## Assignment Objectives

> From `banking.txt` — Backend Engineering Assignment: Digital Banking System

1. **Customer Onboarding** — BVN/NIN verification via NIBSS before any account is created.
2. **Account Creation** — Max 1 account per customer, pre-funded with ₦15,000 on creation.
3. **Core Banking** — Name enquiry, intra-bank transfers, inter-bank transfers (via NIBSS), balance check, transaction status query.
4. **Transaction History & Data Privacy** — Customers see only their own data; cross-customer access returns HTTP 403.
5. **NIBSS API Integration** — Live adapter + mock adapter (for offline/test). Swagger: https://nibssbyphoenix.onrender.com/api/docs/

## Project Structure

```
.
├── apps/
│   ├── backend/          # NestJS API (port 3001)
│   │   ├── src/
│   │   │   ├── domain/           # Entities, value objects, domain exceptions
│   │   │   ├── application/      # Use cases (CreateAccount, Transfer, Login…)
│   │   │   ├── infrastructure/   # Drizzle repos, NIBSS HTTP adapters
│   │   │   └── presentation/     # Controllers, guards, pipes
│   │   └── test/
│   │       ├── unit/             # 12 unit tests
│   │       └── e2e/              # 18 E2E tests
│   └── frontend/         # Next.js UI (port 3000)
│       └── src/
│           ├── app/              # App Router pages
│           └── components/       # OnboardingSection, AccountCard, TransferModal…
├── MockSeed.data/        # Seed JSON files for local dev
├── banking.txt           # Assignment spec
├── nibss.txt             # NIBSS API reference
└── package.json
```

## Getting Started

```bash
# Install deps
pnpm install

# Push DB schema
pnpm db:push

# Seed mock data (optional)
pnpm seed

# Run backend (http://localhost:3001)
pnpm dev:backend

# Run frontend (http://localhost:3000)
pnpm dev:frontend
```

### Environment

Create `apps/backend/.env`:

```env
JWT_SECRET=your_secret
NIBSS_BASE_URL=https://nibssbyphoenix.onrender.com
NIBSS_API_KEY=your_api_key
USE_MOCK_NIBSS=true   # false for live inter-bank testing
```

## Key Features

- **KYC Gate** — account creation blocked until BVN or NIN is validated with NIBSS.
- **NUBAN generation** — 10-digit account number, Bank Code 260.
- **Dual NIBSS adapter** — `NibssHttpAdapter` (live) / `NibssMockAdapter` (instant, deterministic for tests).
- **RBAC** — `@Roles('ADMIN')` guard; admin portal inspects all accounts.

## Testing

```bash
# Unit tests (12 tests)
pnpm test:backend

# E2E tests (18 tests — Auth, KYC, Core Banking, RBAC/Privacy)
pnpm test:e2e
```

All 30 tests pass. ✅

## Notes

- **NIBSS cold starts**: The live Render server sleeps on inactivity. Keep `USE_MOCK_NIBSS=true` for local dev.
- **Database**: SQLite (`banking.db`) is fine for this assignment. Would swap Drizzle driver config to PostgreSQL for production scale.
- **Submission deadline**: 5th September 2026 — [submission form](https://docs.google.com/forms/d/e/1FAIpQLSenPGTvB334-QpzDVSuO97bItRsfEYg3NHCDuIAPlnW464Vng/viewform?usp=header)
