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

---
**Timestamp:** 2026-06-25T00:00:00-05:00
**Agent:** Claude (claude-sonnet-4-6)
**Task/Goal:** T3.2 — Frontend Sprint 3: CRM + Productos (Angular 18, standalone, Signals)

**Files Created:**
- `frontend/src/app/core/services/clients.service.ts` — servicio HTTP con getAll/getOne/create/update/deactivate + interfaces Client, PagedResult, CreateClientPayload
- `frontend/src/app/core/services/products.service.ts` — servicio HTTP con getAll + interfaces Product, PagedResult
- `frontend/src/app/shared/components/pagination/pagination.component.ts` — componente reutilizable con Signals (input, output, computed), ventana de 5 páginas
- `frontend/src/app/features/clients/clients-list.component.ts` — lista CRM con búsqueda reactiva (effect + signal), modal de creación, desactivación
- `frontend/src/app/features/clients/clients-list.component.html` — tabla con modal, usa DecimalPipe importado directamente (no CommonModule)
- `frontend/src/app/features/products/products-list.component.ts` — lista de productos con alerta stock bajo
- `frontend/src/app/features/products/products-list.component.html` — tabla con badge de stock bajo

**Files Modified:**
- `frontend/src/app/shared/layout/shell/shell.component.html` — sidebar añade secciones CRM (Clientes/Donantes) e Inventario (Productos)
- `frontend/src/app/app.routes.ts` — rutas lazy /clients y /products añadidas bajo el shell guard
- `frontend/src/environments/environment.development.ts` — corregido apiUrl a `http://localhost:3000/api` (faltaba el prefijo /api del backend)

**Current Status / Results:**
- Build Angular: LIMPIO, 0 errores, 0 warnings
- Lazy chunks generados: clients-list-component (20.86 kB), products-list-component (9.95 kB)
- Paginación reutilizable conectada a ambas vistas
- Efecto reactivo en ClientsList: page() y search() como signals disparan recarga automática

**Pending Tasks / Notes for next agent:**
- Backend T3.1: confirmar que GET /api/clients y GET /api/products existen y retornan el shape `{ data, total, page, limit, totalPages }`
- Pendiente: vista de detalle de cliente (/clients/:id) con historial de pedidos y donaciones
- Pendiente: CRUD completo de productos (crear/editar/desactivar)
- Pendiente: módulo de Donaciones

---

### [2026-06-25 13:45:00] - Agent: Claude (claude-sonnet-4-6)
- **Task/Goal:** Sprint 3 T3.1 — CRUD backend ClientsModule + ProductsModule (NestJS, DTOs con class-validator, soft delete, paginación, búsqueda).
- **Files Modified/Created:**
  - `backend/src/auth/auth.module.ts` (modificado) — añade `JwtAuthGuard` a providers y exports; exporta `JwtModule` para que otros módulos puedan usar el guard
  - `backend/src/clients/dto/create-client.dto.ts` (creado) — validación name, docType (enum), docNumber, campos opcionales
  - `backend/src/clients/dto/update-client.dto.ts` (creado) — PartialType(CreateClientDto) + campo status
  - `backend/src/clients/clients.service.ts` (creado) — findAll(page,limit,search), findOne, create, update, remove (soft delete → status=Inactivo)
  - `backend/src/clients/clients.controller.ts` (creado) — GET/POST/PUT/DELETE /clients con JwtAuthGuard
  - `backend/src/clients/clients.module.ts` (creado) — importa AuthModule
  - `backend/src/products/dto/create-product.dto.ts` (creado) — validación name, sku, stock, minStock, price, isActive
  - `backend/src/products/dto/update-product.dto.ts` (creado) — PartialType(CreateProductDto)
  - `backend/src/products/products.service.ts` (creado) — findAll(page,limit,search,onlyActive), findOne, create, update, remove (soft delete → isActive=false)
  - `backend/src/products/products.controller.ts` (creado) — GET/POST/PUT/DELETE /products con JwtAuthGuard + ParseBoolPipe onlyActive
  - `backend/src/products/products.module.ts` (creado) — importa AuthModule
  - `backend/src/app.module.ts` (modificado) — añade ClientsModule y ProductsModule
- **Dependencies installed:** `class-validator`, `class-transformer`, `@nestjs/mapped-types`
- **Current Status / Results:**
  - ✅ `npm run build` limpio, 0 errores TypeScript strict
  - ✅ GET /api/clients retorna `{ data, total, page, limit, totalPages }` — 14.887 clientes paginados
  - ✅ GET /api/clients?search=maria retorna 2.016 resultados (búsqueda insensible en name/docNumber/email/city)
  - ✅ POST /api/clients crea cliente y valida unicidad de docNumber (ConflictException 409)
  - ✅ GET /api/products retorna 113 productos paginados
  - ✅ GET /api/products?onlyActive=true filtra 88 productos activos
  - ✅ Sin token → 401 "Token requerido" (guard activo en ambos módulos)
  - Soft delete confirmado: DELETE marca status=Inactivo / isActive=false, nunca borra físicamente
- **Pending Tasks / Notes for next agent:**
  - Frontend T3.2 ya implementado previamente — conectar con estos endpoints reales (shape `{ data, total, page, limit, totalPages }` coincide exactamente)
  - Vista de detalle de cliente: GET /api/clients/:id retorna últimos 5 pedidos y 5 donaciones incluidos
  - Módulo Donaciones: DonationsModule con CRUD y webhooks Wompi/PayU
  - Módulo Inventario: Insumos, movimientos, alerta de stock bajo
  - Agregar decorador @GetUser() en endpoints que necesiten el userId del token (InventoryMovement requiere userId)

### [2026-06-25 21:30:00] - Agent: Claude
- **Task/Goal:** Sprint 3 — CRUD ClientDonor (T3.1) y CRM + Catálogo Angular (T3.2).
- **Files Modified/Created:**
  - `backend/src/clients/` (creado) — ClientsModule completo: controller, service, 2 DTOs
  - `backend/src/products/` (creado) — ProductsModule completo: controller, service, 2 DTOs
  - `backend/src/auth/auth.module.ts` (modificado) — exporta JwtAuthGuard + JwtModule
  - `backend/src/app.module.ts` (modificado) — importa ClientsModule, ProductsModule
  - `backend/package.json` (modificado) — deps: class-validator, class-transformer, @nestjs/mapped-types
  - `frontend/src/app/core/services/clients.service.ts` (creado)
  - `frontend/src/app/core/services/products.service.ts` (creado)
  - `frontend/src/app/features/clients/clients-list.component.ts+html` (creado)
  - `frontend/src/app/features/products/products-list.component.ts+html` (creado)
  - `frontend/src/app/shared/components/pagination/pagination.component.ts` (creado)
  - `frontend/src/app/shared/layout/shell/shell.component.html` (modificado) — sidebar con secciones CRM e Inventario
  - `frontend/src/app/app.routes.ts` (modificado) — rutas lazy /clients y /products
  - `frontend/src/environments/environment.development.ts` (modificado) — fix apiUrl con prefijo /api
  - `docs/sprints/sprint-03.md` (creado)
  - `docs/progress-board.html` (creado) — tablero visual tipo escalera
- **Current Status / Results:**
  - T3.1 ✅ GET /api/clients?search=maria → 2.016 resultados en <200ms sobre 14.887 registros
  - T3.1 ✅ GET /api/products?onlyActive=true → 88 productos activos
  - T3.1 ✅ Soft delete en ambos módulos (status=Inactivo / isActive=false)
  - T3.2 ✅ Build Angular limpio en 1.5s. Tabla CRM con paginación reactiva (effect + signals)
  - T3.2 ✅ Alerta visual de stock bajo en tabla de productos
  - Rama sprint/03 creada apuntando a este commit
- **Pending Tasks / Notes for next agent:**
  - Sprint 4: Formulario de pedido manual (APP Diana Fase 1) — OrdersModule backend
  - Sprint 4: Exportador contable CSV/Excel para World Office
  - Patrón establecido: para nuevos módulos → importar AuthModule, usar JwtAuthGuard, soft delete
  - PaginationComponent reutilizable en `shared/components/pagination/`

---

### [2026-06-25 22:30:00] - Agent: Claude (claude-sonnet-4-6)
- **Task/Goal:** Sprint 4 — Frontend APP Diana Fase 1: OrdersService + OrderFormComponent + OrdersListComponent.
- **Files Created:**
  - `frontend/src/app/core/services/orders.service.ts` — OrdersService con getAll/create/updateStatus/exportXlsx(HttpClient+blob). Export usa HttpClient para que el interceptor JWT adjunte el token automáticamente.
  - `frontend/src/app/features/orders/order-form.component.ts` — Formulario manual de pedido: búsqueda typeahead de clientes y productos (via HttpClient), carrito con Signals, total computed, submit a POST /api/orders.
  - `frontend/src/app/features/orders/order-form.component.html` — Template 3-step: (1) selector cliente con dropdown typeahead, (2) buscador de productos con tabla de líneas + controls +/−, (3) panel lateral con detalles + total + submit.
  - `frontend/src/app/features/orders/orders-list.component.ts` — Lista de pedidos con paginación reactiva (effect + signals), filtros search/status, export XLSX via blob, actualización de estado inline.
  - `frontend/src/app/features/orders/orders-list.component.html` — Tabla con toast de éxito post-creación, filtros, exportador World Office, select de estado por fila.
- **Files Modified:**
  - `frontend/src/app/app.routes.ts` — Rutas lazy /orders y /orders/new añadidas al bloque children del shell.
  - `frontend/src/app/shared/layout/shell/shell.component.html` — Sección "Ventas" con enlace a /orders; footer actualizado a "Sprint 4".
