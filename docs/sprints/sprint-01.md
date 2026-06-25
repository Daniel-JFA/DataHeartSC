# Sprint 1 — Cimientos de Infraestructura y Datos

**Proyecto:** DataHeartSC — Fundación Infantil Santiago Corazón
**Período:** Semana 1
**Estado:** ✅ Completado

---

## Objetivo del Sprint

Establecer la base técnica completa del sistema: base de datos funcional con todos los modelos del dominio, y aplicación Angular operativa con estilos y estructura de navegación lista para recibir funcionalidad.

---

## Entregables

### 1. Base de datos PostgreSQL + PostGIS en funcionamiento

Se levantó la base de datos corporativa local usando Docker. Tecnología elegida: PostgreSQL 16 con extensión PostGIS (soporte geográfico para futuras funciones de mapa de beneficiarios y cobertura de envíos).

**Cómo verificarlo:**
```bash
docker compose up -d
docker ps   # debe aparecer "dataheart_postgres" en estado "healthy"
```

### 2. Esquema de datos unificado — 18 tablas

Se diseñó e implementó el esquema completo de la base de datos que centraliza **toda** la operación de la fundación. Incluye:

| Área | Tablas |
|---|---|
| Seguridad y usuarios | `roles`, `permissions`, `role_permissions`, `users`, `audit_logs` |
| Clientes y ventas | `clients_donors`, `orders`, `order_items` |
| Donaciones | `donations`, `certificates` |
| Inventario | `products`, `inputs`, `companions`, `product_inputs`, `inventory_movements` |
| Personas | `beneficiaries`, `volunteers`, `providers` |

La migración inicial fue ejecutada y verificada sin errores.

### 3. Panel administrativo Angular — estructura base

Se configuró el frontend del panel interno con:
- **Tailwind CSS** — sistema de estilos moderno, responsive por defecto
- **Autenticación preparada** — el interceptor HTTP adjunta automáticamente el token de sesión en cada petición al servidor
- **Protección de rutas** — las páginas privadas redirigen al login si no hay sesión activa
- **Shell de navegación** — barra lateral con la estructura visual base del panel
- **Página de login** — formulario funcional listo para conectar al backend

**Cómo verlo:**
```bash
cd frontend && npm start
# Abrir http://localhost:4200
```

---

## Criterio de Aceptación

- [x] Contenedor de base de datos arranca y responde (`docker compose up -d`)
- [x] Las 18 tablas existen en PostgreSQL (`npx prisma migrate status` → "up to date")
- [x] La aplicación Angular compila sin errores (`npm run build`)
- [x] La página de login es visible en `http://localhost:4200/login`

---

## Notas técnicas

- La URL de conexión a la base de datos va en `backend/.env` (no se versiona por seguridad). Ver `backend/.env.example` como plantilla.
- Prisma v7 requiere que la URL de conexión viva en `prisma.config.ts`, no en `schema.prisma`.
