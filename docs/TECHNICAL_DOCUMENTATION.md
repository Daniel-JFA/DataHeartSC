# DataHeartSC — Documentación Técnica Oficial

> **Versión:** Sprint 5 (Semana 5) · Actualizado: 07-jul-2026  
> **Proyecto:** ERP/CRM personalizado para Fundación Infantil Santiago Corazón  
> **Estado:** 5 / 21 sprints completados · Hito 1 ✅ completado

---

## Tabla de Contenidos

1. [Resumen Ejecutivo](#1-resumen-ejecutivo)
2. [Arquitectura del Sistema](#2-arquitectura-del-sistema)
3. [Stack Tecnológico](#3-stack-tecnológico)
4. [Infraestructura y Entorno Local](#4-infraestructura-y-entorno-local)
5. [Base de Datos — Modelo Completo](#5-base-de-datos--modelo-completo)
6. [Backend — NestJS API](#6-backend--nestjs-api)
7. [Frontend — Angular 18](#7-frontend--angular-18)
8. [Autenticación y Control de Acceso (RBAC)](#8-autenticación-y-control-de-acceso-rbac)
9. [Flujos de Datos](#9-flujos-de-datos)
10. [ETL — Migración de Datos Históricos](#10-etl--migración-de-datos-históricos)
11. [Módulo de Proveedores (SAGRILAFT)](#11-módulo-de-proveedores-sagrilaft)
12. [Credenciales y Variables de Entorno](#12-credenciales-y-variables-de-entorno)
13. [Comandos de Desarrollo](#13-comandos-de-desarrollo)
14. [Historial de Sprints](#14-historial-de-sprints)
15. [Roadmap y Sprints Pendientes](#15-roadmap-y-sprints-pendientes)
16. [Seguridad y Convenciones](#16-seguridad-y-convenciones)
17. [Guía de Despliegue](#17-guía-de-despliegue)

---

## 1. Resumen Ejecutivo

**DataHeartSC** es un sistema ERP/CRM a medida que centraliza las operaciones de la Fundación Infantil Santiago Corazón. Reemplaza el flujo actual basado en Access/Excel, WhatsApp y herramientas desconectadas.

### Problema que resuelve

| Antes | Después (DataHeartSC) |
|---|---|
| Ventas registradas manualmente en Excel y WhatsApp | Formulario web con autocompletado CRM y validación automática |
| Histórico de 11 años en Access (2015–2026) | 15,594 clientes · 25,151 órdenes migradas a PostgreSQL |
| Exportación contable manual a World Office | Botón "Exportar" genera Excel en formato World Office directo |
| Donaciones rastreadas en hojas separadas | Módulo de donaciones con estados y pasarelas de pago |
| Sin control de acceso por roles | RBAC granular: 7 roles reales de la fundación + 14 permisos |
| Proveedores registrados en papel (SAGRILAFT) | Formulario web público de 5 pasos con carga de documentos |

### Datos en producción (al Sprint 5)

```
Clientes/Donantes : 15,594
Productos         : 468
Órdenes históricas: 25,151
Order Items       : 38,086+
Donaciones        : 4,493
Total facturado   : $5,173,739,408 COP (histórico 2015–2026)
```

---

## 2. Arquitectura del Sistema

### Diagrama de arquitectura general

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENTE (Browser)                        │
│                     Angular 18 SPA                              │
│                   http://localhost:4200                          │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTP/JSON  (Bearer JWT)
                             │ REST API  /api/*
┌────────────────────────────▼────────────────────────────────────┐
│                     BACKEND (NestJS v11)                        │
│                     http://localhost:3000                        │
│                                                                 │
│  ┌─────────┐ ┌──────────┐ ┌─────────┐ ┌──────────┐ ┌───────┐  │
│  │  Auth   │ │ Clients  │ │Products │ │  Orders  │ │Donati-│  │
│  │ /login  │ │ /clients │ │/products│ │ /orders  │ │ ons   │  │
│  └─────────┘ └──────────┘ └─────────┘ └──────────┘ └───────┘  │
│  ┌────────────┐ ┌─────────────────────────────────────────────┐ │
│  │ Dashboard  │ │     Providers  /api/providers               │ │
│  │/dashboard/ │ │  (público: /register · protegido: GET/PATCH)│ │
│  └────────────┘ └─────────────────────────────────────────────┘ │
│                                                                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │            Prisma ORM v7  ←→  PostgreSQL 16                │ │
│  └────────────────────────────────────────────────────────────┘ │
└────────────────────────────┬────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────┐
│               PostgreSQL 16 + PostGIS  (Docker)                 │
│                    localhost:5432                                │
│              Container: dataheart_postgres                      │
└─────────────────────────────────────────────────────────────────┘
```

### Flujo de request protegido

```
Browser ──POST /api/auth/login──► AuthController
                                    │ bcrypt.compare(password, hash)
                                    │ JwtService.sign({ sub, email, role, permissions[] })
                               ◄── { access_token, user }

Browser ──GET /api/orders (Bearer JWT)──► JwtAuthGuard
                                           │ verifica firma HS256
                                           ▼
                                         PermissionsGuard
                                           │ lee permissions[] del JWT
                                           │ compara con @RequirePermission('ventas:read')
                                           ▼ (403 si falta)
                                         OrdersController
                                           │
                                           ▼
                                         PrismaService ──► PostgreSQL
```

---

## 3. Stack Tecnológico

| Capa | Tecnología | Versión | Rol |
|---|---|---|---|
| **Frontend** | Angular | 18 | SPA — componentes standalone, Signals |
| **Frontend CSS** | Tailwind CSS | 3 | Utility-first styling |
| **Frontend Charts** | Chart.js | auto | Gráficos dashboard (bar + donut) |
| **Backend** | NestJS | 11 | API REST, modular, TypeScript |
| **ORM** | Prisma | 7 | Modelos, migraciones, cliente tipado |
| **Base de datos** | PostgreSQL | 16 + PostGIS | Almacenamiento principal + geodatos |
| **Auth** | JWT (HS256) | — | Tokens 8h, bcrypt salt 12 |
| **File upload** | Multer | — | Documentos proveedores (PDF/JPG/PNG) |
| **Containerización** | Docker | — | PostgreSQL local + PostGIS |
| **ETL** | Python + pandas + psycopg2 | 3.x | Migración histórico Access/Excel |
| **Package manager** | npm | — | Backend y frontend |

---

## 4. Infraestructura y Entorno Local

### Docker Compose

```yaml
# docker-compose.yml (raíz del proyecto)
services:
  postgres:
    image: postgis/postgis:16-3.4
    container_name: dataheart_postgres
    ports:
      - "5432:5432"
    environment:
      POSTGRES_USER: dataheart
      POSTGRES_PASSWORD: dataheart_dev_2026
      POSTGRES_DB: dataheart_sc
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U dataheart -d dataheart_sc"]
      interval: 5s
      retries: 5
```

### Estructura del monorepo

```
SC/
├── backend/                    # NestJS API
│   ├── prisma/
│   │   ├── schema.prisma       # 18 modelos de dominio
│   │   ├── seed.ts             # Seed: roles, permisos, usuarios
│   │   └── migrations/         # Historial de migraciones
│   ├── src/
│   │   ├── auth/               # JWT, bcrypt, guards, decoradores
│   │   ├── clients/            # CRM — ClientDonor CRUD
│   │   ├── dashboard/          # KPIs, gráficos, stats
│   │   ├── donations/          # Donaciones + estadísticas
│   │   ├── orders/             # Pedidos + Excel export
│   │   ├── prisma/             # PrismaService (singleton)
│   │   ├── products/           # Catálogo de productos
│   │   ├── providers/          # SAGRILAFT + multer upload
│   │   ├── app.module.ts
│   │   └── main.ts
│   ├── uploads/                # Archivos subidos por proveedores
│   │   └── providers/          # PDFs y documentos SAGRILAFT
│   └── prisma.config.ts        # DATABASE_URL (Prisma v7 quirk)
│
├── frontend/                   # Angular 18 SPA
│   └── src/app/
│       ├── core/
│       │   ├── guards/         # authGuard, permissionGuard
│       │   ├── interceptors/   # auth.interceptor (Bearer token)
│       │   └── services/       # AuthService, DashboardService, etc.
│       ├── features/
│       │   ├── auth/login/     # LoginComponent (público)
│       │   ├── clients/        # CRM — ClientsListComponent
│       │   ├── dashboard/      # DashboardComponent
│       │   ├── donations/      # DonationsListComponent
│       │   ├── orders/         # OrdersListComponent, OrderFormComponent
│       │   ├── products/       # ProductsListComponent
│       │   └── providers/      # ProviderRegisterComponent (público)
│       └── shared/layout/shell/ # ShellComponent (sidebar + router-outlet)
│
├── scripts/etl/
│   └── migrate_excel.py        # ETL histórico Access → PostgreSQL
│
├── docs/
│   ├── progress-board.html     # Dashboard de seguimiento de sprints
│   └── TECHNICAL_DOCUMENTATION.md  # Este archivo
│
├── docker-compose.yml
└── ai_cooperation_log.md       # Log de colaboración entre agentes IA
```

---

## 5. Base de Datos — Modelo Completo

### Diagrama Entidad-Relación

```mermaid
erDiagram
    Role {
        String id PK
        String name
        String description
    }
    Permission {
        String id PK
        String name
        String key_name
    }
    RolePermission {
        String role_id FK
        String permission_id FK
    }
    User {
        String id PK
        String email
        String password_hash
        String first_name
        String last_name
        String role_id FK
        Boolean is_active
        DateTime created_at
        DateTime updated_at
    }
    AuditLog {
        String id PK
        String user_id FK
        String action
        String ip_address
        String details
        DateTime timestamp
    }
    ClientDonor {
        String id PK
        String name
        String doc_type
        String doc_number
        String phone
        String email
        String address
        String city
        String status
        String historical_id
        DateTime created_at
    }
    Order {
        String id PK
        String client_id FK
        DateTime order_date
        String status
        Decimal total_amount
        String payment_status
        String source
        String order_type
        String invoice_number
        String canal_atencion
        String municipio_entrega
        String domiciliario
        String created_by_user_id FK
    }
    OrderItem {
        String id PK
        String order_id FK
        String product_id FK
        Int quantity
        Decimal unit_price
        Decimal subtotal
    }
    Product {
        String id PK
        String name
        String sku
        Int stock
        Int min_stock
        Decimal price
        Boolean is_active
        String category_name
        String subcategory_name
        String external_id
    }
    Donation {
        String id PK
        String client_id FK
        Decimal amount
        DateTime date
        String payment_gateway
        String transaction_id
        String status
        String campaign
        String concept
    }
    Certificate {
        String id PK
        String donation_id FK
        Int certificate_number
        DateTime issue_date
        String pdf_path
        String status
    }
    Input {
        String id PK
        String name
        Decimal stock
        Decimal min_stock
        String unit
    }
    ProductInput {
        String product_id FK
        String input_id FK
        Decimal quantity_required
    }
    Companion {
        String id PK
        String name
        Int stock
        Int min_stock
    }
    InventoryMovement {
        String id PK
        String item_type
        String product_id FK
        String input_id FK
        String companion_id FK
        String movement_type
        Decimal quantity
        String user_id FK
        DateTime movement_date
        String description
    }
    Beneficiary {
        String id PK
        String first_name
        String last_name
        String doc_type
        String doc_number
        DateTime birth_date
        String status
        DateTime enroll_date
    }
    Volunteer {
        String id PK
        String first_name
        String last_name
        String doc_type
        String doc_number
        String email
        String role
        String skills
        String status
    }
    Provider {
        String id PK
        String name
        String doc_type
        String doc_number
        String status
        Json rep_legal
        Json referencias
        Json accionistas
        Json operaciones
        String rut_path
        String camara_comercio_path
        String cert_bancaria_path
        DateTime created_at
    }

    Role ||--o{ User : "tiene"
    Role ||--o{ RolePermission : "tiene"
    Permission ||--o{ RolePermission : "en"
    User ||--o{ AuditLog : "genera"
    User ||--o{ Order : "crea"
    User ||--o{ InventoryMovement : "registra"
    ClientDonor ||--o{ Order : "realiza"
    ClientDonor ||--o{ Donation : "hace"
    Order ||--o{ OrderItem : "contiene"
    OrderItem }o--|| Product : "referencia"
    Donation ||--o{ Certificate : "genera"
    Product ||--o{ ProductInput : "usa"
    Input ||--o{ ProductInput : "en"
    Product ||--o{ InventoryMovement : "mueve"
    Input ||--o{ InventoryMovement : "mueve"
    Companion ||--o{ InventoryMovement : "mueve"
```

### Descripción de tablas

| Tabla | Registros actuales | Descripción |
|---|---|---|
| `roles` | 10 | Perfiles de acceso (7 reales + 3 técnicos) |
| `permissions` | 14 | Permisos granulares por módulo |
| `role_permissions` | 69 | Mapeo rol → permiso |
| `users` | 8 | Equipo de la fundación |
| `audit_logs` | — | Trazabilidad de acciones |
| `clients_donors` | **15,594** | Clientes y donantes unificados |
| `orders` | **25,151** | Pedidos históricos 2015–2026 |
| `order_items` | **38,086+** | Líneas de detalle por pedido |
| `products` | **468** | Catálogo completo |
| `donations` | **4,493** | Donaciones separadas del histórico |
| `certificates` | — | Certificados tributarios PDF (Sprint 7) |
| `inputs` | — | Insumos de producción (Sprint 17) |
| `product_inputs` | — | Recetas BOM (Sprint 17) |
| `companions` | — | Materiales complementarios |
| `inventory_movements` | — | Movimientos de inventario (Sprint 18) |
| `beneficiaries` | — | Niños beneficiarios (Sprint 9) |
| `volunteers` | — | Voluntarios (Sprint 13) |
| `providers` | — | Proveedores SAGRILAFT |

### Campos clave — Order (extendidos Sprint 2b)

| Campo | Tipo | Valores | Descripción |
|---|---|---|---|
| `status` | String | Recibido · En preparación · Despachado · Entregado · Cancelado | Estado del pedido |
| `payment_status` | String | Pendiente · Pagado · Cancelado | Estado de pago |
| `order_type` | String | Venta · ReciboCaja · NotaCredito · Remision · Historico | Tipo de transacción |
| `source` | String | Manual · Shopify · WhatsApp · Web | Canal de origen |
| `canal_atencion` | String | Sitio Web · WhatsApp · Tienda física · Correo · Interno · Frecuenti | Canal de atención |

---

## 6. Backend — NestJS API

### Endpoints disponibles

#### Auth

| Método | Ruta | Auth | Permiso | Descripción |
|---|---|---|---|---|
| `POST` | `/api/auth/login` | — | — | Login con email/password → JWT |

#### Dashboard

| Método | Ruta | Auth | Permiso | Descripción |
|---|---|---|---|---|
| `GET` | `/api/dashboard/stats` | JWT | `dashboards:read` | KPIs, pedidos por estado, ingresos 30d, pedidos recientes, stock bajo |

#### Clientes / Donantes

| Método | Ruta | Auth | Permiso | Descripción |
|---|---|---|---|---|
| `GET` | `/api/clients` | JWT | `segmentacion:read` | Lista paginada con búsqueda (`?search=&page=&limit=`) |
| `GET` | `/api/clients/:id` | JWT | `segmentacion:read` | Detalle de cliente |
| `POST` | `/api/clients` | JWT | `segmentacion:write` | Crear cliente |
| `PUT` | `/api/clients/:id` | JWT | `segmentacion:write` | Editar cliente |
| `DELETE` | `/api/clients/:id` | JWT | `segmentacion:write` | Soft delete |

#### Productos

| Método | Ruta | Auth | Permiso | Descripción |
|---|---|---|---|---|
| `GET` | `/api/products` | JWT | `inventario:read` | Lista con filtro `?onlyActive=true` |
| `GET` | `/api/products/:id` | JWT | `inventario:read` | Detalle de producto |
| `POST` | `/api/products` | JWT | `inventario:write` | Crear producto |
| `PUT` | `/api/products/:id` | JWT | `inventario:write` | Editar producto |
| `DELETE` | `/api/products/:id` | JWT | `inventario:write` | Soft delete |

#### Pedidos

| Método | Ruta | Auth | Permiso | Descripción |
|---|---|---|---|---|
| `GET` | `/api/orders` | JWT | `ventas_donaciones:read` | Lista paginada con filtros |
| `GET` | `/api/orders/export` | JWT | `ventas_donaciones:read` | Descarga Excel World Office |
| `GET` | `/api/orders/:id` | JWT | `ventas_donaciones:read` | Detalle con ítems |
| `POST` | `/api/orders` | JWT | `ventas_donaciones:write` | Crear pedido (total calculado en servidor) |
| `PUT` | `/api/orders/:id/status` | JWT | `ventas_donaciones:write` | Cambiar estado del pedido |

#### Donaciones

| Método | Ruta | Auth | Permiso | Descripción |
|---|---|---|---|---|
| `GET` | `/api/donations/stats` | JWT | `ventas_donaciones:read` | Totales por gateway y estado |
| `GET` | `/api/donations` | JWT | `ventas_donaciones:read` | Lista paginada |
| `GET` | `/api/donations/:id` | JWT | `ventas_donaciones:read` | Detalle |
| `POST` | `/api/donations` | JWT | `ventas_donaciones:write` | Registrar donación manual |
| `PATCH` | `/api/donations/:id/status` | JWT | `ventas_donaciones:write` | Cambiar estado |

#### Proveedores

| Método | Ruta | Auth | Permiso | Descripción |
|---|---|---|---|---|
| `POST` | `/api/providers/register` | **PÚBLICO** | — | Registro SAGRILAFT con archivos multipart |
| `GET` | `/api/providers` | JWT | `inventario:read` | Lista de proveedores registrados |
| `PATCH` | `/api/providers/:id/status` | JWT | `inventario:write` | Aprobar/rechazar proveedor |

### Estructura de módulo NestJS (patrón)

```
src/<feature>/
├── <feature>.module.ts      # imports: [PrismaModule, AuthModule]
├── <feature>.controller.ts  # @UseGuards(JwtAuthGuard, PermissionsGuard)
├── <feature>.service.ts     # lógica de negocio + Prisma queries
└── dto/
    └── <action>-<feature>.dto.ts  # class-validator + class-transformer
```

### Particularidad Prisma v7

```typescript
// prisma.config.ts — la URL NO va en schema.prisma
export default defineConfig({
  datasource: {
    url: process.env['DATABASE_URL'],
  },
});

// schema.prisma — sin url en datasource
datasource db {
  provider = "postgresql"
  // ← SIN url aquí. Agregarlo rompe las migraciones (error P1012)
}
```

---

## 7. Frontend — Angular 18

### Reglas obligatorias (no negociables)

```
✅ Standalone components — SIN NgModules
✅ Angular Signals (signal, computed, effect) — SIN RxJS BehaviorSubject
✅ Control flow moderno: @if, @for, @switch — SIN *ngIf, *ngFor
✅ Lazy loading: loadComponent: () => import(...) en todas las rutas
✅ HTTP calls solo en services — components son presentación pura
```

### Routing

```typescript
// app.routes.ts
export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },

  // PÚBLICO
  { path: 'login', loadComponent: () => import('./features/auth/login/login.component') },
  { path: 'proveedores/registro', loadComponent: () => import('./features/providers/provider-register.component') },

  // PROTEGIDO (authGuard + permissionGuard por subruta)
  {
    path: '',
    loadComponent: () => import('./shared/layout/shell/shell.component'),
    canActivate: [authGuard],
    children: [
      { path: 'dashboard', loadComponent: () => import('./features/dashboard/dashboard.component') },
      { path: 'clients',   loadComponent: ..., canActivate: [permissionGuard], data: { permission: 'segmentacion:read' } },
      { path: 'products',  loadComponent: ..., canActivate: [permissionGuard], data: { permission: 'inventario:read' } },
      { path: 'orders',    loadComponent: ..., canActivate: [permissionGuard], data: { permission: 'ventas_donaciones:read' } },
      { path: 'orders/new',loadComponent: ..., canActivate: [permissionGuard], data: { permission: 'ventas_donaciones:write' } },
      { path: 'donations', loadComponent: ..., canActivate: [permissionGuard], data: { permission: 'ventas_donaciones:read' } },
    ],
  },
];
```

### Environments

```typescript
// environment.development.ts
export const environment = { apiUrl: 'http://localhost:3000' };

// environment.ts (production)
export const environment = { apiUrl: '/api' };
```

### Auth Interceptor

```typescript
// core/interceptors/auth.interceptor.ts
// Agrega automáticamente: Authorization: Bearer <token>
// en TODAS las peticiones HTTP (excepto /api/auth/login)
```

### Diagrama de flujo de autenticación frontend

```
Usuario abre /dashboard
       │
       ▼
authGuard: ¿hay token en localStorage?
       │
    NO ┤──────────────────────────────► redirect → /login
       │                                    │
   SÍ ┤                                    ▼
       │                              LoginComponent
       ▼                              POST /api/auth/login
ShellComponent                             │
       │                              Guarda token
       ├─ permissionGuard ─► ¿tiene permiso?
       │       NO ──► redirect → /dashboard
       │       SÍ ──► renderiza ruta
       │
       ▼
  Sidebar dinámico (solo muestra
  secciones que el usuario puede ver
  según permissions[] del JWT)
```

### Arquitectura de estado (Signals)

```typescript
// Patrón de componente con Signals
export class MyComponent {
  private svc = inject(MyService);

  data    = signal<MyType | null>(null);   // estado
  loading = signal(true);                  // UI state
  error   = signal('');                    // errores

  // Estado derivado
  filteredData = computed(() =>
    this.data()?.filter(item => item.active)
  );

  ngOnInit() {
    this.svc.getAll().subscribe({
      next: d => { this.data.set(d); this.loading.set(false); },
      error: () => { this.error.set('Error cargando datos'); this.loading.set(false); }
    });
  }
}
```

---

## 8. Autenticación y Control de Acceso (RBAC)

### Roles del sistema

| Rol | Descripción | Persona |
|---|---|---|
| `DIRECTORA` | Solo lectura de todos los módulos | Luisa Muriel |
| `LIDER_DATA_HEART` | Acceso total (equivale a Admin funcional) | Ana María Betancourt |
| `ASISTENTE_CONTABLE` | Lectura + escritura contable y ventas | Alejandra Betancur |
| `CONTADORA` | Facturación + inventario (lectura) | Doris Giraldo |
| `LIDER_CLIENTES_BENEFACTORES` | CRM + ventas + donaciones | Paula Gómez |
| `LIDER_ATENCION_FAMILIAS` | Beneficiarios + voluntarios + comunicaciones | Marcela Gallego |
| `LIDER_COMUNICACIONES` | Dashboards + donaciones + comunicaciones | Megan David |
| `Admin` | Técnico — acceso total al sistema | admin@santiagocorazon.org |

### Permisos granulares (14 en total)

| `key_name` | Descripción |
|---|---|
| `dashboards:read` | Ver dashboards y reportes |
| `dashboards:write` | Gestionar dashboards y reportes |
| `segmentacion:read` | Ver CRM de clientes |
| `segmentacion:write` | Crear/editar clientes |
| `ventas_donaciones:read` | Ver pedidos y donaciones |
| `ventas_donaciones:write` | Crear pedidos y donaciones |
| `facturacion:read` | Ver facturación y recibos |
| `facturacion:write` | Gestionar facturación |
| `inventario:read` | Ver inventario y proveedores |
| `inventario:write` | Gestionar inventario |
| `beneficiarios:read` | Ver módulo de beneficiarios |
| `beneficiarios:write` | Gestionar beneficiarios |
| `voluntarios:read` | Ver módulo de voluntarios |
| `voluntarios:write` | Gestionar voluntarios |

### Mapa rol → permisos

```
DIRECTORA               → dashboards:read, segmentacion:read, ventas_donaciones:read,
                          facturacion:read, inventario:read, beneficiarios:read, voluntarios:read

LIDER_DATA_HEART        → TODOS los 14 permisos

ASISTENTE_CONTABLE      → dashboards:read, ventas_donaciones:read/write,
                          facturacion:read/write, segmentacion:read

CONTADORA               → dashboards:read, facturacion:read/write, inventario:read

LIDER_CLIENTES_BENEFACT → dashboards:read, segmentacion:read/write,
                          ventas_donaciones:read/write, beneficiarios:read

LIDER_ATENCION_FAMILIAS → dashboards:read, beneficiarios:read/write, voluntarios:read/write

LIDER_COMUNICACIONES    → dashboards:read/write, ventas_donaciones:read

Admin                   → TODOS los 14 permisos
```

### Flujo de validación de permiso (backend)

```
Request con JWT
      │
      ▼
JwtAuthGuard.canActivate()
  │  verifica firma + expiración
  │  extrae payload: { sub, email, role, permissions[] }
  │  inyecta en request.user
      │
      ▼
PermissionsGuard.canActivate()
  │  lee metadata @RequirePermission('modulo:accion')
  │  si no hay metadata → permite (solo requiere JWT válido)
  │  si hay metadata → verifica request.user.permissions.includes(required)
  │  ─── SÍ → continúa
  │  ─── NO → throw ForbiddenException(403)
      │
      ▼
Controller handler
```

### Estructura del JWT payload

```json
{
  "sub": "473314cd-7d98-4309-9acd-385d42e29b95",
  "email": "admin@santiagocorazon.org",
  "role": "Admin",
  "permissions": [
    "ventas_donaciones:read",
    "ventas_donaciones:write",
    "facturacion:read",
    "facturacion:write",
    "segmentacion:read",
    "segmentacion:write",
    "beneficiarios:read",
    "beneficiarios:write",
    "voluntarios:read",
    "voluntarios:write",
    "inventario:read",
    "inventario:write",
    "dashboards:read",
    "dashboards:write"
  ],
  "iat": 1783449527,
  "exp": 1783478327
}
```

---

## 9. Flujos de Datos

### Flujo: Crear pedido manual

```
Operador en frontend
       │
       ▼
OrderFormComponent
  ├─ Busca cliente: GET /api/clients?search=nombre → autocompletado
  ├─ Busca productos: GET /api/products?onlyActive=true
  ├─ Ajusta cantidades (+ / −)
  └─ Confirma pedido

       │  POST /api/orders { clientId, items: [{ productId, quantity }] }
       ▼
OrdersController
  │  @RequirePermission('ventas_donaciones:write')
  ▼
OrdersService.create()
  ├─ Prisma.$transaction([
  │    products.findMany({ where: { id: IN productIds } })
  │    → calcula subtotales con precio de DB (nunca del cliente)
  │    → calcula totalAmount en servidor
  │    orders.create({ ...order, items: { createMany: [...] } })
  │  ])
  └─ Retorna Order con ítems

       │
       ▼
Frontend muestra confirmación + redirige a /orders
```

### Flujo: Dashboard en tiempo real

```
DashboardComponent.ngOnInit()
  │  GET /api/dashboard/stats (Bearer JWT)
  ▼
DashboardService (backend)
  ├─ clientDonor.count()                    → totalClients
  ├─ clientDonor.count({ status:'Activo' }) → activeClients
  ├─ product.count()                        → totalProducts
  ├─ $queryRaw `SELECT COUNT(*) FROM products WHERE stock < min_stock`
  ├─ order.count()                          → totalOrders
  ├─ order.aggregate({ _sum: totalAmount }) → totalRevenue / paidRevenue
  ├─ order.groupBy(['status'])              → ordersByStatus
  ├─ $queryRaw `generate_series(NOW()-29d, NOW(), '1 day')
  │             LEFT JOIN orders ON date`   → revenueByDay (30 días continuos)
  ├─ order.findMany({ take:5, orderBy:desc })→ recentOrders
  └─ $queryRaw `WHERE stock < min_stock LIMIT 5` → lowStockItems

  ▼
{ kpis, ordersByStatus, revenueByDay, recentOrders, lowStockItems }
  │
  ▼
DashboardComponent
  ├─ 4 KPI cards (Clientes, Productos, Pedidos, Ingresos)
  ├─ Chart.js bar → revenueByDay
  ├─ Chart.js donut → ordersByStatus
  ├─ Tabla pedidos recientes
  └─ Cards stock bajo con barras de progreso
```

### Flujo: Exportador World Office

```
Operador hace clic en "Exportar a World Office"
       │  GET /api/orders/export
       ▼
OrdersController → OrdersService.exportToExcel()
  │
  ├─ order.findMany({ include: { client, items: { include: product } } })
  │
  ├─ ExcelJS.Workbook()
  │   ├─ Hoja 1: "Pedidos_WorldOffice"
  │   │  17 columnas: Fecha, N°Factura, Cliente, NIT,
  │   │               Producto, Cantidad, Precio, Subtotal,
  │   │               Total, Estado, Pago, Canal, Municipio,
  │   │               Domiciliario, Tipo, Source, Observaciones
  │   └─ Hoja 2: "Resumen"
  │      Total pedidos, Total ítems, Ingresos totales,
  │      Pagado, Pendiente, Período
  │
  └─ res.setHeader('Content-Disposition', 'attachment; filename=...')
     res.send(buffer)  → descarga automática en browser
```

---

## 10. ETL — Migración de Datos Históricos

### Sprint 2 — ETL Supabase → PostgreSQL

**Script:** Node.js ad-hoc  
**Resultado:** 14,839 clientes + 114 productos + 109 pedidos + 189 ítems  

```
Supabase (base anterior)
    │
    ▼  Script Node.js (idempotente — upsert por docNumber/sku)
    ▼
PostgreSQL dataheart_sc
    ├─ clients_donors: 14,839 registros
    ├─ products: 114 productos
    ├─ orders: 109 pedidos
    └─ order_items: 189 ítems
```

### Sprint 2b — ETL Excel/Access histórico (2015–2026)

**Script:** `scripts/etl/migrate_excel.py` (Python 3 + pandas + psycopg2)  
**Fuente:** `BD Ventas y Donaciones.xlsx` (4 hojas)  

```
BD Ventas y Donaciones.xlsx
├─ Hoja: clientes      → 705 clientes nuevos (11,095 ya existían)
├─ Hoja: productos     → 355 productos catálogo con categoryName/subcategoryName
├─ Hoja: ventas        → 25,040 órdenes (Venta/ReciboCaja/NotaCredito/Remision)
│                        4,309 órdenes con canalAtencion/municipio/domiciliario
└─ Hoja: donaciones    → 4,493 donaciones (productos cat. "Donaciones" separados)

Resultado total en DB:
  clients_donors : 15,594
  products       : 468
  orders         : 25,151
  order_items    : 38,086+
  donations      : 4,493
  Total facturado: $5,173,739,408 COP
```

#### Lógica de clasificación ETL

```python
# Una transacción se convierte en Donation si:
#   → el producto tiene categoryName == "Donaciones"
#   → se inserta en tabla donations (NO en orders)
#
# Tipos de orden según número de factura:
#   "FV FSC *"  → Venta
#   "RC *"      → ReciboCaja
#   "NC *"      → NotaCredito (monto negativo = devolución)
#   "REM *"     → Remision
#   Sin prefijo → Historico
#
# Cliente sin cédula:
#   doc_number = "SC-{hash(nombre)}"  (único, no duplica)
```

---

## 11. Módulo de Proveedores (SAGRILAFT)

### Descripción

Formulario **público** (sin autenticación) de registro de proveedores que implementa el Formato de Vinculación de Proveedores de la fundación, conforme a los requisitos SAGRILAFT.

Acordado con Ana María Betancourt Obando en reunión del 06-jul-2026.

### URL de acceso

```
http://localhost:4200/proveedores/registro  (desarrollo)
https://<dominio>/proveedores/registro       (producción)
```

### Estructura del wizard (5 pasos)

```
Paso 1: Información general
  ├─ Tipo de solicitud (Nuevo proveedor / Actualización)
  ├─ Naturaleza (Persona Natural / Jurídica)
  └─ Forma de pago y días de crédito

Paso 2: Datos de identificación
  ├─ [Si Natural] Nombres, apellidos, doc, expedición, residencia
  └─ [Si Jurídica] Razón social, NIT, teléfono, representante legal

Paso 3: Actividad económica + Pagos + Facturación
  ├─ Tipo de actividad + código CIIU + descripción
  ├─ Forma de pago (transferencia/cheque/efectivo) + cuenta bancaria
  └─ Contacto de facturación (nombre, cargo, teléfono, email)

Paso 4: Financiero + Referencias + Internacional
  ├─ Referencias comerciales (2 referencias)
  ├─ Accionistas (texto libre para personas jurídicas)
  ├─ Información financiera (activos, pasivos, patrimonio, ingresos/egresos)
  └─ Operaciones internacionales

Paso 5: PPE + Documentos + Declaraciones
  ├─ Preguntas PPE (4 preguntas booleanas)
  ├─ Carga de documentos (RUT, Cámara de Comercio, Cert. Bancaria)
  └─ Declaraciones obligatorias (origen de fondos + tratamiento de datos)
```

### Progreso animado (corazón SVG)

```
Paso 1 → Corazón lleno 8%
Paso 2 → 31%
Paso 3 → 54%
Paso 4 → 77%
Paso 5 → 100% (animación heartbeat)
```

### Endpoint backend

```
POST /api/providers/register
Content-Type: multipart/form-data

Campos: todos los 55 campos del formulario
Archivos:
  - rut          (PDF/JPG/PNG, max 5 MB)
  - camara       (PDF/JPG/PNG, max 5 MB)
  - certBancaria (PDF/JPG/PNG, max 5 MB)
  - formato      (PDF/JPG/PNG, max 5 MB)

Almacenamiento: backend/uploads/providers/{uuid}.{ext}
```

---

## 12. Credenciales y Variables de Entorno

### ⚠️ Importante: estas credenciales son de desarrollo

> En producción deben cambiarse TODAS las contraseñas antes del despliegue.

### Backend — `.env`

```env
DATABASE_URL="postgresql://dataheart:dataheart_dev_2026@localhost:5432/dataheart_sc?schema=public"
JWT_SECRET="[valor en el archivo .env — no commiteado al repo]"
NODE_ENV="development"
PORT=3000
```

### Base de datos

| Parámetro | Valor (desarrollo) |
|---|---|
| Host | `localhost` |
| Puerto | `5432` |
| Base de datos | `dataheart_sc` |
| Usuario | `dataheart` |
| Contraseña | `dataheart_dev_2026` |
| Container | `dataheart_postgres` |

### Usuarios del sistema

| Email | Contraseña (dev) | Rol | Permisos |
|---|---|---|---|
| `admin@santiagocorazon.org` | `admin2026` | Admin | Todos (14) |
| `ana@santiagocorazon.org` | `dataheart2026` | LIDER_DATA_HEART | Todos (14) |
| `luisa@santiagocorazon.org` | `dataheart2026` | DIRECTORA | Solo lectura |
| `alejandra@santiagocorazon.org` | `dataheart2026` | ASISTENTE_CONTABLE | Contable + ventas |
| `doris@santiagocorazon.org` | `dataheart2026` | CONTADORA | Facturación + inventario |
| `paula@santiagocorazon.org` | `dataheart2026` | LIDER_CLIENTES_BENEFACTORES | CRM + ventas |
| `marcela@santiagocorazon.org` | `dataheart2026` | LIDER_ATENCION_FAMILIAS | Personas |
| `megan@santiagocorazon.org` | `dataheart2026` | LIDER_COMUNICACIONES | Comunicaciones |

### Integraciones pendientes (requieren credenciales del cliente)

| Servicio | Estado | Qué se necesita |
|---|---|---|
| Shopify Webhooks | 🟠 Bloqueado | Shopify Partners account + webhook secret + ngrok/dominio |
| Wompi | 🟠 Bloqueado | API key sandbox + evento URL webhook |
| PayU | 🟠 Bloqueado | Credenciales sandbox + URL confirmación |
| PayPal | ⏳ Sprint 11 | Cuenta de negocios verificada |
| WhatsApp Cloud API | ⏳ Sprint 10 | Aprobación Meta Business Suite (1–2 semanas) |
| Mailchimp/Mailerlite | ⏳ Sprint 11 | API key del equipo de comunicaciones |
| S3 / Cloudflare R2 | ⏳ Sprint 7 | Bucket + access key |

---

## 13. Comandos de Desarrollo

### Levantar infraestructura

```bash
# Desde la raíz del proyecto
docker compose up -d          # Levanta PostgreSQL + PostGIS
docker compose down           # Detener
docker compose ps             # Estado de containers
```

### Backend

```bash
cd backend

npm run start:dev             # Dev server con watch → http://localhost:3000
npm test                      # Jest unit tests
npm run lint                  # ESLint con auto-fix
npm run build                 # Build de producción

# Prisma
npx prisma migrate dev --name <nombre>  # Nueva migración
npx prisma migrate status               # Estado de migraciones
npx prisma generate                     # Regenerar cliente
npx prisma db seed                      # Ejecutar seed (roles + permisos + usuarios)
npx prisma studio                       # UI visual → http://localhost:5555

# Conexión directa a DB
psql "postgresql://dataheart:dataheart_dev_2026@localhost:5432/dataheart_sc"
```

### Frontend

```bash
cd frontend

npm start                               # Dev server → http://localhost:4200
npm run build -- --configuration=development  # Build dev
npm run build                           # Build producción → dist/frontend/
npm test                                # Karma + Jasmine
```

### ETL Python

```bash
cd scripts/etl

pip install pandas psycopg2-binary openpyxl
python migrate_excel.py                 # Migración idempotente
```

---

## 14. Historial de Sprints

### Sprint 1 — Semana 1 ✅ COMPLETADO

**Cimientos Cloud + Schema DB**

| Tarea | Estado |
|---|---|
| PostgreSQL 16 + PostGIS en Docker con healthcheck | ✅ |
| Prisma: 18 modelos (Auth, CRM, Donaciones, Inventario, Personas) | ✅ |
| Angular 18: Tailwind CSS, routing lazy, interceptor JWT, authGuard, shell, login con Signals | ✅ |

**Métricas:** 18 tablas creadas · DB levanta en <5s · Angular compila sin errores

---

### Sprint 2 — Semana 2 ✅ COMPLETADO

**Seguridad JWT + ETL Histórico**

| Tarea | Estado |
|---|---|
| Auth JWT HS256 (8h). POST /api/auth/login con bcrypt. JwtAuthGuard + @GetUser() | ✅ |
| Seed: roles Admin / Operador / Contador. Usuario inicial admin@santiagocorazon.org | ✅ |
| RBAC Granular: 7 roles reales + 14 permisos + PermissionsGuard. Frontend sidebar dinámico | ✅ |
| ETL Supabase → PostgreSQL: 14,839 clientes, 114 productos, 109 pedidos | ✅ |

**Métricas:** 14,887 registros migrados · Token JWT 8h · 7 roles + 14 permisos · Sidebar dinámico por permisos

---

### Sprint 2b — Semana 2 (extra) ✅ COMPLETADO

**ETL Excel Histórico (Access/Ventas 2015–2026)**

| Tarea | Estado |
|---|---|
| ETL Python: 4 hojas Excel → PostgreSQL. 25,040 órdenes, 38,086 ítems, 4,493 donaciones | ✅ |
| 355 productos catálogo con categoryName, subcategoryName, externalId | ✅ |
| Schema ampliado en Orders (+5 campos) y Products (+3 campos) | ✅ |

**Métricas:** 25,040 órdenes · 38,086 items · 4,493 donaciones · $5,173M COP total histórico

---

### Sprint 3 — Semana 3 ✅ COMPLETADO

**CRM + Catálogo de Productos**

| Tarea | Estado |
|---|---|
| CRUD ClientDonor: paginación + búsqueda multi-campo (<200ms sobre 14,887 registros) | ✅ |
| CRUD Product: filtro onlyActive, unicidad SKU, soft delete | ✅ |
| UI CRM: tabla paginada, modal creación, búsqueda en tiempo real | ✅ |
| UI Productos: catálogo con alerta visual de stock bajo, PaginationComponent reutilizable | ✅ |

**Métricas:** Búsqueda <200ms · 113 productos activos · Paginación reutilizable

---

### Sprint 4 — Semana 4 ✅ COMPLETADO (HITO 1)

**Pedidos Manuales + Exportador World Office + Proveedores SAGRILAFT**

| Tarea | Estado |
|---|---|
| Formulario de pedido: autocompletado CRM, selector productos, recálculo automático | ✅ |
| OrdersModule: CRUD + total calculado en servidor (nunca acepta precio del cliente) | ✅ |
| Exportador Excel World Office: 2 hojas, 17 columnas. 110 pedidos / $33.9M exportados | ✅ |
| Rediseño UI profesional ERP: sidebar Heroicons, split-screen login, tablas con badges | ✅ |
| Formulario público SAGRILAFT: wizard 5 pasos, 13 secciones, 55 campos, archivos multer | ✅ |

**Métricas:** 110 pedidos · $33.9M exportados · 4 módulos UI · Formulario SAGRILAFT 5 pasos  
**🏁 HITO 1 COMPLETADO**

---

### Sprint 5 — Semana 5 🟠 BLOQUEADO

**Shopify Webhooks**

| Tarea | Estado |
|---|---|
| Endpoint POST /api/webhooks/shopify/orders + validación HMAC SHA256 | 🟠 Bloqueado |
| Idempotencia: clave única por Shopify order ID | 🟠 Bloqueado |

**Bloqueado por:** cliente debe proveer Shopify Partners account + webhook secret + dominio/ngrok

---

## 15. Roadmap y Sprints Pendientes

### Hito 2 — Automatización de Ingresos (Semanas 5–8)

| Sprint | Nombre | Estado |
|---|---|---|
| 5 | Shopify Webhooks | 🟠 Bloqueado (esperando credenciales) |
| 6 | Donaciones Online — Wompi/PayU Webhooks | ⏳ Adelanto parcial en DB, webhooks bloqueados |
| 7 | Motor de Certificados PDF (BullMQ + Redis + S3) | ⏳ Pendiente |
| 8 | Correo Automático + Dashboard Avanzado | ⏳ Adelanto dashboard completado |

### Hito 3 — Personas, Comunicaciones y Dashboard (Semanas 9–12)

| Sprint | Nombre | Estado |
|---|---|---|
| 9 | Beneficiarios (Niños) | 🟠 Bloqueado (esperando Excel de Ana) |
| 10 | Integración WhatsApp / App Diana | ⏳ Pendiente |
| 11 | PayPal + Email Marketing | ⏳ Pendiente |
| 12 | Dashboard Operativo + KPIs Gestión | ⏳ Pendiente |

**Bloqueados por:** Ana María Betancourt debe enviar Excel de beneficiarios y voluntarios (acordado 06-jul-2026, seguimiento viernes 11-jul-2026)

### Hito 4 — Análisis y Geolocalización (Semanas 13–16)

| Sprint | Nombre | Estado |
|---|---|---|
| 13 | Voluntarios | 🟠 Bloqueado (esperando Excel de Ana) |
| 14 | Segmentador de Donantes | ⏳ Pendiente |
| 15 | Geolocalización PostGIS | ⏳ Pendiente (PostGIS ya activo) |
| 16 | Mapa Interactivo de Impacto | ⏳ Pendiente |

### Hito 5 — Inventario Avanzado y Producción (Semanas 17–20)

| Sprint | Nombre | Estado |
|---|---|---|
| 17 | Inventario Avanzado (Insumos + Recetas BOM) | ⏳ Pendiente |
| 18 | Ajustes de Stock + Alertas WhatsApp | ⏳ Pendiente |
| 19 | Concurrencia y Consistencia (SELECT FOR UPDATE) | ⏳ Pendiente |
| 20 | Despliegue en Producción + Capacitación | ⏳ Pendiente |

---

## 16. Seguridad y Convenciones

### Convenciones de seguridad (obligatorias)

```
1. Webhooks (Shopify, Wompi, PayU):
   → Validar HMAC SHA256 del header ANTES de procesar
   → Rechazar cualquier request con firma inválida (401)

2. Mutaciones de inventario:
   → Usar transacciones Prisma con SELECT ... FOR UPDATE
   → Prevenir race conditions en stock

3. Cálculo de totales:
   → SIEMPRE calculado en el servidor con precios de la DB
   → NUNCA aceptar totalAmount del cliente (previene fraude)

4. Uploads de archivos:
   → Validar tipo MIME (PDF/JPEG/PNG únicamente)
   → Límite 5MB por archivo
   → Nombres de archivo reemplazados por UUID en el servidor

5. Passwords:
   → bcrypt con cost factor 12
   → Nunca logear passwords ni tokens

6. JWT:
   → Expiración 8 horas (HS256)
   → Secreto en variable de entorno (nunca en código)

7. Variables sensibles:
   → "Inventario de Plataformas y Accesos.xlsx" contiene credenciales en texto plano
   → NUNCA commitear al repositorio
```

### Convenciones de código

```typescript
// Backend: NestJS
- Módulo por dominio: module / controller / service / dto
- DTO con class-validator para validación de entrada
- PrismaService inyectado (no importar PrismaClient directamente)
- Usar Decimal (no float) para montos de dinero

// Frontend: Angular
- Standalone components (no NgModules)
- Signals para estado local y derivado
- Services en core/services/ o features/<feature>/services/
- @if / @for en templates (nunca *ngIf / *ngFor)
- environment.apiUrl como base de todas las URLs de API
```

---

## 17. Guía de Despliegue

> **Nota:** El despliegue completo a producción está planificado para el Sprint 20.  
> El documento de referencia detallado está en `docs/DEPLOY.md`.

### Pre-requisitos de producción

```
✓ Servidor Ubuntu 22.04+ con 4GB RAM mínimo
✓ Docker + Docker Compose instalados
✓ Dominio apuntando al servidor (A record)
✓ Puerto 80/443 abiertos
```

### Variables de entorno de producción (a cambiar)

```env
DATABASE_URL="postgresql://<user>:<NUEVA_PASS>@localhost:5432/dataheart_sc"
JWT_SECRET="<secreto_aleatorio_min_32_chars>"
NODE_ENV="production"
PORT=3000

# A agregar cuando estén disponibles:
SHOPIFY_WEBHOOK_SECRET="..."
WOMPI_EVENTS_SECRET="..."
AWS_S3_BUCKET="..."
AWS_ACCESS_KEY_ID="..."
AWS_SECRET_ACCESS_KEY="..."
SMTP_HOST="..."
SMTP_USER="..."
SMTP_PASS="..."
```

### Pasos de despliegue básico

```bash
# 1. Clonar repositorio en servidor
git clone <repo> /opt/dataheart-sc
cd /opt/dataheart-sc

# 2. Configurar .env de producción
cp backend/.env.example backend/.env
nano backend/.env  # Editar valores de producción

# 3. Levantar base de datos
docker compose up -d postgres

# 4. Aplicar migraciones
cd backend && npx prisma migrate deploy

# 5. Ejecutar seed inicial
npx prisma db seed

# 6. Build frontend
cd ../frontend && npm run build

# 7. Levantar backend (con PM2)
cd ../backend && npm run build
pm2 start dist/main.js --name dataheart-api

# 8. Configurar Nginx como proxy reverso
# /api/* → localhost:3000
# /* → /opt/dataheart-sc/frontend/dist/frontend/browser/
```

---

## Apéndice A — Colaboración entre Agentes IA

Este proyecto es desarrollado por dos agentes IA que trabajan en paralelo:

| Agente | Herramienta | Protocolo |
|---|---|---|
| **Claude** (claude-sonnet-4-6) | Claude Code CLI | Lee `ai_cooperation_log.md` antes de cada tarea, escribe al terminar |
| **Agy** (Antigravity) | Cursor IDE | Lee `ai_cooperation_log.md` antes de cada tarea, escribe al terminar |

### Protocolo de colaboración

```
ANTES de cada tarea:
  → Leer las últimas 20 líneas de ai_cooperation_log.md
  → Verificar el estado actual del código antes de modificar

DESPUÉS de cada tarea:
  → Appender entrada en ai_cooperation_log.md con:
     - Timestamp
     - Agente
     - Tarea realizada
     - Archivos modificados
     - Estado actual
     - Notas para el siguiente agente
```

---

## Apéndice B — Contactos del Proyecto

| Rol | Nombre | Email |
|---|---|---|
| Stakeholder principal | Ana María Betancourt Obando | ana@santiagocorazon.org |
| Directora de la fundación | Luisa Muriel | luisa@santiagocorazon.org |
| Desarrollador / Contratista | Daniel Flórez | florezaguirredaniel@gmail.com |

---

*Esta documentación se actualiza automáticamente al finalizar cada sprint. Última actualización: 07-jul-2026 — Sprint 5.*