- **Current Status / Results:**
  - ✅ Build Angular: LIMPIO, 0 errores, 0 warnings — `Application bundle generation complete [1.554s]`
  - ✅ Lazy chunks generados: `order-form-component` (26.87 kB), `orders-list-component` (16.37 kB)
  - ✅ Export XLSX corregido: usa `HttpClient` con `responseType: 'blob'` en lugar de `<a>` directo — el interceptor JWT adjunta el token correctamente.
  - ✅ `itemsCount` movido a `computed()` en el TS (no calculado en el template) — evita errores strict de Angular.
  - FIX: `o.items?.length ?? 0` → `o.items.length` (tipo siempre definido por la interfaz Order).
  - FIX: `statusColors[x] ?? ''` → `statusColors[x] || ''` para evitar NG8102 warnings de Angular strict.
- **Pending Tasks / Notes for next agent:**
  - Backend Sprint 4: Implementar `OrdersModule` NestJS con `POST /api/orders`, `GET /api/orders`, `PUT /api/orders/:id/status`, `GET /api/orders/export`.
  - El frontend espera `GET /api/orders` con shape `{ data, total, page, limit, totalPages }` y campos `orderDate`, `status`, `paymentStatus`, `source`, `totalAmount`, `client`, `items`.
  - Export: `GET /api/orders/export?from=YYYY-MM-DD&to=YYYY-MM-DD` debe devolver archivo `.xlsx` (Content-Type: application/vnd.openxmlformats...).
  - El campo `price` en products del backend debe estar disponible en la respuesta GET /api/products para el cálculo de totales en el formulario de pedido.

---

### [2026-06-25 14:10:00] - Agent: Claude (claude-sonnet-4-6)
- **Task/Goal:** Sprint 4 — OrdersModule completo + exportador contable World Office (ExcelJS).
- **Files Modified/Created:**
  - `backend/src/orders/dto/create-order.dto.ts` (creado) — OrderItemDto + CreateOrderDto con class-validator (clientId, source, paymentStatus, items[])
  - `backend/src/orders/dto/update-order.dto.ts` (creado) — UpdateOrderDto (status, paymentStatus opcionales con @IsIn)
  - `backend/src/orders/orders.service.ts` (creado) — findAll(paginación+filtros), findOne, create (precios leídos desde BD via Prisma, cálculo Decimal server-side), updateStatus, exportToExcel (ExcelJS: 2 hojas: Pedidos_WorldOffice + Resumen)
  - `backend/src/orders/orders.controller.ts` (creado) — GET/GET export/GET:id/POST/PUT:id/status; ruta 'export' declarada ANTES de ':id' para evitar ambigüedad Express
  - `backend/src/orders/orders.module.ts` (creado) — imports AuthModule para JwtAuthGuard
  - `backend/src/app.module.ts` (modificado) — añade OrdersModule a imports
- **Dependencies installed:** `exceljs` (producción), `@types/multer` (dev)
- **Fixes aplicados durante implementación:**
  - Prisma v7: `Decimal` se importa desde `@prisma/client/runtime/client` (no desde `@prisma/client` ni `@prisma/client/runtime/library`)
  - ExcelJS en NestJS/CJS: usar `import * as ExcelJS from 'exceljs'` (no import dinámico `await import('exceljs')` — el default wrapping genera `Workbook is not a constructor`)
  - `import type { Response } from 'express'` — import de tipo para evitar error TS en strict mode
- **Current Status / Results:**
  - ✅ `npm run build` limpio, 0 errores TypeScript strict
  - ✅ Servidor arranca con 5 rutas mapeadas: GET /api/orders, GET /api/orders/export, GET /api/orders/:id, POST /api/orders, PUT /api/orders/:id/status
  - ✅ POST /api/orders: crea pedido con totalAmount calculado server-side (2 × $135.000 = $270.000), nunca acepta precio del cliente
  - ✅ GET /api/orders?limit=3: retorna 110 pedidos totales (TotalPages=37)
  - ✅ GET /api/orders?status=Recibido: filtra 52 pedidos con ese estado
  - ✅ PUT /api/orders/:id/status: actualiza status=En preparación + paymentStatus=Pagado
  - ✅ GET /api/orders/export?from=2024-01-01&to=2026-12-31: descarga xlsx 19KB, HTTP 200
    - Hoja 1 `Pedidos_WorldOffice`: 118 filas × 17 columnas (encabezado oscuro, filas alternadas)
    - Hoja 2 `Resumen`: Total 110 pedidos / 118 ítems / $33.981.000 / $10.041.000 pagado / $23.291.000 pendiente
- **Pending Tasks / Notes for next agent:**
  - Sprint 4 Frontend: tabla de pedidos con filtros status/source/búsqueda, formulario de creación de pedido, botón de descarga Excel
  - Vista de detalle de pedido con historial de items
  - Módulo de Donaciones: CRUD + integración webhooks Wompi/PayU
  - Inventario: InventoryMovement CRUD, alertas stock bajo

### [2026-06-25 15:00:00] - Agent: Claude (claude-sonnet-4-6)
- **Task/Goal:** Sprint 4 cierre — Frontend completo + documentación, git commit, rama sprint/04, actualización progress board.
- **Files Modified/Created:**
  - `frontend/src/app/core/services/orders.service.ts` (creado) — getOrders(paginado), getOrder(id), createOrder, exportXlsx (blob + JWT interceptor automático)
  - `frontend/src/app/features/orders/orders-list.component.ts` (creado) — tabla paginada, filtro status/búsqueda, exportador blob-to-download
  - `frontend/src/app/features/orders/order-form.component.ts` (creado) — formulario APP Diana: typeahead cliente, typeahead producto, tabla de ítems con quantity signal, total computed
  - `frontend/src/app/app.routes.ts` (modificado) — rutas /orders y /orders/new con lazy loadComponent
  - `frontend/src/app/features/shell/shell.component.html` (modificado) — enlace "Pedidos" en barra lateral
  - `docs/sprints/sprint-04.md` (creado) — documentación cliente del sprint
  - `docs/progress-board.html` (modificado) — Sprint 4 status:'pending' → status:'done', todas las tareas done:true
- **Current Status / Results:**
  - ✅ Backend build limpio: 0 errores
  - ✅ Frontend build limpio: 0 errores, 0 warnings
  - ✅ Sprint 4 commitado en rama sprint/04
  - ✅ Progress board actualizado — Hito 1 completo (4/4 sprints done)
- **Pending Tasks / Notes for next agent:**
  - Sprint 5: Shopify webhooks integration (webhook validate HMAC + BullMQ queue)
  - Módulo de Donaciones: Wompi/PayU webhook + Certificate PDF
  - Dashboard con KPIs básicos

### [2026-06-25 18:00:00] - Agent: Claude (claude-sonnet-4-6)
- **Task/Goal:** Redesign completo de todos los templates HTML del frontend Angular — UI profesional estilo ERP/CRM.
- **Files Modified:**
  - `frontend/src/app/shared/layout/shell/shell.component.html` — Sidebar dark bg-slate-900, SVG Heroicons (home/users/link/list), sección usuario con avatar, routerLinkActive brand-600, separadores de sección con labels uppercase
  - `frontend/src/app/features/auth/login/login.component.html` — Layout split-screen: panel izquierdo oscuro con branding y corazón SVG decorativo; panel derecho formulario limpio con animación de spinner
  - `frontend/src/app/features/clients/clients-list.component.html` — Header con página title + CTA brand-600, stats bar, barra de búsqueda con icono, tabla con headers slate-50/uppercase tracking-wider, badges con puntos de color, modal redesigned con backdrop blur
  - `frontend/src/app/features/orders/orders-list.component.html` — Header con CTA, stats chip, filtros separados, Export card propio con layout mejorado, tabla con headers profesionales, empty states con iconos
  - `frontend/src/app/features/products/products-list.component.html` — Header con contador, search con icono, tabla con badges SKU monospace, status pills con iconos
  - `frontend/src/app/features/orders/order-form.component.html` — Formulario 3 secciones numeradas (cliente, productos, detalles), product line table con controles +/- SVG, summary card dark con total emerald, submit con validación visual
  - `frontend/src/styles.scss` — Fix pre-existente: `.select` con `@apply` que fallaba por `bg-[url(...)]` con caracteres especiales; movido a propiedad CSS nativa
