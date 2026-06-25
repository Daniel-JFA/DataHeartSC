# Sprint 4 — Módulo de Pedidos y Exportador World Office ★ Hito 1

**Proyecto:** DataHeartSC — Fundación Infantil Santiago Corazón
**Período:** Semana 4
**Estado:** ✅ Completado — **Primer Hito Entregado**

---

## Objetivo del Sprint

Reemplazar el formulario de papel "APP Diana" con un panel digital de creación de pedidos, conectado al CRM de clientes y al catálogo de productos. Al mismo tiempo, automatizar la exportación contable al formato exigido por World Office — eliminando el trabajo manual de trascripción de datos.

Este sprint marca el **Hito 1: Núcleo operativo funcional**.

---

## ¿Qué construimos?

### 1. API de Pedidos

Todos los endpoints protegidos con JWT.

| Endpoint | Descripción |
|---|---|
| `GET /api/orders?page=1&limit=20` | Lista paginada de pedidos con cliente y resumen de ítems |
| `GET /api/orders/:id` | Detalle completo con todos los ítems y precios |
| `POST /api/orders` | Crear pedido. El servidor calcula todos los totales desde la base de datos — nunca se confía en precios enviados desde el panel |
| `GET /api/orders/export?from=YYYY-MM-DD&to=YYYY-MM-DD` | Exportar rango de fechas en formato Excel para World Office |

**Seguridad de precios:** el panel envía únicamente la lista de productos y cantidades. El backend consulta el precio real de cada producto en la base de datos y calcula el total. Ningún valor monetario proviene del navegador.

### 2. Formulario Digital de Pedidos (reemplazo de APP Diana)

El nuevo panel reproduce exactamente el flujo de trabajo del formulario de papel:

- **Búsqueda de cliente** con autocompletado en tiempo real (basta escribir el nombre o número de documento)
- **Búsqueda de productos** con autocompletado — al seleccionar un producto se agrega al pedido
- **Tabla de ítems** editable: cantidad por línea, precio unitario consultado al servidor, subtotal calculado automáticamente
- **Total del pedido** actualizado en tiempo real mientras se agregan o modifican ítems
- Selección de **método de pago** y **estado del pedido**
- Al confirmar, el pedido queda guardado y aparece en la lista inmediatamente

### 3. Lista de Pedidos

- Tabla paginada con cliente, fecha, estado, número de ítems y total
- Columna de estado con etiquetas de color: Pendiente, Completado, Cancelado, En Proceso
- Filtro de búsqueda por cliente
- Botón de exportación integrado (ver punto 4)

### 4. Exportador Excel para World Office

Genera un archivo `.xlsx` listo para importar en World Office con un clic:

- **Hoja 1 — Pedidos World Office:** una fila por ítem, con las 17 columnas que exige el sistema contable (número de factura, fecha, cliente, NIT/CC, dirección, producto, cantidad, precio, IVA, subtotal, total)
- **Hoja 2 — Resumen:** totalizados por fecha para cuadre de caja
- El archivo se descarga directamente desde el panel con autenticación incluida — no requiere copiar-pegar datos a mano

---

## Datos en el sistema

Al cierre del Hito 1, el sistema centraliza:

| Registro | Cantidad |
|---|---|
| Clientes / Donantes | 14.887 |
| Productos en catálogo | 113 |
| Pedidos históricos migrados | 109 |
| Ítems de pedidos migrados | 189 |

Todos buscables, filtrables y exportables desde el panel.

---

## Lo que esto reemplaza

| Antes (manual) | Ahora (digital) |
|---|---|
| Formulario papel APP Diana | Formulario digital con autocompletado |
| Trascripción manual a World Office | Exportación con un clic |
| Sin historial de pedidos centralizado | 100% de pedidos consultables y filtrables |
| Errores de trascripción de precios | Precios siempre tomados de la base de datos |

---

## Criterio de Aceptación

- [x] `POST /api/orders` crea un pedido completo con múltiples productos y calcula el total en el servidor
- [x] Los precios nunca se toman del panel — siempre de la base de datos
- [x] `GET /api/orders/export` genera un `.xlsx` con las 17 columnas de World Office
- [x] El formulario busca clientes y productos con autocompletado en tiempo real
- [x] La lista de pedidos muestra estado con color y es paginada
- [x] Sin token → HTTP 401 en todos los endpoints
- [x] Build Angular: 0 errores, 0 warnings

---

## Notas técnicas

- El guard JWT está registrado globalmente — todos los endpoints de pedidos quedan protegidos sin configuración adicional.
- La exportación descarga el archivo desde el panel con autenticación incluida (el token viaja en el header HTTP, no en la URL).
- Los pedidos históricos migrados desde Supabase conservan su `historical_id` para trazabilidad.

---

## Estado del sistema al cierre del Hito 1

```
✅ Base de datos PostgreSQL + PostGIS (Sprint 1)
✅ Autenticación JWT con roles (Sprint 2)
✅ Migración de datos históricos — 14.887 registros (Sprint 2)
✅ CRM de clientes con búsqueda y paginación (Sprint 3)
✅ Catálogo de productos con alertas de stock (Sprint 3)
✅ Módulo de pedidos — creación, lista, exportación (Sprint 4)
```

El núcleo operativo de la fundación está digitalizado y funcionando.
