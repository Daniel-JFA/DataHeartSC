# Sprint 2 — Seguridad JWT y Migración de Datos Históricos

**Proyecto:** DataHeartSC — Fundación Infantil Santiago Corazón
**Período:** Semana 2
**Estado:** ✅ Completado

---

## Objetivo del Sprint

Asegurar el sistema con autenticación basada en roles y migrar los datos históricos operacionales (clientes, productos, pedidos) al nuevo sistema centralizado.

---

## Entregables

### 1. Sistema de autenticación JWT con roles (RBAC)

El backend ahora protege todos sus recursos. El flujo de autenticación es:

1. El usuario ingresa su correo y contraseña en el panel
2. El backend verifica la contraseña (cifrada con bcrypt, nunca en texto plano)
3. Si es correcta, emite un **token JWT** con validez de 8 horas
4. El panel adjunta ese token en cada petición posterior — sin token, el servidor rechaza la petición

**Roles creados:**
| Rol | Descripción |
|---|---|
| Admin | Acceso total al sistema |
| Operador | Personal operativo (pedidos, inventario) |
| Contador | Acceso a reportes y exportaciones contables |

**Endpoint disponible:**
```
POST /api/auth/login
Body: { "email": "...", "password": "..." }
Respuesta: { "access_token": "eyJ...", "user": { "id", "email", "firstName", "lastName", "role" } }
```

**Credenciales del administrador inicial:**
- Correo: `admin@santiagocorazon.org`
- Contraseña: `admin2026`
*(Cambiar antes de llevar a producción)*

**Prueba rápida:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@santiagocorazon.org","password":"admin2026"}'
```

### 2. Migración de datos históricos — Supabase → PostgreSQL

Se desarrolló un script ETL (Extract, Transform, Load) que lee los datos del sistema anterior (Supabase / APP Diana) y los carga en la nueva base de datos con validación de integridad.

**Resultados de la migración:**

| Tabla | Registros migrados |
|---|---|
| Clientes / Donantes | 14.839 |
| Productos del catálogo | 114 |
| Pedidos históricos | 109 |
| Ítems de pedidos | 189 |

**Transformaciones aplicadas:**
- Tipos de documento normalizados (CC, NIT, CE, PA, TI)
- Documentos faltantes reemplazados por `HIST-{id}` para trazabilidad
- Estados de pedido mapeados al nuevo vocabulario del sistema
- Cada cliente conserva su `historical_id` del sistema anterior

**Cómo re-ejecutar la migración:**
```bash
cd scripts/etl
npm install
node migrate.js
```

---

## Criterio de Aceptación

- [x] `POST /api/auth/login` retorna JWT válido con credenciales correctas
- [x] Petición sin token a ruta protegida retorna HTTP 401
- [x] 3 roles base creados en base de datos
- [x] 14.839 clientes migrados desde el sistema anterior
- [x] Script ETL es re-ejecutable sin duplicar registros (idempotente)

---

## Notas técnicas

- El guard JWT está en `backend/src/auth/jwt-auth.guard.ts` — se usa con `@UseGuards(JwtAuthGuard)` en cualquier controller.
- El decorador `@GetUser()` extrae el payload del token (id, email, rol) dentro de un método de controller.
- Las contraseñas se cifran con bcrypt (12 rondas de sal).