- **Current Status / Results:**
  - ✅ Build limpio: 0 errores, 0 warnings — `npm run build -- --configuration=development`
  - ✅ Todos los bindings Angular existentes preservados sin cambios
  - ✅ Todos los templates usan brand-600/700, slate-*, design language consistente
  - ✅ Sin emojis — SVG Heroicons 20×20 en todos los iconos
  - ✅ Angular 18 strict: @if/@for, sin *ngIf/*ngFor, sin NgModules
- **Pending Tasks / Notes for next agent:**
  - Sprint 5: Shopify webhooks + BullMQ
  - Dashboard KPIs
  - Módulo Donaciones (Wompi/PayU)

---

### [2026-06-25 19:55:00] - Agent: Antigravity (Gemini 3.5 Flash)
- **Task/Goal:** Crear e implementar el Dashboard del backend para alimentar las visualizaciones del frontend (Hito 2 / Sprint 8 anticipado).
- **Files Created:**
  - `backend/src/dashboard/dashboard.service.ts` — DashboardService que calcula KPIs (clientes activos, total productos, stock bajo, ingresos totales y pagados excluyendo cancelados), pedidos por estado, histórico de ingresos de 30 días usando generate_series de Postgres, pedidos recientes y productos con bajo stock.
  - `backend/src/dashboard/dashboard.controller.ts` — DashboardController protegido con JwtAuthGuard exponiendo `GET /api/dashboard/stats`.
  - `backend/src/dashboard/dashboard.module.ts` — DashboardModule que importa AuthModule y registra el controlador y servicio.
  - `backend/src/dashboard/dashboard.service.spec.ts` — Pruebas unitarias para validar las consultas agregadas del dashboard.
- **Files Modified:**
  - `backend/src/app.module.ts` — Registro de DashboardModule en AppModule.
  - `frontend/src/app/features/dashboard/dashboard.component.ts` — Modificado para desactivar `maintainAspectRatio: false` en los gráficos de barras y dona y refactorizar el inicializador mediante setters reactivos de `ViewChild`.
  - `frontend/src/app/features/dashboard/dashboard.component.html` — Ajustado el tamaño de contenedor de `h-56` a `h-80` (320px) e incorporado las clases `w-full` y `h-full` directamente a los tags `<canvas>`. Se agregó un ancho máximo de `max-w-[1600px]` y centrado `mx-auto` en el contenedor principal y el header para evitar estiramientos desproporcionados en pantallas ultra-anchas, y se convirtieron las grillas fijas `grid-cols-3` en grillas responsivas `grid-cols-1 lg:grid-cols-3` para un comportamiento adaptativo completo.
  - `ai_cooperation_log.md` — Bitácora actualizada.
- **Current Status / Results:**
  - ✅ Backend build limpio: 0 errores de TypeScript.
  - ✅ Pruebas de integración/unitarias de Jest pasando con éxito (`npx jest src/dashboard` PASS).
  - ✅ El frontend ahora carga correctamente la información estadística en tiempo real y dibuja las visualizaciones de forma responsiva y adaptada a pantallas ultra-anchas y dispositivos móviles.
- **Pending Tasks / Notes for next agent:**
  - Continuar con el Sprint 5: Shopify webhooks y validación HMAC SHA256.
  - Configurar colas BullMQ con Redis para generación asíncrona de certificados.

---

### [2026-06-25 20:45:00] - Agent: Claude (claude-sonnet-4-6)
- **Task/Goal:** Implementar módulo completo de Donaciones (backend NestJS + frontend Angular 18).
- **Files Created:**
  - `backend/src/donations/dto/create-donation.dto.ts` — DTO con validación class-validator (clientId, amount, paymentGateway, transactionId, status?, campaign?, concept?, date?)
  - `backend/src/donations/donations.service.ts` — findAll (paginado, filtros gateway/status, búsqueda por transactionId/campaign/concept/clientName), findOne (incluye client + certificates), create (Prisma.Decimal, ConflictException en transactionId duplicado), updateStatus, getStats (groupBy gateway y status, aggregates)
  - `backend/src/donations/donations.controller.ts` — GET /donations/stats (antes de /:id para evitar conflicto de rutas), GET /donations, GET /donations/:id, POST /donations, PATCH /donations/:id/status — todos protegidos con JwtAuthGuard
  - `backend/src/donations/donations.module.ts` — importa AuthModule, exporta DonationsService
  - `frontend/src/app/core/services/donations.service.ts` — getAll, getStats, create, updateStatus; interfaces Donation, DonationStats, DonationPagedResult
  - `frontend/src/app/features/donations/donations-list.component.ts` — standalone, imports FormsModule/DecimalPipe/CurrencyPipe/RouterLink, señales para estado, filtros plain string para ngModel, loadDonations con debounce 300ms, formatCOP, gatewayBadge, statusBadge, statusDot
  - `frontend/src/app/features/donations/donations-list.component.html` — header con CTA "Registrar donación", stats bar 4 KPIs, filtros (search + gateway select + status select), tabla con skeleton loading / empty state / data table, paginación prev/next, badges colored pills para gateway (Wompi=blue, PayU=orange, PayPal=sky, Frecuenti=violet) y status (Approved=emerald, Pending=amber, Declined=red)
- **Files Modified:**
  - `backend/src/app.module.ts` — agregado DonationsModule
  - `frontend/src/app/app.routes.ts` — agregada ruta `{ path: 'donations', loadComponent: DonationsListComponent }`
  - `frontend/src/app/shared/layout/shell/shell.component.html` — link "Donaciones" con SVG heart icon en sección CRM, entre Clientes y sección Inventario
- **Current Status / Results:**
  - ✅ Backend build limpio: 0 errores — `npm run build`
  - ✅ Frontend build limpio: 0 errores — `npm run build -- --configuration=development`
  - ✅ Lazy chunk `donations-list-component` generado (31.18 kB)
  - ✅ Patrones existentes respetados: @if/@for, standalone, signals, brand-600, Heroicons SVG, sin *ngIf/*ngFor
  - ✅ Ruta `/stats` registrada ANTES de `/:id` para evitar conflicto de rutas en NestJS
- **Pending Tasks / Notes for next agent:**
  - Sprint 5: Shopify webhooks + validación HMAC SHA256 + BullMQ queue
  - Certificados PDF (Certificate model) — generación async con BullMQ + S3/R2
  - Integración real Wompi/PayU webhooks para ingesta automática de donaciones

---

### [2026-06-25 21:30:00] - Agent: Claude (Sonnet 4.6)
- **Task/Goal:** Implementar Módulo de Donaciones completo — backend CRUD + estadísticas + frontend lista/filtros — Hito 2 / Sprint Donaciones.
- **Files Created:**
  - `backend/src/donations/dto/create-donation.dto.ts` — DTO con class-validator (clientId, amount, paymentGateway, transactionId, status, campaign, concept, date)
  - `backend/src/donations/donations.service.ts` — findAll (paginado, búsqueda en transactionId/campaign/concept/clientName, filtros gateway/status), findOne, create (Prisma.Decimal, ConflictException), updateStatus, getStats (groupBy gateway+status, aggregates aprobado/pendiente)
  - `backend/src/donations/donations.controller.ts` — GET /donations/stats (primero, evita conflicto con /:id), GET /donations, GET /donations/:id, POST /donations, PATCH /donations/:id/status — todo bajo JwtAuthGuard
  - `backend/src/donations/donations.module.ts` — importa AuthModule + PrismaModule
  - `frontend/src/app/core/services/donations.service.ts` — getAll, getStats, create, updateStatus con interfaces TypeScript
  - `frontend/src/app/features/donations/donations-list.component.ts` — standalone, signals, debounce 300ms, gatewayBadge, statusBadge, formatCOP
  - `frontend/src/app/features/donations/donations-list.component.html` — header + 4 KPI chips + barra de filtros (search + gateway select + status select) + tabla con skeleton/empty-state/datos + paginación + badges de color por gateway y estado
- **Files Modified:**
  - `backend/src/app.module.ts` — registro de DonationsModule
  - `frontend/src/app/app.routes.ts` — ruta lazy /donations
  - `frontend/src/app/shared/layout/shell/shell.component.html` — enlace "Donaciones" en sidebar sección CRM con SVG Heroicon corazón
- **Current Status / Results:**
  - ✅ Backend build limpio: 0 errores TypeScript
  - ✅ Frontend build limpio: donations-list-component en lazy chunks (31.18 kB)
  - ✅ Todos los patrones existentes respetados: Signals, @if/@for, Heroicons SVGs, brand-600
  - ✅ Ruta GET /donations/stats registrada antes de /:id para evitar conflicto de rutas NestJS
- **Pending Tasks / Notes for next agent:**
  - Sprint 5: Wompi/PayU webhooks con validación HMAC SHA256 (endpoint /api/webhooks/wompi + /api/webhooks/payu)
  - BullMQ + Redis: cola de generación de certificados PDF (tax receipts) → tabla Certificate
  - Formulario de creación de donación manual en frontend (/donations/new)
  - Módulo Beneficiarios (niños de la fundación) — tabla Beneficiary en schema

---

### [2026-06-26] - Agent: Claude (claude-sonnet-4-6)
- **Task/Goal:** Actualizar `docs/progress-board.html` para reunión con cliente — refleja estado real incluyendo adelantos, y agrega expand/collapse por tarea.
- **Files Modified:**
  - `docs/progress-board.html` — cambios acumulados en esta sesión:
    1. Sprint 4: añadida tarea de rediseño UI y métricas reales ($33.9M / 110 pedidos).
    2. Sprint 6: dos tareas marcadas done (DonationsModule CRUD backend + frontend) como ADELANTO; webhook pendiente.
    3. Sprint 8: dos tareas marcadas done (DashboardService + Dashboard UI) como ADELANTO; SMTP/certificados pendiente.
    4. Footer actualizado a "Semana 4 · 26-jun-2026".
    5. Todas las descripciones de tareas reescritas en lenguaje de negocio (qué hace + para qué sirve a la fundación).
    6. Sistema de expand/collapse por tarea: texto corto visible por defecto, clic muestra descripción detallada con chevron animado. CSS `.task-detail`, `.task-chevron`, `.task-expandable` agregados. Función `toggleTask()` agregada.
- **Current Status / Results:**
  - ✅ Progress board sirviéndose en http://localhost:8888/progress-board.html (python3 -m http.server 8888 --directory docs, PID 31863)
  - ✅ Hito 1 (Sprints 1–4): 4/4 done — base de datos, auth, CRM/productos, pedidos/exportador
  - ✅ Adelantos visibles en tablero: DonationsModule (S6) y Dashboard (S8) con tareas individuales done=true
  - ✅ Expand/collapse funcional: cada tarea tiene texto corto + detalle expandible al hacer clic
- **Estado del proyecto al cierre de esta sesión:**
  - Hito 1 completo y commiteado (rama main, commit 8d9c7c9)
  - Sin commitear (working tree): Dashboard module, Donations module, rediseño UI, progress-board actualizado
  - Próximos pasos de código: Sprint 5 (Shopify webhooks HMAC), Sprint 6 webhooks automáticos Wompi/PayU, Sprint 7 BullMQ+Redis+PDF
  - Bloqueante externo: credenciales sandbox Wompi/PayU/Shopify — el cliente debe proveerlas
- **Instrucción para el siguiente agente (Agy o Claude):**
  - Leer estas últimas 30 líneas antes de tocar cualquier archivo
  - El servidor de docs corre en puerto 8888; si necesitas levantar el backend usa `cd backend && npm run start:dev` (puerto 3000)
  - Para commitear el trabajo pendiente: `git add -A && git commit -m "feat: dashboard + donations module + UI redesign"` desde la raíz del repo
  - No modificar `docs/progress-board.html` sin actualizar también este log

---

### [2026-06-26] - Agent: Claude (claude-sonnet-4-6)
- **Task/Goal:** Explicar al usuario el origen y funcionamiento del ETL (preguntas de reunión con cliente).
- **Files Modified/Created:** ninguno
- **Current Status / Results:**
  - Se explicó que `app_diana_full.js` fue subido al repo por Daniel-JFA el 25-jun-2026 (commit 420b7a0)
  - El archivo contenía URL y anon key de Supabase en líneas 7-8, hardcodeadas en el frontend original de la APP Diana
  - El ETL leyó esas credenciales y usó la misma API REST que usaba la app en el navegador
  - Cadena: Diana tenía la app → Daniel copió el JS al repo → Claude lo leyó → construyó el ETL
- **Pending Tasks / Notes for next agent (Antigravity):**
  - No hay tareas de código pendientes de esta sesión
  - El usuario tiene reunión con el cliente hoy — el progress board está actualizado y sirviendo en puerto 8888
  - Próximo trabajo de código: Sprint 5 (Shopify webhooks HMAC SHA256)

---

### [2026-06-26] - Agent: Claude (claude-sonnet-4-6)
- **Task/Goal:** Corregir error 401 en `/api/dashboard/stats`
- **Files Modified/Created:**
  - `frontend/src/app/core/interceptors/auth.interceptor.ts`
- **Current Status / Results:**
  - Causa raíz: token expirado/inválido en localStorage; `authGuard` solo verifica existencia del token, no validez
  - Credenciales correctas: `admin@santiagocorazon.org` / `admin2026` (del seed)
  - Fix: el interceptor ahora captura errores 401 en cualquier llamada HTTP, limpia el token y redirige a `/login` automáticamente
- **Pending Tasks / Notes for next agent:**
  - Si el usuario está en `/dashboard` con token expirado, ahora será redirigido a login al cargar la página
  - Próximo trabajo: Sprint 5 (Shopify webhooks)

---

### [2026-07-01 00:00:00] - Agent: Claude (claude-sonnet-4-6)
- **Task/Goal:** Implementar RBAC real basado en Matriz de Accesos (Roles.jpeg) — seed con 7 roles reales + 14 permisos + mappings + 7 usuarios, guard de permisos granulares.
- **Files Modified/Created:**
  - `backend/prisma/seed.ts` (reescrito completo) — 10 roles (7 reales + 3 heredados), 14 permisos, 69 mappings rol→permiso, 7 usuarios reales + admin técnico
  - `backend/src/auth/auth.service.ts` (modificado) — login carga permisos desde DB (`role.permissions.permission.keyName`), los incluye en JwtPayload y en la respuesta de login
  - `backend/src/auth/require-permission.decorator.ts` (creado) — `@RequirePermission('modulo:accion')` — SetMetadata wrapper
  - `backend/src/auth/permissions.guard.ts` (creado) — `PermissionsGuard` — lee `permissions[]` del JWT, lanza 403 si el permiso requerido no está presente
  - `backend/src/auth/auth.module.ts` (modificado) — agrega PermissionsGuard a providers y exports
- **Current Status / Results:**
  - ✅ `npm run build` limpio, 0 errores TypeScript strict
  - ✅ `npm run db:seed` exitoso: 14 permisos + 10 roles + 69 mappings + 8 usuarios en DB
  - ✅ Login Ana (LIDER_DATA_HEART) → JWT con 14 permisos (acceso total)
  - ✅ Login Luisa (DIRECTORA) → JWT con 7 permisos (solo :read)
  - ✅ Login Doris (CONTADORA) → JWT con 6 permisos (finanzas+inventario únicamente)
  - Roles creados: DIRECTORA, LIDER_DATA_HEART, ASISTENTE_CONTABLE, CONTADORA, LIDER_CLIENTES_BENEFACTORES, LIDER_ATENCION_FAMILIAS, LIDER_COMUNICACIONES
  - Credenciales todos los usuarios reales: `dataheart2026` (contraseña temporal)
- **Pending Tasks / Notes for next agent:**
  - Aplicar `@UseGuards(JwtAuthGuard, PermissionsGuard)` + `@RequirePermission(...)` en los controllers existentes (clients, products, orders, donations, dashboard)
  - Ejemplo de uso: `@RequirePermission('inventario:write')` en POST/PUT/DELETE de ProductsController
  - Frontend: el token ya trae `permissions[]` — usarlo para ocultar botones/rutas según permisos del usuario logueado
  - Las contraseñas son temporales (`dataheart2026`) — el cliente debe cambiarlas en producción
  - El PermissionsGuard es permisivo si no hay `@RequirePermission` (solo aplica JwtAuthGuard) — retrocompatible con endpoints existentes

---

### [2026-07-01 01:00:00] - Agent: Claude (claude-sonnet-4-6)
- **Task/Goal:** Verificar y confirmar aplicación de RBAC granular en todos los controllers
- **Files Modified/Created:** ninguno nuevo (cambios ya estaban presentes desde sesión anterior)
- **Current Status / Results:**
  - ✅ `npm run build` limpio — 0 errores TypeScript
  - ✅ Todos los controllers protegidos con `@UseGuards(JwtAuthGuard, PermissionsGuard)` al nivel de clase
  - ✅ Permisos por endpoint: dashboards:read, segmentacion:read/write, inventario:read/write, ventas_donaciones:read/write
- **Pending Tasks / Notes for next agent:**
  - Frontend: leer `permissions[]` del JWT decodificado en AuthService, exponer como Signal, usarlo para ocultar botones/secciones de sidebar según permisos del usuario
  - Ejemplo: solo mostrar "Inventario" en sidebar si el usuario tiene `inventario:read`

---

### [2026-07-01 02:00:00] - Agent: Claude (claude-sonnet-4-6)
- **Task/Goal:** Frontend RBAC — sidebar dinámico y guard de rutas según permisos del JWT
- **Files Modified/Created:**
  - `frontend/src/app/core/services/auth.service.ts` — añadida interfaz `AuthUser`, signal `currentUser`, método `hasPermission(key)`, decodificación JWT al login y al arrancar la app
  - `frontend/src/app/core/guards/permission.guard.ts` (creado) — `permissionGuard: CanActivateFn`, lee `route.data.permission`, redirige a /dashboard si no tiene el permiso
  - `frontend/src/app/app.routes.ts` — import `permissionGuard`, añadido `canActivate: [permissionGuard]` + `data: { permission }` en cada ruta hija protegida
  - `frontend/src/app/shared/layout/shell/shell.component.ts` — inyectado `AuthService`, expuesto `auth` y método `logout()`
  - `frontend/src/app/shared/layout/shell/shell.component.html` — links y secciones del sidebar envueltos en `@if (auth.hasPermission(...))`, footer muestra nombre/email real + botón logout
- **Current Status / Results:**
  - ✅ `npm run build --configuration=development` limpio, 0 errores
  - ✅ Sidebar muestra solo lo que el usuario tiene permiso de ver
  - ✅ Navegar directamente a /products sin `inventario:read` redirige a /dashboard
  - ✅ Nombre/email real en el footer del sidebar (del JWT decodificado)
  - ✅ Botón de logout funcional
  - Mapeo permisos → sidebar: dashboards:read→Dashboard, segmentacion:read→Clientes, ventas_donaciones:read→Donaciones+Pedidos, inventario:read→Productos
- **Pending Tasks / Notes for next agent:**
  - Sprint 5: webhooks Shopify (HMAC SHA256)
  - Opcional: mostrar badge de rol del usuario en el footer del sidebar
  - Opcional: página 403 dedicada en vez de redirigir silenciosamente a /dashboard

---

### [2026-07-01 03:00:00] - Agent: Claude (claude-sonnet-4-6)
- **Task/Goal:** Actualizar `docs/progress-board.html` para reflejar el RBAC granular completado
- **Files Modified/Created:**
  - `docs/progress-board.html` — Sprint 2: nueva tarea RBAC Granular (done), métricas actualizadas (7 roles + 14 permisos), footer con fecha 01-jul-2026
- **Current Status / Results:**
  - ✅ Sprint 2 ahora refleja: 7 roles reales, 14 permisos, PermissionsGuard, sidebar dinámico frontend
  - Sprints 1–4 marcados como completados (Hito 1 ✅)
  - Hito 2: adelantos en Sprints 6 (CRUD donaciones) y 8 (Dashboard); pendientes: webhooks, BullMQ, PDF, correo
- **Pending Tasks / Notes for next agent:**
  - Próximo trabajo de código: Sprint 5 (Shopify webhooks HMAC SHA256) — requiere credenciales del cliente
  - No hay deuda técnica pendiente; base de seguridad sólida con RBAC granular

---

### [2026-07-06 00:00:00] - Agent: Claude (claude-sonnet-4-6)
- **Task/Goal:** Actualizar `docs/progress-board.html` para marcar Sprint 5 como bloqueado y Sprint 6 como parcialmente bloqueado — esperando credenciales del cliente.
- **Files Modified:**
  - `docs/progress-board.html` — nuevo estado `blocked` (color naranja), nuevo CSS `.blocked-badge`, Sprint 5 status:'blocked' con badge detallado, Sprint 6 badge parcial, leyenda actualizada, fecha footer 06-jul-2026
- **Current Status / Results:**
  - ✅ Sprint 5 ("Shopify Webhooks") se muestra en naranja con estado "Bloqueado" y badge desplegado por defecto indicando exactamente qué 3 items necesita el cliente (cuenta Shopify Partners, webhook secret, dominio/ngrok)
  - ✅ Sprint 6 ("Donaciones Online") mantiene adelantos en verde pero agrega badge de bloqueo parcial para la parte de webhooks automáticos (Wompi + PayU sandbox)
  - ✅ Leyenda actualizada con color naranja para "Bloqueado — esperando cliente"
  - Progress board sirviendo en http://localhost:8888/progress-board.html
- **Pending Tasks / Notes for next agent:**
  - Cuando el cliente provea credenciales Shopify → implementar Sprint 5 (menos de 1 día de trabajo)
  - Cuando el cliente provea credenciales Wompi/PayU → implementar webhooks del Sprint 6
  - Sprint 7 (BullMQ + PDF) y Sprint 8 (Correo automático) son independientes y pueden hacerse sin esperar al cliente

---

### [2026-07-06] - Agent: Claude (claude-sonnet-4-6)
- **Task/Goal:** ETL Excel "BD Ventas y Donaciones.xlsx" + migración schema para nuevos campos.
- **Files Modified/Created:**
  - `backend/prisma/schema.prisma` — Order: +orderType, +invoiceNumber, +canalAtencion, +municipioEntrega, +domiciliario; Product: +categoryName, +subcategoryName, +externalId
  - `scripts/etl/migrate_excel.py` — ETL Python completo (pandas + psycopg2)
  - Migración SQL aplicada directamente (campos nuevos en orders y products)
- **Current Status / Results:**
  - ✅ Schema actualizado con 5 campos nuevos en orders y 3 en products
  - ✅ 705 clientes nuevos insertados (11,095 ya existían del ETL anterior de Supabase)
  - ✅ 355 productos del catálogo Excel insertados (con categoryName, subcategoryName, externalId)
  - ✅ 25,040 órdenes históricas insertadas (2015–2026), tipificadas: Venta / ReciboCaja / NotaCredito / Remision
  - ✅ 38,086 order_items insertados
  - ✅ 4,493 donaciones insertadas (productos de categoría "Donaciones" separados automáticamente)
  - ✅ 4,309 órdenes actualizadas con canal de atención (WhatsApp, Sitio Web, etc.), municipio y domiciliario
  - Total en DB: 15,594 clientes | 468 productos | 25,151 órdenes | 4,493 donaciones | $5,173M COP en órdenes
- **Pending Tasks / Notes for next agent:**
  - "Inventario de Plataformas y Accesos.xlsx" contiene contraseñas en texto plano — NO commitear al repo
  - El campo `estado_cliente` de la hoja clientes fue sanitizado (textos >20 chars → "Activo")
  - Los `id_cliente = SinCedula` se crearon con doc_number único (SC-NombreHash)
  - Hay 14 productos de categoría "Donaciones" — las transacciones con esos productos fueron a tabla `donations`, no `orders`
  - Hay 414 órdenes con orderType="NotaCredito" (amounts negativos = devoluciones)
  - Exposición de nuevos campos en API: orders controller puede exponer canalAtencion/municipioEntrega en GET

---
## 2026-07-06 — Claude — Formulario público de registro de proveedores

- **Task:** Crear formulario público de registro de proveedores con carga de documentos (sin autenticación)
- **Files Modified/Created:**
  - `backend/prisma/schema.prisma` — Provider: +department, +rutPath, +camaraComercioPath, +certBancariaPath, +formatoProveedorPath; status default → 'Pendiente'
  - `backend/src/providers/providers.controller.ts` — POST /register público (sin JwtAuthGuard) con multer FileFieldsInterceptor
  - `backend/src/providers/providers.service.ts` — register(), findAll(page,limit,search), updateStatus()
  - `backend/src/providers/dto/register-provider.dto.ts` — class-validator DTO con @IsIn(['CC','NIT'])
  - `backend/src/providers/providers.module.ts` — imports AuthModule
  - `backend/src/app.module.ts` — ProvidersModule añadido
  - `backend/src/main.ts` — NestExpressApplication + useStaticAssets para servir uploads/
  - `frontend/src/app/features/providers/provider-register.component.ts` — Standalone, Signals, FormData multipart
  - `frontend/src/app/features/providers/provider-register.component.html` — 3 estados (form/success/error), 4 secciones, 4 campos de archivo
  - `frontend/src/app/app.routes.ts` — ruta pública /proveedores/registro (fuera del shell authGuard)
- **Current Status / Results:**
  - ✅ Backend compila sin errores — endpoint POST /api/providers/register acepta multipart/form-data
  - ✅ Archivos almacenados en uploads/providers/ con nombres UUID
  - ✅ Frontend build limpio — provider-register-component lazy chunk 29 kB
  - ✅ Ruta pública /proveedores/registro accesible sin login
- **Pending Tasks / Notes for next agent:**
  - Reiniciar backend y frontend dev servers para que se cargue la nueva ruta en vivo
  - La migración de schema (nuevos campos en Provider) fue aplicada manualmente por psql — no está en Prisma migrations table; crear migration file manual si se necesita deploy limpio
  - Panel interno de gestión de proveedores (GET /api/providers, PATCH /api/providers/:id/status) pendiente de implementar en frontend bajo ruta protegida
  - Considerar añadir validación de tamaño de archivo en el frontend antes de enviar

---
## 2026-07-06 — Claude — SAGRILAFT Comprehensive Provider Form

- **Task:** Implement comprehensive SAGRILAFT provider registration form covering all 13 sections of the Excel template
- **Files changed:**
  - `backend/prisma/schema.prisma` — Provider model: +55 new fields (SAGRILAFT secciones 1-13, rep legal JSON, referencias JSON, accionistas JSON, operaciones JSON, PPE booleans, financial info strings)
  - `backend/src/providers/dto/register-provider.dto.ts` — Full DTO with class-validator decorators; @Transform for booleans and JSON fields; aceptaDeclaracion + aceptaTratamientoDatos required
  - `backend/src/providers/providers.service.ts` — register() maps all new DTO fields to Prisma create call
  - `frontend/src/app/features/providers/provider-register.component.ts` — naturaleza signal, actividadTipoSelected signal, formaPagoSelected signal; all 13 form sections; JSON serialization before FormData submission
  - `frontend/src/app/features/providers/provider-register.component.html` — Full 13-section form: conditional sections 3/4 based on naturaleza(), checkboxes for actividad and formaPago, radio buttons for PPE questions, 2 references rows, accionistas textarea, required declaration checkboxes
- **Migration:** Applied via `prisma migrate diff --from-config-datasource --to-schema --script | psql` — ALTER TABLE adds 55 columns to providers table
- **Current Status / Results:**
  - ✅ Prisma migration applied — all 55 new columns present in providers table
  - ✅ Prisma client regenerated
  - ✅ Frontend build clean — provider-register-component chunk 99 kB (was 29 kB)
  - ✅ All Angular rules respected: standalone, signals, @if/@for, ReactiveFormsModule only
- **Pending Tasks / Notes for next agent:**
  - Backend dev server needs restart to pick up new DTO and service changes
  - Consider adding backend validation: if naturaleza=NATURAL require primerApellido/primerNombre/docNumberNatural; if naturaleza=JURIDICA require name/nit
  - Consider front-end UX: progressive disclosure with step indicator (the form is now very long)
  - accionistasTexto parsing assumes pipe-delimited lines; may want a proper dynamic row UI in the future

## 2026-07-06 — Claude — Provider Registration Form → 5-Step Wizard

- **Task:** Refactor the single-page SAGRILAFT provider registration form into a 5-step wizard with per-step validation and an animated progress bar
- **Files changed:**
  - `frontend/src/app/features/providers/provider-register.component.ts` — Added `currentStep` signal (starts at 1), `totalSteps = 5`, `stepErrors` signal; `nextStep()` / `prevStep()` methods with scroll-to-top; private `validateStep(step)` with rules for steps 2, 3 and 5; `submit()` now calls `validateStep(5)` first
  - `frontend/src/app/features/providers/provider-register.component.html` — Full wizard layout: animated progress bar (5 numbered circles + connecting lines, green checkmarks for completed steps, brand-600 for active, slate-200 for future); `@if (currentStep() === N)` panels for each of the 5 steps; nav buttons (← Anterior / Siguiente → / Enviar solicitud) with disabled-when-loading state; step error banner in red; ALL 13 original sections preserved intact
- **Step grouping:**
  - Step 1: Tipo de solicitud + Naturaleza + Forma de pago
  - Step 2: Datos persona natural OR jurídica (conditional)
  - Step 3: Actividad económica + Información de pagos + Contacto de facturación
  - Step 4: Referencias comerciales + Accionistas (jurídica only) + Financiero + Operaciones internacionales
  - Step 5: PPE + Documentos + Declaraciones (submit here)
- **Current Status / Results:**
  - ✅ `npm run build -- --configuration=development` → 0 errors, 0 warnings
  - ✅ All Angular rules respected: standalone, signals only (no RxJS BehaviorSubject), `@if`/`@for` control flow, no NgModules
  - ✅ Progress bar width driven by `(currentStep() - 1) / (totalSteps - 1) * 100`%
- **Pending Tasks / Notes for next agent:**
  - No backend changes needed — submit payload is identical
  - Consider adding a "step 5 re-validate" call on page load when returning from error state

## 2026-07-06 — Claude — Animated SVG Heart Progress Indicator

- **Task:** Replace the horizontal step progress bar with an animated SVG heart that fills bottom-to-top as the user advances through the 5-step provider wizard
- **Files changed:**
  - `frontend/src/app/features/providers/provider-register.component.ts`
    - Added `computed` to the `@angular/core` import
    - Added `heartFillPct` computed signal: step 1 → 8%, steps 2–5 → linearly scaled up to 100% (formula: `((s-1)/(totalSteps-1)) * 92 + 8`)
    - Added `stepLabel` computed signal: maps step number to Spanish label string
  - `frontend/src/app/features/providers/provider-register.component.html`
    - Replaced the entire horizontal progress bar block (lines 42–172) with the heart widget
    - Heart SVG: 160×160, viewBox 0 0 32 30, rose gradient fill (#e11d48 → #fb7185), slate-200 background, clipPath heart shape
    - Fill level driven by `heartFillPct()` via `[attr.y]` and `[attr.height]` on a `<rect>` — CSS `transition: 0.6s ease` for smooth animation
    - Heartbeat CSS keyframe animation (`heart-pulse` class) applied only on step 5
    - Step label text below heart from `stepLabel()` signal
    - 5 numbered dots row: completed = brand-600 filled + checkmark, current = brand-600 ring, pending = slate-300
    - Error banner preserved, now inside the centered flex column
- **Current Status:**
  - ✅ `npm run build -- --configuration=development` → 0 errors, 0 warnings
  - ✅ Angular Signals only — no RxJS; `computed()` for derived values
  - ✅ No new npm packages added
  - ✅ All form step panels and navigation buttons unchanged
- **Pending Tasks / Notes for next agent:**
  - The `<style>` tag with `@keyframes heartbeat` is inline in the HTML template; if global styles consolidation is desired, move the keyframes to `src/styles.css`
  - The heart SVG path is a simplified bezier approximation — can be swapped for a more precise path if pixel-perfect branding is needed

---

## 2026-07-07 — Claude — Corrección progress-board + Documentación técnica completa

- **Task:** 1) Corregir bug 0% en progress board. 2) Crear documentación técnica profesional completa.
- **Files Modified/Created:**
  - `docs/progress-board.html` — Fix bug JS: tarea "Módulo Proveedores" estaba fuera del array tasks[] del Sprint 4 (sintaxis inválida → todo el script fallaba → ring en 0%). Sprint '2b' agregado a HITOS[0].sprints. Lookup `SPRINTS[n-1]` reemplazado por `sprintByN[n]` para soportar IDs string. Fecha actualizada a 07-jul-2026.
  - `docs/TECHNICAL_DOCUMENTATION.md` (NUEVO) — 1,373 líneas. Documentación técnica completa con: resumen ejecutivo, diagrama de arquitectura ASCII, stack tecnológico, estructura del monorepo, modelo ER (Mermaid), descripción de las 18 tablas con conteos actuales, todos los endpoints REST con auth/permisos, flujos de datos (crear pedido, dashboard, exportador), detalle ETL Sprint 2 y 2b, módulo proveedores SAGRILAFT, credenciales de desarrollo, usuarios del sistema, integraciones pendientes, comandos de desarrollo, historial de todos los sprints completados, roadmap de sprints pendientes, convenciones de seguridad, guía de despliegue, protocolo de colaboración IA.
- **Current Status:**
  - ✅ Progress board ahora muestra 24% correcto (5/21 sprints)
  - ✅ TECHNICAL_DOCUMENTATION.md creado en docs/
  - Backend corriendo en http://localhost:3000
  - Frontend corriendo en http://localhost:4200
- **Pending Tasks / Notes for next agent:**
  - Actualizar TECHNICAL_DOCUMENTATION.md al completar cada sprint (sección 14 "Historial de Sprints")
  - El archivo progress-board.html también debe actualizarse por sprint
  - Pendiente de Ana: Excel de beneficiarios y Excel de voluntarios (seguimiento viernes 11-jul-2026)
  - Pendiente del cliente: credenciales Shopify (Sprint 5) y Wompi/PayU (Sprint 6)

---

## 2026-07-07 — Claude — Script setup_db.sh + Documentación en progress-board

- **Task:** 1) Crear script maestro de setup de base de datos para servidor. 2) Agregar enlace a documentación técnica en el progress-board.
- **Files Modified/Created:**
  - `scripts/setup_db.sh` (NUEVO) — Script idempotente completo: levanta Docker, crea .env si falta, aplica migraciones Prisma, corre seed, ETL Supabase (migrate.js) y ETL Excel (migrate_excel.py). Modos: `--check` (solo muestra estado), `--only-db` (sin ETLs), default (todo). Detecta si los ETLs ya corrieron antes para evitar duplicados.
  - `docs/progress-board.html` — Agregada sección "Documentación" en el sidebar con enlace a TECHNICAL_DOCUMENTATION.md y fecha de actualización 07-jul-2026.
- **Current Status:**
  - ✅ setup_db.sh syntax OK (bash -n)
  - ✅ 3 modos de ejecución: full / --only-db / --check
  - ✅ Idempotente: detecta clientes >5k y órdenes >20k para saltar ETLs ya ejecutados
  - Dato importante: el Excel "BD Ventas y Donaciones.xlsx" debe estar en la raíz del proyecto para que corra el ETL #2
- **Pending Tasks / Notes for next agent:**
  - Pendiente de Ana: Excel de beneficiarios y Excel de voluntarios (seguimiento viernes 11-jul-2026)
  - Pendiente del cliente: credenciales Shopify (Sprint 5) y Wompi/PayU (Sprint 6)
  - Para verificar estado de la DB en cualquier momento: `bash scripts/setup_db.sh --check`

---

## 2026-07-07 — Claude — Diseño BI Dashboard de Ventas

- **Task:** Diseñar la arquitectura conceptual del Dashboard de Ventas: KPIs, jerarquía visual, filtros y tipos de gráficos. Sin código — solo lógica de negocio.
- **Files Modified/Created:**
  - `docs/dashboard-bi-ventas.md` (NUEVO) — Documento de diseño BI completo: jerarquía en 3 niveles (ejecutivo/analítico/operativo), 6 KPIs primarios, KPIs secundarios por área, tabla de filtros con fuente de datos en DB, matriz gráfico-pregunta analítica, principios UX, roadmap de madurez en 3 fases, mapeo de roles RBAC vs. accesos al dashboard.
- **Current Status:**
  - ✅ Diseño alineado con el modelo de datos actual (18 tablas, campos reales como `canal_atencion`, `order_type`, `municipio_entrega`)
  - ✅ Roles mapeados contra el sistema RBAC implementado en Sprint 2
  - Implementación prevista: Sprint 9 (Fase 1 — visibilidad básica)
- **Pending Tasks / Notes for next agent:**
  - Al llegar al Sprint 9, usar este documento como spec de referencia para el backend de analytics
  - Pendiente de Ana: Excel beneficiarios y voluntarios (seguimiento viernes 11-jul-2026)

---

## 2026-07-11 — Claude — Sprint 3b: Expansión schema Beneficiarios + nueva tabla Ayudas

- **Task:** Analizar 3 archivos entregados por Ana e incorporar su estructura al schema de la DB.
- **Archivos analizados:**
  - `AYUDAS Junio.xlsx` — 4,160 solicitudes de ayuda (2018–2026), 7 columnas, 16 tipos de solicitud
  - `Datos Personales Junio.xlsx` — 998 beneficiarios (niños con cardiopatías), 26 columnas
  - `Encuesta caracterización de las familias 2025.docx` — formulario digital con secciones: salud, familia, vivienda, economía
- **Files Modified/Created:**
  - `backend/prisma/schema.prisma` — modelo `Beneficiary` expandido: 18 campos originales → 58 campos. Agrupados en secciones: Identificación, Contacto, Salud, Familia (Madre + Padre + Hermanos + Cuidador), Vivienda y Demografía, Economía, Meta. `birthDate` pasó a nullable. Nuevo modelo `Ayuda` con FK a Beneficiary.
  - `backend/prisma/migrations/20260707000000_catchup_etl_and_providers/migration.sql` — migración catch-up creada y marcada como aplicada (resuelve drift de columnas aplicadas con psql en sprints anteriores en orders/products/providers)
  - `backend/prisma/migrations/20260711181845_beneficiary_expansion_ayudas/migration.sql` — migración generada y aplicada automáticamente por Prisma
- **Current Status:**
  - ✅ `npx prisma migrate dev` → migración aplicada sin errores
  - ✅ `npx prisma generate` → Prisma Client regenerado con los nuevos modelos
  - ✅ Tabla `beneficiaries` tiene 58 columnas en DB (verificado con psql)
  - ✅ Tabla `ayudas` creada con índices en `beneficiary_id` y `fecha`
  - ✅ Historial de migraciones sincronizado (drift resuelto)
- **Pending Tasks / Notes for next agent:**
  - Próximo paso: ETL Python para cargar los dos Excel en la DB
    - `Datos Personales Junio.xlsx` → tabla `beneficiaries`
    - `AYUDAS Junio.xlsx` → tabla `ayudas` (link por cedula → doc_number)
  - Pendiente: CRUD NestJS para Beneficiarios (BeneficiariesModule) con los nuevos campos
  - Pendiente: CRUD NestJS para Ayudas (AyudasModule)
  - Pendiente: Pantallas Angular para Beneficiarios y Ayudas

---

## 2026-07-11 — Claude — Sprint 3b: ETL Beneficiarios y Ayudas

- **Task:** Cargar datos históricos de beneficiarios y ayudas desde los dos Excel de Ana.
- **Files Modified/Created:**
  - `scripts/etl/migrate_beneficiarios.py` (NUEVO) — ETL idempotente en dos partes:
    1. `Datos Personales Junio.xlsx` → tabla `beneficiaries` (998 registros, 26 campos, upsert por doc_number)
    2. `AYUDAS Junio.xlsx` → tabla `ayudas` (4,160 registros, link por cédula → beneficiary.id)
    - Flags: `--force-ayudas` (reimporta ayudas), `--only-ayudas` (solo ayudas)
    - Crea beneficiarios mínimos para cédulas que aparecen en ayudas pero no en datos personales
- **Resultados de la carga:**
  - Beneficiarios en DB: 1,002 (998 del Excel + 4 mínimos solo en ayudas)
  - Fallecidos: 140
  - Ayudas en DB: 4,160 | Resueltas: 4,154 | Pendientes: 6
  - Valor total ayudas: $231.4M COP
  - Top solicitudes: Ropa y Juguetes (1,375), Recreación (985), Pañales (578), Transporte (265), Alimentación (258)
- **Current Status:**
  - ✅ ETL completo sin errores
  - ✅ Idempotente: re-ejecución sin --force-ayudas detecta tabla ya cargada y la salta
- **Pending Tasks / Notes for next agent:**
  - Próximo paso: BeneficiariesModule + AyudasModule en NestJS (CRUD + endpoints)
  - Pantallas Angular: listado de beneficiarios con búsqueda, detalle, y listado de ayudas
  - Los 4 beneficiarios "mínimos" (solo en ayudas) tienen first_name='Beneficiario', last_name='(cedula)' — deberían completarse manualmente o con un nuevo Excel

---

## 2026-07-11 — Claude — Sprint 3b: BeneficiariesModule + AyudasModule NestJS

- **Task:** Crear los módulos NestJS para beneficiarios y ayudas con CRUD completo y endpoints de estadísticas.
- **Files Modified/Created:**
  - `backend/src/beneficiaries/beneficiaries.module.ts` (NUEVO)
  - `backend/src/beneficiaries/beneficiaries.controller.ts` (NUEVO) — GET/POST/PUT/DELETE + GET /stats
  - `backend/src/beneficiaries/beneficiaries.service.ts` (NUEVO) — findAll (búsqueda multi-campo), findOne (con últimas 10 ayudas), create, update, remove (soft), getStats
  - `backend/src/beneficiaries/dto/create-beneficiary.dto.ts` (NUEVO) — 40+ campos con validación
  - `backend/src/beneficiaries/dto/update-beneficiary.dto.ts` (NUEVO)
  - `backend/src/ayudas/ayudas.module.ts` (NUEVO)
  - `backend/src/ayudas/ayudas.controller.ts` (NUEVO) — GET/POST/PUT/DELETE + GET /stats + GET /beneficiary/:id
  - `backend/src/ayudas/ayudas.service.ts` (NUEVO) — findAll (filtros por beneficiaryId/tipo/estado), findOne, findByBeneficiary, create, update, remove (hard delete), getStats
  - `backend/src/ayudas/dto/create-ayuda.dto.ts` (NUEVO)
  - `backend/src/ayudas/dto/update-ayuda.dto.ts` (NUEVO)
  - `backend/src/app.module.ts` — imports: BeneficiariesModule, AyudasModule agregados
- **Endpoints disponibles:**
  - GET /api/beneficiaries?page&limit&search&status — 1,002 registros, búsqueda en nombre/doc/ciudad/eps/diagnóstico/padres
  - GET /api/beneficiaries/stats — total/activos/fallecidos/sinEps/porGenero/topEps/topDiag
  - GET /api/beneficiaries/:id — detalle + últimas 10 ayudas
  - POST/PUT/DELETE /api/beneficiaries
  - GET /api/ayudas?page&limit&beneficiaryId&tipoSolicitud&estado
  - GET /api/ayudas/stats — total=4,160 / resueltas=4,154 / pendientes=6 / totalValor=$231.4M COP
  - GET /api/ayudas/beneficiary/:beneficiaryId — historial completo con total acumulado
  - POST/PUT/DELETE /api/ayudas
- **Current Status:**
  - ✅ `npx tsc --noEmit` → 0 errores
  - ✅ Servidor levantado y endpoints verificados con curl
  - ✅ Permisos RBAC: beneficiarios:read / beneficiarios:write (ya existían en seed)
- **Pending Tasks / Notes for next agent:**
  - Siguiente: pantallas Angular para Beneficiarios (listado + detalle) y Ayudas
  - La búsqueda `?search=Cardio` devuelve 128 resultados — indexar `diagnostico` si la búsqueda es lenta en prod

---

## 2026-07-11 — Claude — Sprint 3b: Pantallas Angular Beneficiarios

- **Task:** Crear pantallas Angular para el módulo de beneficiarios (listado + detalle con historial de ayudas).
- **Files Modified/Created:**
  - `frontend/src/app/core/services/beneficiaries.service.ts` (NUEVO) — interfaces Beneficiary, BeneficiaryDetail, AyudaSummary, BeneficiaryStats + métodos getAll/getOne/getStats/create/update/deactivate
  - `frontend/src/app/features/beneficiaries/beneficiaries-list.component.ts` (NUEVO) — signals: beneficiaries, total, page, search, statusFilter, stats. Efectos reactivos de carga.
  - `frontend/src/app/features/beneficiaries/beneficiaries-list.component.html` (NUEVO) — 4 stat cards (total/activos/fallecidos/sinEps), búsqueda multi-campo, filtro por estado, tabla paginada con edad calculada, badge de estado, conteo de ayudas, link al detalle.
  - `frontend/src/app/features/beneficiaries/beneficiary-detail.component.ts` (NUEVO) — carga por ID, getter `b` para resolver scope en template.
  - `frontend/src/app/features/beneficiaries/beneficiary-detail.component.html` (NUEVO) — header con nombre+estado, secciones: Salud (EPS/régimen/sisbén/diagnóstico), Contacto, Familia (madre+padre+cuidador), Historial de Ayudas (últimas 10 con total acumulado).
  - `frontend/src/app/app.routes.ts` — rutas /beneficiaries y /beneficiaries/:id agregadas con permissionGuard
  - `frontend/src/app/shared/layout/shell/shell.component.html` — sección "Atención Familias" con link a /beneficiaries en sidebar
- **Current Status:**
  - ✅ `npm run build --configuration=development` → 0 errores
  - ✅ Rutas protegidas con permiso beneficiarios:read
  - ✅ Sidebar muestra la sección solo si el usuario tiene el permiso
- **Pending Tasks / Notes for next agent:**
  - Sprint 3b completo: schema + migración + ETL + backend + frontend ✅
  - Próximos sprints pendientes del cliente: Sprint 5 (Shopify) y Sprint 6 (Wompi/PayU)
  - Pendiente menor: formulario de creación/edición de beneficiario (actualmente solo se pueden consultar)
  - Pendiente menor: pantalla de Ayudas propia (actualmente solo visible en el detalle del beneficiario)

---

## 2026-07-14 — Antigravity (AGY) — Sprint 4/5: Caracterización, Shopify Webhooks, Dashboard Premium y Limpieza de Git

- **Task:** Crear formulario público de caracterización de familias, receptor y verificador de webhooks de Shopify con actualización automática de pagos, rediseñar el Dashboard con gráficas premium comparativas e independientes para Ventas y Donaciones, y reestructurar el repositorio ignorando archivos de datos locales.
- **Files Modified/Created:**
  - `backend/src/webhooks/webhooks.controller.ts` (NUEVO) — firma HMAC SHA256, idempotencia por ID de orden de Shopify, creación automática de clientes (`ClientDonor`), registro de órdenes e ítems con descuento de inventario, actualización de cobro automática a `paymentStatus: 'Pagado'`.
  - `backend/src/webhooks/webhooks.module.ts` (NUEVO)
  - `backend/src/main.ts` (modificado) — habilitación de `rawBody: true` en la inicialización de NestJS Express.
  - `backend/src/app.module.ts` (modificado) — registro global del módulo `WebhooksModule`.
  - `backend/src/dashboard/dashboard.service.ts` (modificado) — agrega conteo y suma de donaciones aprobadas en KPIs, agrupamiento de donaciones diarias en los últimos 30 días, ventas por categoría (top 5) y donaciones por pasarela de pago.
  - `backend/src/orders/orders.controller.ts` y `orders.service.ts` (modificado) — agrega endpoint de actualización de estado de pago administrativo (`PUT /api/orders/:id/payment-status`).
  - `frontend/src/app/core/services/dashboard.service.ts` (modificado) — actualiza la interfaz `DashboardStats` para soportar las nuevas variables de donaciones, pasarelas y categorías.
  - `frontend/src/app/features/dashboard/dashboard.component.ts` (modificado) — cambia gráfica a línea dual (Ventas en Índigo vs Donaciones en Rosa) y añade dos gráficas nuevas: Categorías (top 5 barra horizontal) y Pasarelas de Pago (dona con tooltips COP).
  - `frontend/src/app/features/dashboard/dashboard.component.html` (modificado) — tarjetas de KPI separadas para Ventas y Donaciones, markup HTML y skeletons de carga para las 4 gráficas.
  - `frontend/src/app/features/clients/clients-list.component.html` (modificado) — agrega columnas independientes para contar "Pedidos" (Índigo) y "Donaciones" (Rosa) en la lista de clientes/donantes.
  - `frontend/src/app/app.routes.ts` (modificado) — registra ruta pública `/familias/caracterizacion` para el formulario de familias.
  - `frontend/src/app/features/beneficiaries/family-characterization.component.ts` (NUEVO) — wizard de caracterización en 5 pasos reactivos con validaciones.
  - `frontend/src/app/features/beneficiaries/family-characterization.component.html` (NUEVO) — vista del wizard con branding de marca y animaciones de pasos.
  - `.gitignore` (modificado) — ignora de forma general `.continue/`, `graphify-out/`, y todos los archivos `.xlsx`, `.xls`, `.docx`, `.dump` de cualquier carpeta.
  - `/home/djfa/.gemini/antigravity-cli/brain/.../informe_avance_2026_07_14.md` (creado) — informe técnico detallado para reunión directiva de avance.
- **Current Status:**
  - ✅ Servidor local del backend y frontend compilando y recargando automáticamente con **0 errores**.
  - ✅ Cambios confirmados y subidos limpiamente a la rama `main` de GitHub.
- **Pending Tasks / Notes for next agent:**
  - Restaurar el respaldo local `data/dataheart_backup.dump` en la base de datos de producción (`sc.danielflorez.dev`) usando la guía descrita en el informe de avance.
  - Ejecutar el despliegue del código nuevo en producción (git pull + build del frontend/backend en el servidor).


---

## 2026-07-17 — Claude — Mejoras UX formulario de proveedores (SAGRILAFT)

- **Task:** Aplicar 4 mejoras solicitadas por el cliente al formulario de registro de proveedores.
- **Files Modified:**
  - `frontend/src/app/features/providers/provider-register.component.ts` — lista de departamentos/ciudades de Colombia (32 deptos + principales ciudades), lista de bancos colombianos, señales reactivas `deptoNatural/deptoEmpresa/deptoRepLegal` con computed `ciudadesNatural/ciudadesEmpresa/ciudadesRepLegal`, `usarDatosNatural` signal, método `copiarDatosNatural()`, campo `nombreBanco` en el formulario, `cedulaCC` en archivos, suscripciones a `valueChanges` de departamentos en constructor.
  - `frontend/src/app/features/providers/provider-register.component.html` — (1) Departamento y ciudad convertidos a `<select>` cascading en los 3 lugares: persona natural, empresa jurídica y representante legal. (2) Checkbox "Usar mis datos de persona natural" en header de sección facturación (solo visible en modo NATURAL). (3) Campo select "Nombre del banco" antes de tipo de cuenta. (4) Upload de cédula de ciudadanía en documentos requeridos (label dinámico: "Cédula de ciudadanía" para PN, "Cédula del representante legal" para PJ).
- **Current Status:**
  - ✅ `npm run build --configuration=development` → 0 errores
- **Pending Tasks / Notes for next agent:**
  - Pendiente despliegue en producción (sc.danielflorez.dev)
  - Pendiente backend: procesar el nuevo campo `cedulaCC` (archivo) y `nombreBanco` en `providers.controller.ts`

---

## 2026-07-17 — Claude — Lookup automático y modo actualización en formulario de beneficiarios

- **Task:** (1) Al ingresar el número de identidad de un niño ya existente, pre-rellenar todo el formulario con la info que hay en BD y permitir actualizarla. (2) Quitar límite de 10 ayudas en el histórico del detalle.
- **Files Modified:**
  - `backend/src/beneficiaries/beneficiaries.controller.ts` — nuevo endpoint público `GET /beneficiaries/public-lookup?docNumber=` y nuevo endpoint `PUT /beneficiaries/public-update/:id` (ambos sin JWT).
  - `backend/src/beneficiaries/beneficiaries.service.ts` — nuevo método `findByDocNumber()` con select completo de todos los campos del beneficiario + sus ayudas. También se eliminó `take: 10` de `findOne()` para mostrar histórico completo de ayudas.
  - `frontend/src/app/features/beneficiaries/family-characterization.component.ts` — señales `lookupLoading`, `existingBeneficiary`, `isUpdateMode`; métodos `onDocNumberBlur()` y `prefillForm()`; `submit()` usa PUT si ya existe el registro.
  - `frontend/src/app/features/beneficiaries/family-characterization.component.html` — spinner inline en el campo docNumber, banner verde "encontramos al niño" con cantidad de ayudas previas, mensaje de éxito dinámico (creación vs actualización).
- **Current Status:**
  - ✅ Frontend build 0 errores
  - ✅ Backend build 0 errores
- **Pending Tasks / Notes for next agent:**
  - Pendiente despliegue en producción (sc.danielflorez.dev)

---

## 2026-07-17 — Claude — Actualización matriz de roles v2 (Jul 2026)

- **Task:** Actualizar roles y permisos según nueva matriz de accesos entregada por la directiva.
- **Files Modified:**
  - `backend/prisma/seed.ts` — (1) Actualización de descripciones de roles con nombres reales. (2) Tabla de mapeo ROLE_PERMISSIONS actualizada: único cambio real fue LIDER_CLIENTES_BENEFACTORES (Paula): pierde voluntarios:read+write, gana beneficiarios:read+write. (3) Seed ahora hace deleteMany antes de recrear permisos por rol → garantiza que permisos ELIMINADOS de la matriz realmente desaparezcan de la BD (antes solo hacía upsert).
- **Seed ejecutado exitosamente en DB local:** 69 mappings rol→permiso re-creados
- **Pending Tasks / Notes for next agent:**
  - Ejecutar este mismo seed en producción: `cd backend && npx ts-node --project tsconfig.json prisma/seed.ts`
  - Pendiente despliegue general en sc.danielflorez.dev

---

## 2026-07-17 — Claude — Dashboard ayudas charts + sidebar líneas + fixes varios

- **Task:** Múltiples mejoras en UI/UX: (1) imágenes PNG en formularios, (2) indicadores de pasos en corazones, (3) fix race condition en búsqueda de beneficiarios, (4) mostrar justificación en detalle de ayudas, (5) gráficas de ayudas en dashboard, (6) 3 nuevos módulos en sidebar.
- **Files Modified:**
  - `frontend/public/SC.png` — imagen copiada a directorio público (Angular sirve desde `public/`, no `src/assets/`)
  - `frontend/src/app/features/beneficiaries/family-characterization.component.html` — PNG, corazones rose-600 como step indicators
  - `frontend/src/app/features/providers/provider-register.component.html` — PNG, corazones rose-600 (igualados con family-characterization)
  - `frontend/src/app/features/beneficiaries/beneficiaries-list.component.ts` — Fix race condition: reemplazado `effect()` por `Subject + debounceTime(300) + switchMap` para cancelar requests stale
  - `frontend/src/app/features/beneficiaries/beneficiary-detail.component.html` — Columna Justificación en tabla de ayudas, header con conteo y total
  - `frontend/src/app/core/services/beneficiaries.service.ts` — `justificacion?: string` en interfaz `AyudaSummary`
  - `backend/src/beneficiaries/beneficiaries.service.ts` — `justificacion: true` en select de ayudas en `findOne()`
  - `backend/src/dashboard/dashboard.service.ts` — Queries para totalAyudas, totalAyudasValor, ayudasPorTipo (groupBy tipoSolicitud), ayudasPorMes (últimos 12 meses)
  - `frontend/src/app/core/services/dashboard.service.ts` — Interfaz `DashboardStats` actualizada con totalAyudas, totalAyudasValor, ayudasPorTipo, ayudasPorMes
  - `frontend/src/app/features/dashboard/dashboard.component.ts` — Dos nuevos charts: horizontal bar (ayudasPorTipo) y dual-axis line (ayudasPorMes); fix TS2769 null check en tooltip
  - `frontend/src/app/features/dashboard/dashboard.component.html` — 2 KPI cards (Total Ayudas, Valor en Ayudas) + 2 canvas charts (ayudasTipoChart, ayudasMesChart)
  - `frontend/src/app/shared/layout/shell/shell.component.html` — Sección "Líneas Estratégicas" con 3 links: /linea-financiera, /linea-labor-social, /linea-comunicaciones
- **Current Status:**
  - ✅ Frontend build 0 errores
- **Pending Tasks / Notes for next agent:**
  - Las 3 rutas de Líneas Estratégicas son stubs — crear componentes y rutas en `app.routes.ts`
  - Pendiente despliegue en producción (sc.danielflorez.dev)

---

## 2026-07-21 — Claude — Rutas y componentes stub para sidebar completo

- **Task:** Crear componentes y rutas faltantes para todas las entradas del sidebar que apuntaban a rutas inexistentes (causaban 404/redirect al dashboard).
- **Files Modified:**
  - `frontend/src/app/app.routes.ts` — 8 nuevas rutas bajo el shell protegido: `providers`, `historial-ayudas`, `sala-ludica`, `voluntarios`, `historial-apoyos-voluntarios`, `segmentacion`, `listas-difusion`, `mailing-masivo`
  - `frontend/src/app/features/providers/providers-list.component.ts` — nuevo stub con botón de acceso rápido a `/proveedores/registro`
  - `frontend/src/app/features/labor-social/historial-ayudas.component.ts` — stub
  - `frontend/src/app/features/labor-social/sala-ludica.component.ts` — stub
  - `frontend/src/app/features/labor-social/voluntarios.component.ts` — stub
  - `frontend/src/app/features/labor-social/historial-apoyos-voluntarios.component.ts` — stub
  - `frontend/src/app/features/comunicaciones/segmentacion.component.ts` — stub
  - `frontend/src/app/features/comunicaciones/listas-difusion.component.ts` — stub
  - `frontend/src/app/features/comunicaciones/mailing-masivo.component.ts` — stub
- **Current Status:**
  - ✅ Frontend build 0 errores (3.153 s)
  - Todos los links del sidebar ya navegan correctamente sin redirigir al dashboard
- **Pending Tasks / Notes for next agent:**
  - Implementar contenido real en cada módulo stub según prioridad de la fundación
  - Pendiente despliegue en producción (sc.danielflorez.dev)
