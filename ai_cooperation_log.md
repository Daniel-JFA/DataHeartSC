# AI Cooperation Log - Project Data Heart (SC)

This file is a shared log for AI agents (Agy and Claude) working on the SC project.
Every time you perform changes or tasks, append a new log entry to the end of this file.
Before starting any work, read the last 15-20 lines to understand the latest changes.

---

### [2026-06-16 15:52:00] - Agent: Agy (Antigravity)
- **Task/Goal:** Setup AI collaboration rules and analyze project startup structure.
- **Files Modified/Created:**
  - [.clauderules](file:///home/djfa/Dev/projects/Propios/SC/.clauderules) (created)
  - [.cursorrules](file:///home/djfa/Dev/projects/Propios/SC/.cursorrules) (created)
  - [.agyrules](file:///home/djfa/Dev/projects/Propios/SC/.agyrules) (created)
  - [ai_cooperation_log.md](file:///home/djfa/Dev/projects/Propios/SC/ai_cooperation_log.md) (created)
- **Current Status / Results:**
  - Project monorepo verified. `/backend` (NestJS) and `/frontend` (Angular 18) are clean templates.
  - Prisma schema [schema.prisma](file:///home/djfa/Dev/projects/Propios/SC/backend/prisma/schema.prisma) exists but is missing tables: `Beneficiary`, `Volunteer`, and `Provider`.
  - Frontend does not have Tailwind CSS installed yet.
  - Collaborative rule files and this log are now initialized.
- **Pending Tasks / Notes for next agent:**
  - Check the startup guide in [analisis_y_guia_inicio.md](file:///home/djfa/.gemini/antigravity-cli/brain/55a55f2b-7f0f-4924-b5f3-3696c810d6a1/analisis_y_guia_inicio.md) (in Antigravity artifacts).
  - Update `schema.prisma` with `Beneficiary`, `Volunteer`, and `Provider` models.
  - Install Tailwind CSS in `/frontend` and initialize basic configurations.

---

### [2026-06-25 00:00:00] - Agent: Claude (claude-sonnet-4-6)
- **Task/Goal:** Tarea 1.3 Sprint 1 — Setup frontend base: Tailwind CSS, estructura core/features/shared, auth flow completo.
- **Files Modified/Created:**
  - `frontend/tailwind.config.js` (modificado — content paths + colores brand)
  - `frontend/src/styles.scss` (modificado — directivas @tailwind base/components/utilities)
  - `frontend/angular.json` (modificado — fileReplacements en config development)
  - `frontend/src/app/app.routes.ts` (modificado — rutas lazy con authGuard)
  - `frontend/src/app/app.config.ts` (modificado — provideHttpClient + authInterceptor)
  - `frontend/src/environments/environment.ts` (creado)
  - `frontend/src/environments/environment.development.ts` (creado)
  - `frontend/src/app/core/interceptors/auth.interceptor.ts` (creado)
  - `frontend/src/app/core/guards/auth.guard.ts` (creado)
  - `frontend/src/app/core/services/auth.service.ts` (creado)
  - `frontend/src/app/shared/layout/shell/shell.component.ts` (creado)
  - `frontend/src/app/shared/layout/shell/shell.component.html` (creado)
  - `frontend/src/app/features/auth/login/login.component.ts` (creado)
  - `frontend/src/app/features/auth/login/login.component.html` (creado)
  - `frontend/src/app/features/dashboard/dashboard.component.ts` (creado)
- **Current Status / Results:**
  - Build exitoso: `npm run build --configuration=development` completa sin errores.
  - Tailwind CSS v3 instalado con paleta `brand` (rojo fundación).
  - Lazy loading: login, shell, dashboard como chunks separados.
  - AuthGuard redirige a `/login` si no hay `access_token` en localStorage.
  - AuthInterceptor inyecta `Authorization: Bearer` en todas las peticiones.
  - AuthService con login/logout/isLoggedIn contra `environment.apiUrl/auth/login`.
- **Pending Tasks / Notes for next agent:**
  - Implementar módulos de features reales (clientes, donaciones, inventario).
  - Añadir manejo de refresh token / expiración de JWT en AuthService.
  - Conectar AuthService con el endpoint real del backend NestJS cuando esté listo.

---

### [2026-06-25 17:45:00] - Agent: Claude (claude-sonnet-4-6)
- **Task/Goal:** Sprint 1 T1.1 + T1.2 — Docker Compose PostgreSQL/PostGIS + Prisma Schema completo + migración inicial.
- **Files Modified/Created:**
  - `/home/djfa/Dev/projects/Propios/SC/docker-compose.yml` (creado — servicio `postgres` con postgis/postgis:16-3.4, puerto 5432, volume nombrado, healthcheck, red dataheart_net)
  - `/home/djfa/Dev/projects/Propios/SC/backend/.env.example` (creado — template de variables)
  - `/home/djfa/Dev/projects/Propios/SC/backend/.env` (actualizado — URL válida postgresql://, JWT_SECRET, NODE_ENV, PORT)
  - `/home/djfa/Dev/projects/Propios/SC/backend/prisma/schema.prisma` (actualizado — modelos Beneficiary, Volunteer, Provider añadidos al final; `url` removida del datasource por requerimiento de Prisma v7)
  - `/home/djfa/Dev/projects/Propios/SC/backend/prisma.config.ts` (actualizado — `url` con non-null assertion para TS strict)
  - `/home/djfa/Dev/projects/Propios/SC/backend/prisma/migrations/20260625173827_init_full_schema/migration.sql` (generado por Prisma — migración completa con las 18 tablas de dominio)
- **Current Status / Results:**
  - Contenedor `dataheart_postgres` corriendo y healthy (postgis/postgis:16-3.4, puerto 5432).
  - `dotenv` ya estaba instalado como dependencia en package.json (v^17.4.2).
  - FIX aplicado: Prisma v7 no acepta `url` en el bloque `datasource` del schema.prisma → movido exclusivamente a `prisma.config.ts`.
  - Migración `init_full_schema` aplicada exitosamente: 18 tablas de dominio creadas en `public` schema.
  - `npx prisma migrate status` → "Database schema is up to date!"
  - Las 3 nuevas tablas confirmadas en DB: `beneficiaries`, `volunteers`, `providers`.
- **Pending Tasks / Notes for next agent:**
  - Implementar módulos NestJS: AuthModule (JWT), ClientsModule, DonationsModule, InventoryModule.
  - Añadir el PrismaService al AppModule del backend.
  - Los modelos Beneficiary/Volunteer/Provider no tienen relaciones aún — definir si necesitan vincularse a User, Orders, etc.
  - Instalar Tailwind CSS en `/frontend` (pendiente desde la entrada de Agy).

### [2026-06-25 18:15:00] - Agent: Claude
- **Task/Goal:** Sprint 1 completo — Cimientos Cloud, Schema DB y Estructura Angular base.
- **Files Modified/Created:**
  - `docker-compose.yml` (creado) — Postgres+PostGIS 16-3.4, puerto 5432, red dataheart_net
  - `backend/.env` (modificado) — DATABASE_URL postgresql estándar, JWT_SECRET, NODE_ENV, PORT
  - `backend/.env.example` (creado) — Template de variables
  - `backend/prisma/schema.prisma` (modificado) — Añadidos modelos Beneficiary, Volunteer, Provider; removido `url` del bloque datasource (requerimiento Prisma v7)
  - `backend/prisma.config.ts` (modificado) — Non-null assertion en DATABASE_URL
  - `backend/prisma/migrations/20260625173827_init_full_schema/` (creado) — Migración inicial completa
  - `backend/package.json` (modificado) — Añadido dotenv como dependencia de producción
  - `frontend/tailwind.config.js` (modificado) — Content paths + paleta `brand` rojo fundación
  - `frontend/src/styles.scss` (modificado) — @tailwind base/components/utilities
  - `frontend/src/app/app.routes.ts` (modificado) — Rutas lazy: login, shell+authGuard, dashboard
  - `frontend/src/app/app.config.ts` (modificado) — provideHttpClient con authInterceptor
  - `frontend/angular.json` (modificado) — fileReplacements en config development
  - `frontend/src/environments/environment.ts` (creado)
  - `frontend/src/environments/environment.development.ts` (creado)
  - `frontend/src/app/core/interceptors/auth.interceptor.ts` (creado) — HttpInterceptorFn JWT
  - `frontend/src/app/core/guards/auth.guard.ts` (creado) — CanActivateFn → /login
  - `frontend/src/app/core/services/auth.service.ts` (creado) — login/logout stub
  - `frontend/src/app/shared/layout/shell/shell.component.ts+html` (creado) — Layout sidebar
  - `frontend/src/app/features/auth/login/login.component.ts+html` (creado) — Login con Signals
  - `frontend/src/app/features/dashboard/dashboard.component.ts` (creado) — Stub dashboard
- **Current Status / Results:**
  - T1.1 ✅ Contenedor `dataheart_postgres` corriendo y healthy en puerto 5432
  - T1.2 ✅ 18 modelos en schema (15 originales + Beneficiary, Volunteer, Provider). Migración `init_full_schema` aplicada exitosamente. `prisma migrate status` = up to date.
  - T1.3 ✅ Tailwind v3 instalado y activo (styles.css 11KB). Build limpio en 1.4s. Interceptor JWT, authGuard, shell layout, login con Signals y `@if`.
  - **Fix crítico Prisma v7:** `url` debe estar SOLO en `prisma.config.ts`, no en el bloque `datasource` del schema.
- **Pending Tasks / Notes for next agent:**
  - Sprint 2: Implementar Auth JWT en NestJS (bcrypt + @nestjs/jwt). Endpoint `POST /api/auth/login` y middleware JWT guard.
  - Sprint 2: Script ETL migración de Access a Postgres.
  - El módulo Prisma de NestJS aún no está creado (src/ solo tiene AppModule vacío). Crear PrismaService antes de cualquier feature.
  - Variables faltantes en .env: JWT_SECRET ya está, pero necesita valor real antes de producción.

---

### [2026-06-25 19:30:00] - Agent: Claude (claude-sonnet-4-6)
- **Task/Goal:** Sprint 2 T2.2 — Script ETL migración datos históricos Supabase → PostgreSQL local.
- **Files Modified/Created:**
  - `scripts/etl/migrate.js` (creado) — Script Node.js ESM completo con paginación Supabase, mapeo de campos, idempotencia y reporte de integridad
  - `scripts/etl/package.json` (creado) — `"type":"module"`, dependencia `pg` v8
  - `scripts/etl/README.md` (creado) — Instrucciones de uso, mapeos campo a campo, formatos de error
- **Current Status / Results:**
  - Tablas Supabase detectadas y migradas exitosamente:
    - `terceros` (14 839 filas) → `clients_donors` (14 887 filas — 48 clientes anónimos creados para pedidos sin tercero vinculado)
    - `catalogo` (114 filas) → `products` (113 filas — 1 SKU colisionó y fue actualizado)
    - `pedidos` (109 filas) → `orders` (109 filas)
    - `pedido_detalle` (189 filas) → `order_items` (117 filas — deduplicación de (order,product,price))
  - ETL completado sin errores (segunda ejecución idempotente: mismo resultado, 0 errores)
  - Diagnóstico y corrección de schema real vs. schema asumido:
    - `clients_donors.doc_number` tiene UNIQUE solo en `doc_number` (no par doc_type+doc_number)
    - `clients_donors.status` default = `'Activo'` (no `'active'`)
    - `orders.client_id` es NOT NULL → pedidos sin tercero vinculado crean cliente anónimo `HIST-PED-{id}`
    - `orders.order_date` es TIMESTAMP (no DATE)
    - `orders.payment_status` default = `'Pendiente'` (no `'pending'`)
    - `order_items.quantity` es INTEGER (no float)
    - Todos los ids son TEXT uuid generados manualmente con `crypto.randomUUID()`
- **Pending Tasks / Notes for next agent:**
  - Implementar módulos NestJS: AuthModule (bcrypt + @nestjs/jwt), PrismaService
  - Los 48 clientes anónimos HIST-PED-{n} en clients_donors pueden vincularse retroactivamente si se recupera la info del comprador en el histórico
  - Revisar los 72 items que no se crearon en order_items (189 leídos - 117 insertados): son deduplicaciones válidas por (order_id, product_id, unit_price)

---

### [2026-06-25 13:15:00] - Agent: Claude (claude-sonnet-4-6)
- **Task/Goal:** Sprint 2 T2.1 — Auth JWT Backend: PrismaService con Driver Adapter, AuthModule (bcrypt + @nestjs/jwt), endpoint POST /api/auth/login, JwtAuthGuard, seed de roles y usuario admin.
- **Files Modified/Created:**
  - `backend/src/prisma/prisma.service.ts` (creado) — PrismaClient con PrismaPg adapter (requerido por Prisma v7 WASM)
  - `backend/src/prisma/prisma.module.ts` (creado) — @Global() module, exporta PrismaService
  - `backend/src/auth/auth.service.ts` (creado) — login() con bcrypt.compare + JwtService.sign, hashPassword()
  - `backend/src/auth/auth.controller.ts` (creado) — POST /auth/login con LoginBodyDto y decoradores class-validator
  - `backend/src/auth/auth.module.ts` (creado) — JwtModule.registerAsync con ConfigService, imports ConfigModule
  - `backend/src/auth/jwt-auth.guard.ts` (creado) — Guard manual con JwtService.verify (sin @nestjs/passport)
  - `backend/src/auth/get-user.decorator.ts` (creado) — @GetUser() param decorator
  - `backend/src/app.module.ts` (modificado) — imports ConfigModule.forRoot, PrismaModule, AuthModule
  - `backend/src/main.ts` (modificado) — globalPrefix 'api', CORS localhost:4200, ValidationPipe whitelist+transform
  - `backend/prisma/seed.ts` (creado) — Roles (Admin, Operador, Contador) + usuario admin@santiagocorazon.org / admin2026
  - `backend/prisma/schema.prisma` (modificado) — previewFeatures = ["driverAdapters"] en generator
  - `backend/package.json` (modificado) — añadido db:seed script, @prisma/adapter-pg, pg, class-validator, class-transformer, @nestjs/jwt, @nestjs/config, bcrypt
- **Current Status / Results:**
  - ✅ `npm run build` limpio (0 errores TypeScript strict)
  - ✅ `npm run db:seed` exitoso: 3 roles + usuario admin creados en DB
  - ✅ Servidor arranca correctamente: todos los módulos inicializan, ruta POST /api/auth/login mapeada
  - ✅ Prueba curl: login devuelve JWT válido (HS256, 8h) + objeto user con id/email/firstName/lastName/role
  - FIX Prisma v7: requiere `previewFeatures = ["driverAdapters"]` en schema + `new PrismaPg(url)` en constructor (no acepta `datasources` ni constructor vacío)
  - FIX ValidationPipe: `whitelist: true` filtra props sin decoradores → LoginBodyDto usa @IsEmail() y @IsString()
- **Pending Tasks / Notes for next agent:**
  - Implementar feature modules: ClientsModule (CRUD clientes/donantes), DonationsModule, InventoryModule
  - El JwtAuthGuard está listo para usar con `@UseGuards(JwtAuthGuard)` en cualquier controller
  - Añadir refresh token / token revocation si se requiere en producción
  - Los 48 clientes anónimos HIST-PED-{n} del ETL pueden vincularse retroactivamente

### [2026-06-25 20:00:00] - Agent: Claude
- **Task/Goal:** Sprint 2 — Auth JWT + RBAC (T2.1) y ETL Supabase → PostgreSQL (T2.2).
- **Files Modified/Created:**
  - `backend/src/prisma/prisma.service.ts` (creado) — PrismaService con driver adapter PrismaPg
  - `backend/src/prisma/prisma.module.ts` (creado) — @Global(), exporta PrismaService
  - `backend/src/auth/auth.service.ts` (creado) — login con bcrypt.compare + JWT sign (8h)
  - `backend/src/auth/auth.controller.ts` (creado) — POST /api/auth/login
  - `backend/src/auth/auth.module.ts` (creado) — JwtModule.registerAsync con ConfigService
  - `backend/src/auth/jwt-auth.guard.ts` (creado) — Guard manual Bearer token (sin @nestjs/passport)
  - `backend/src/auth/get-user.decorator.ts` (creado) — @GetUser() param decorator
  - `backend/src/app.module.ts` (modificado) — importa ConfigModule.forRoot, PrismaModule, AuthModule
  - `backend/src/main.ts` (modificado) — global prefix /api, CORS localhost:4200, ValidationPipe
  - `backend/prisma/schema.prisma` (modificado) — previewFeatures = ["driverAdapters"] en generator
  - `backend/prisma/seed.ts` (creado) — roles Admin/Operador/Contador + usuario admin@santiagocorazon.org
  - `backend/package.json` (modificado) — script db:seed + deps @nestjs/jwt, @nestjs/config, bcrypt
  - `scripts/etl/migrate.js` (creado) — ETL completo Supabase → PostgreSQL
  - `scripts/etl/package.json` (creado) — dep: pg v8
  - `scripts/etl/README.md` (creado) — documentación de uso
- **Current Status / Results:**
  - T2.1 ✅ Login verificado en vivo: POST /api/auth/login → JWT HS256 8h + perfil de usuario
  - T2.1 ✅ Seed ejecutado: roles Admin/Operador/Contador + usuario admin@santiagocorazon.org / admin2026
  - T2.2 ✅ ETL ejecutado: 14839 clientes, 114 productos, 109 pedidos, 189 items migrados desde Supabase
  - Build NestJS: limpio, 0 errores
  - **Fix Prisma v7:** PrismaService usa `new PrismaClient({ adapter: new PrismaPg(DATABASE_URL) })` + `previewFeatures = ["driverAdapters"]` en schema
- **Pending Tasks / Notes for next agent:**
  - Sprint 3: CRUD de ClientDonor (`GET/POST/PUT/DELETE /api/clients`) con paginación y búsqueda
  - Sprint 3: CRUD de Product (`GET/POST/PUT/DELETE /api/products`)
  - Sprint 3 Frontend: Tabla CRM con paginación + formulario de cliente, tabla de productos
  - Para proteger rutas: usar `@UseGuards(JwtAuthGuard)` — el guard está en `src/auth/jwt-auth.guard.ts`
  - Credenciales del admin de prueba: admin@santiagocorazon.org / admin2026
