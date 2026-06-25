# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**DataHeartSC** — Custom ERP/CRM for Fundación Infantil Santiago Corazón. Centralizes operations, sales, donation collection, and inventory control.

Monorepo: `backend/` (NestJS v11 + Prisma v7 + PostgreSQL/PostGIS) and `frontend/` (Angular 18 + Tailwind CSS v3).

## AI Collaboration Protocol (Mandatory)

This codebase is worked on by two AI agents: **Claude** and **Agy (Antigravity)**.

1. **PRE-TASK:** Read the last 20 lines of `ai_cooperation_log.md` before touching anything.
2. **POST-TASK:** Append a log entry to `ai_cooperation_log.md` (timestamp, agent, task, files changed, status, next steps).

## Commands

### Infrastructure
```bash
# Start local PostgreSQL + PostGIS (required before running backend)
docker compose up -d

# Stop
docker compose down
```

### Backend (`cd backend`)
```bash
npm run start:dev            # Port 3000, watch mode
npm test                     # Jest unit tests
npm test -- --testPathPattern=auth   # Run a single test file
npm run lint                 # ESLint with auto-fix

# Prisma — NOTE: in Prisma v7 the URL lives only in prisma.config.ts, not schema.prisma
npx prisma migrate dev --name <name>   # Create and apply a migration
npx prisma migrate status              # Check migration state
npx prisma generate                    # Regenerate client after schema changes
npx prisma studio                      # Visual DB browser (port 5555)
```

### Frontend (`cd frontend`)
```bash
npm start                    # Dev server → http://localhost:4200
npm run build -- --configuration=development   # Dev build with env replacement
npm run build                # Production build → dist/frontend/
npm test                     # Karma + Jasmine
```

## Backend Architecture

### Prisma v7 quirk
The `datasource` block in `prisma/schema.prisma` has **no `url` field**. The connection URL is set exclusively in `prisma.config.ts` via `datasource.url: process.env["DATABASE_URL"]`. Adding `url = env("DATABASE_URL")` to the schema will break migrations (error P1012).

### Module structure
Each feature follows NestJS conventions: `src/<feature>/<feature>.module.ts`, `.controller.ts`, `.service.ts`. All feature modules are imported into `AppModule`.

**Before creating any feature module**, a shared `PrismaService` (`src/prisma/prisma.service.ts`) must be created and exported from a `PrismaModule` — it doesn't exist yet (Sprint 2 task).

### Domain model (18 tables, all in `prisma/schema.prisma`)
- **Auth/RBAC:** `Role`, `Permission`, `RolePermission`, `User`, `AuditLog`
- **Clients & Sales:** `ClientDonor` (unified client+donor), `Order`, `OrderItem`
- **Donations:** `Donation` (Wompi/PayU/PayPal/Frecuenti), `Certificate` (PDF tax receipts → S3/R2)
- **Inventory:** `Product`, `Input` (raw materials, decimal stock), `Companion`, `ProductInput` (BOM), `InventoryMovement`
- **People:** `Beneficiary` (children in the foundation), `Volunteer`, `Provider`

All model names are PascalCase; DB tables use `@@map` to snake_case.

### Security conventions
- **Webhooks** (Shopify, Wompi, PayU): validate HMAC SHA256 before processing — reject any request with an invalid signature.
- **Inventory mutations**: use Prisma transactions with `SELECT ... FOR UPDATE` to prevent stock race conditions.
- **All protected endpoints**: require `Authorization: Bearer <JWT>`.

## Frontend Architecture

### Rules (enforced, non-negotiable)
- **Standalone components only** — no NgModules anywhere.
- **Angular Signals** (`signal`, `computed`, `effect`) for local state — not RxJS `BehaviorSubject`.
- **New control flow syntax**: `@if`, `@for`, `@switch` — never `*ngIf`, `*ngFor`.
- **Lazy loading**: every route uses `loadComponent: () => import(...)`.
- HTTP calls belong in `src/app/core/services/` or `src/app/features/<feature>/services/`; components are presentation-only.

### Folder structure
```
src/app/
  core/
    interceptors/   auth.interceptor.ts  ← injects Bearer token on every request
    guards/         auth.guard.ts        ← redirects to /login if no token
    services/       auth.service.ts      ← login/logout/isLoggedIn
  features/
    auth/login/     LoginComponent       ← public route
    dashboard/      DashboardComponent   ← protected stub
  shared/
    layout/shell/   ShellComponent       ← sidebar + <router-outlet>, wraps all protected routes
```

### Environment files
- `src/environments/environment.ts` → production (`apiUrl: '/api'`)
- `src/environments/environment.development.ts` → dev (`apiUrl: 'http://localhost:3000'`)

`angular.json` has `fileReplacements` wired for the `development` configuration. Always use `environment.apiUrl` as the base URL in services.

### Routing pattern
Protected routes are children of `ShellComponent` with `canActivate: [authGuard]`. Add new protected features as children of the shell route in `app.routes.ts`.

## Local environment

```env
# backend/.env
DATABASE_URL="postgresql://dataheart:dataheart_dev_2026@localhost:5432/dataheart_sc?schema=public"
JWT_SECRET="..."
NODE_ENV="development"
PORT=3000
```

Docker Compose exposes Postgres on `localhost:5432`. The container is `dataheart_postgres` (image: `postgis/postgis:16-3.4`).

## Planned integrations (not yet implemented)
- `PrismaService` / `PrismaModule` in NestJS (blocker for all feature modules)
- Auth JWT: `@nestjs/jwt`, `bcrypt`, `POST /api/auth/login`
- ETL script: migrate historical Access DB → PostgreSQL
- BullMQ + Redis (async PDF certificate queue)
- Shopify webhooks (`POST /api/webhooks/shopify/orders`)
- Wompi / PayU webhooks
- WhatsApp Business API, SMTP (Nodemailer/SendGrid)
- S3 / Cloudflare R2 for certificate PDFs
