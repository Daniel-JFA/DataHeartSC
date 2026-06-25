# ETL DataHeartSC — Migración Histórica

Script Node.js que migra datos históricos desde Supabase (sistema legado) al nuevo PostgreSQL local.

## Tablas migradas

| Supabase (fuente) | PostgreSQL destino | Notas |
|---|---|---|
| `terceros` | `clients_donors` | `historical_id` guarda el ID de Supabase |
| `catalogo` | `products` | SKU generado desde el nombre |
| `pedidos` | `orders` | `source` incluye el `nro_pedido` original |
| `pedido_detalle` | `order_items` | Crea productos ad-hoc si no existen |

## Requisitos

- Node.js >= 18 (usa `fetch` nativo y ES modules)
- PostgreSQL local corriendo (`docker compose up -d postgres`)
- La migración Prisma `init_full_schema` ya aplicada

## Instalación

```bash
cd scripts/etl
npm install
```

## Uso

```bash
# Migración real (escribe en la DB)
node migrate.js

# Dry-run: solo lee Supabase y reporta, NO escribe nada
node migrate.js --dry-run
```

O con npm:

```bash
npm run migrate
npm run migrate:dry
```

## Variables de entorno

El script lee `DATABASE_URL` del entorno, con fallback a la URL de desarrollo:

```bash
DATABASE_URL="postgresql://dataheart:dataheart_dev_2026@localhost:5432/dataheart_sc" node migrate.js
```

## Idempotencia

- **clientes:** `ON CONFLICT (doc_type, doc_number) DO UPDATE` — actualiza datos si ya existe.
- **productos:** `ON CONFLICT (sku) DO UPDATE` — actualiza nombre y precio.
- **pedidos:** Verifica duplicados por `(source, order_date, total_amount, client_id)` antes de insertar.
- **items:** `ON CONFLICT DO NOTHING`.

El script puede correrse varias veces sin duplicar registros.

## Mapeos de campos

### `terceros` → `clients_donors`

| Supabase | Destino | Transformación |
|---|---|---|
| `id` | `historical_id` | Trazabilidad del origen |
| `tipodoc` | `doc_type` | CC, NIT, CE, PA, TI |
| `numerodoc` / `cedula` | `doc_number` | Si vacío: `HIST-{id}` |
| `nombrecompleto` / `nombres`+`apellidos` / `razonsocial` | `name` | Primer valor no nulo |
| `telefono1` | `phone` | |
| `correo_principal` / `correoelectronica` | `email` | |
| `direccion` | `address` | |
| `ciudad` | `city` | |

### `pedidos` → `orders`

| Supabase | Destino | Transformación |
|---|---|---|
| `tercero_id` / `id_nit_comprador` | `client_id` | FK al client_donor migrado |
| `fecha` | `order_date` | |
| `estado` | `status` | Pendiente→Recibido, En preparación→En preparación, etc. |
| `total_pedido` | `total_amount` | |
| `leg_recibo`/`leg_facturado` | `payment_status` | paid si alguno está activo |
| `canal` + `nro_pedido` | `source` | `"canal|SC-XXXXXXX"` |

### `catalogo` → `products`

| Supabase | Destino | Transformación |
|---|---|---|
| `nombre` | `name`, `sku` | SKU = slug del nombre en mayúsculas |
| `precio` | `price` | |
| `activo` | `is_active` | |
| — | `stock`, `min_stock` | Inicializados en 0 |

### `pedido_detalle` → `order_items`

| Supabase | Destino | Transformación |
|---|---|---|
| `pedido_id` | `order_id` | FK mapeada |
| `producto` | `product_id` | Busca o crea producto por SKU del nombre |
| `cantidad` | `quantity` | |
| `precio_unitario` | `unit_price` | |
| `subtotal_linea` | `subtotal` | |

## Output de ejemplo

```
📊 ETL DataHeartSC — Migración histórica
==========================================
[clientes  ] Leídos:   245  →  Insertados:   243  ⚠ Errores: 2
[productos ] Leídos:    38  →  Insertados:    38  ✅
[pedidos   ] Leídos:   891  →  Insertados:   889  ⚠ Errores: 2
[items     ] Leídos:  2140  →  Insertados:  2138  ⚠ Errores: 2
==========================================
✅ ETL completado. Total errores: 6
📋 Errores guardados en: etl_errors.json
```

## Errores

Los errores por fila se acumulan y se guardan en `etl_errors.json` al finalizar. El proceso NO se detiene por errores individuales — las filas problemáticas se saltan y se registran.

Formato de error:

```json
[
  {
    "tabla": "clientes",
    "supabase_id": 123,
    "error": "valor demasiado largo para el tipo character varying(50)",
    "fila": { "id": 123, "numerodoc": "..." }
  }
]
```
