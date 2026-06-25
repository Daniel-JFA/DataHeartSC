# Sprint 3 — CRM de Clientes/Donantes y Catálogo de Productos

**Proyecto:** DataHeartSC — Fundación Infantil Santiago Corazón
**Período:** Semana 3
**Estado:** ✅ Completado

---

## Objetivo del Sprint

Construir los primeros módulos de negocio operativos: gestión de clientes/donantes con búsqueda y paginación, y visualización del catálogo de productos con alertas de stock.

---

## Entregables

### 1. API de Clientes / Donantes

Todos los endpoints protegidos con JWT. Respuesta con tiempo <200ms sobre 14.887 registros.

| Endpoint | Descripción |
|---|---|
| `GET /api/clients?page=1&limit=20&search=texto` | Lista paginada. Búsqueda simultánea por nombre, documento, correo y ciudad |
| `GET /api/clients/:id` | Detalle con últimos 5 pedidos y 5 donaciones |
| `POST /api/clients` | Crear cliente. Valida tipo de documento y unicidad del número |
| `PUT /api/clients/:id` | Actualizar datos |
| `DELETE /api/clients/:id` | Desactivar (soft delete — nunca se borra el historial) |

### 2. API de Productos

| Endpoint | Descripción |
|---|---|
| `GET /api/products?search=texto&onlyActive=true` | Lista paginada con filtro de activos |
| `GET /api/products/:id` | Detalle con receta de insumos (BOM) |
| `POST /api/products` | Crear producto con SKU único |
| `PUT /api/products/:id` | Actualizar |
| `DELETE /api/products/:id` | Desactivar (soft delete) |

### 3. Panel CRM en Angular

- Tabla de clientes con **paginación** y **búsqueda en tiempo real** contra el backend
- Modal de creación de cliente con formulario reactivo: nombre, tipo/número de documento, teléfono, correo, ciudad, barrio, dirección
- Detección visual de estado activo/inactivo
- Columna de conteo de pedidos por cliente

### 4. Catálogo de productos en Angular

- Tabla con nombre, SKU, precio formateado en COP, stock actual vs. mínimo
- **Alerta visual automática** (fila roja + badge "Stock bajo") cuando `stock ≤ minStock`
- Búsqueda por nombre o SKU

### 5. Componente de paginación reutilizable

`PaginationComponent` — basado en Signals (`input`, `output`, `computed`). Muestra rango de registros, botones de página con ventana deslizante (±2 páginas), y resalta la página activa.

---

## Datos en el sistema

Al final de este sprint el sistema tiene cargados desde el Sprint 2 (ETL):
- **14.887 clientes/donantes** disponibles y buscables en el CRM
- **113 productos** en el catálogo

---

## Criterio de Aceptación

- [x] `GET /api/clients?search=maria` retorna resultados en <200ms sobre 14.887 registros
- [x] Sin token → HTTP 401 en todos los endpoints
- [x] Modal de creación guarda el cliente y refresca la tabla sin recargar la página
- [x] Productos con stock ≤ mínimo se destacan visualmente en rojo
- [x] Paginación funcional en ambas tablas
- [x] Build Angular: 0 errores, 0 warnings

---

## Notas técnicas

- Soft delete en clientes (`status = 'Inactivo'`) y productos (`isActive = false`): el historial nunca se pierde.
- El componente de paginación es reutilizable para todos los módulos futuros (pedidos, donaciones, beneficiarios).
- `AuthModule` exporta `JwtAuthGuard` y `JwtModule` — los módulos de features solo importan `AuthModule`.
- El `effect()` en `ClientsListComponent` hace que la tabla se recargue automáticamente al cambiar la página o el término de búsqueda.
