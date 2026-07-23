# Sprint 05 — Hito 2 Completo: Cola Async, Voluntarios y Preparación Producción

**Fecha:** 23 de julio de 2026  
**Rama:** `main`  
**Commits:** `213d0b3` → `HEAD`

---

## Objetivos del Sprint

Cerrar todos los entregables del **Hito 2** (Automatización de Ventas Web, Certificados PDF y Dashboard) e implementar el **módulo de Voluntarios** adelantado del Hito 4.

---

## Entregables

### 1. Módulo de Proveedores (adelanto Hito 5)
- **Pantalla Angular completa:** tabla con KPIs (Pendientes/Aprobados/Rechazados), búsqueda, paginación, botones Aprobar/Rechazar.
- **Corrección RBAC:** permisos alineados a `inventario:read/write` (matriz v3).
- **Commits:** `213d0b3`

### 2. ETL Voluntarios
- **Schema:** modelo `Volunteer` ampliado (+12 campos: city, eps, occupation, shirtSize, availability, segment, etc.) + nuevo modelo `VolunteerSupport`.
- **Migración:** `20260723203839_add_volunteer_fields_and_supports`
- **Datos importados:** 164 voluntarios + 128 apoyos desde Excel (`Datos Personales junio.xlsx`, `Apoyos Junio.xlsx`).
- **Commits:** `0163ac8`

### 3. Módulo Voluntarios (adelanto Hito 4)
- **Backend:** `GET /api/volunteers` (paginación, búsqueda, filtro estado, KPIs), `GET /api/volunteers/:id` (con apoyos), `PATCH /api/volunteers/:id/status`.
- **Frontend:** tabla 10 columnas, KPIs, búsqueda debounce, toggle Activo/Inactivo.
- **Commits:** `7bf2460`, `a610c8e`

### 4. Historial de Apoyos de Voluntarios (adelanto Hito 4)
- **Backend:** `GET /api/volunteers/supports/all` — paginado, búsqueda, filtro por tipo, KPIs (128 apoyos, 415 horas, $1.047.800 alimentación).
- **Frontend:** tabla 6 columnas, 3 KPIs, filtro dropdown (Eventos/Productos/Administrativos/Comunicaciones).
- **Commits:** `31a3360`

### 5. BullMQ + Redis — Cola Asíncrona de Certificados PDF
- **Instalación:** `@nestjs/bullmq`, `bullmq`.
- **Arquitectura:**
  - `CertificatesProcessor` consume la cola `certificates`.
  - `CertificatesService.enqueueForDonation()` encola el job (3 intentos, backoff exponencial 5s).
  - Los webhooks Wompi/PayU ahora llaman `enqueueForDonation` en lugar de `generateForDonation` → respuesta inmediata al gateway.
- **Redis:** agregado al `docker-compose.yml` local (`redis:7-alpine`, puerto 6379).
- **Commits:** este sprint

### 6. Archivos de Producción
| Archivo | Descripción |
|---|---|
| `docker-compose.prod.yml` | Stack completo: Postgres, Redis, Backend, Frontend, Nginx |
| `nginx/nginx.conf` | SSL, proxy `/api`, rate limiting, SPA Angular |
| `backend/Dockerfile` | Multi-stage: builder + runner Node 22 Alpine |
| `frontend/Dockerfile` | Multi-stage: builder Angular + Nginx Alpine |
| `.env.production.example` | Todas las variables de entorno necesarias |

---

## Variables de entorno requeridas en producción

```
DATABASE_URL / DB_USER / DB_PASSWORD / DB_NAME
JWT_SECRET
REDIS_HOST / REDIS_PORT / REDIS_PASSWORD
SHOPIFY_WEBHOOK_SECRET
WOMPI_INTEGRITY_KEY
PAYU_API_KEY / PAYU_MERCHANT_ID
SMTP_HOST / SMTP_PORT / SMTP_USER / SMTP_PASS / EMAIL_FROM
```

---

## Métricas

| Indicador | Valor |
|---|---|
| Voluntarios en BD | 164 |
| Apoyos históricos | 128 |
| Horas donadas registradas | 415 |
| Valor alimentación registrado | $1.047.800 |
| Build frontend | 0 errores, ~3s |
| Build backend | 0 errores |

---

## Pendiente para despliegue (servidor)

1. Copiar `.env.production.example` → `.env` y completar valores reales.
2. Obtener certificado SSL: `certbot certonly --standalone -d sc.danielflorez.dev`
3. Copiar `fullchain.pem` y `privkey.pem` a `nginx/ssl/`.
4. Ejecutar: `docker compose -f docker-compose.prod.yml up -d --build`
5. Cambiar contraseñas temporales `dataheart2026` antes de capacitación.
