#!/usr/bin/env node
// ============================================================
// DataHeartSC — ETL Migración Histórica
// Supabase (fuente) → PostgreSQL local (destino)
//
// Tablas Supabase detectadas en app_diana_full.js:
//   - terceros        → clients_donors
//   - catalogo        → products
//   - pedidos         → orders
//   - pedido_detalle  → order_items
//
// Schema real del destino (inspeccionado):
//   - clients_donors.id         TEXT (uuid generado manualmente con crypto.randomUUID)
//   - clients_donors.status     TEXT default 'Activo'
//   - clients_donors.doc_number UNIQUE constraint
//   - orders.client_id          TEXT NOT NULL (FK)
//   - orders.order_date         TIMESTAMP
//   - orders.payment_status     TEXT default 'Pendiente'
//   - order_items.quantity      INTEGER
//   - products.id               TEXT (uuid manual)
//
// Uso:
//   node migrate.js            # migración real
//   node migrate.js --dry-run  # solo lee y reporta, no escribe
// ============================================================

'use strict';

import pg from 'pg';
import { writeFile } from 'node:fs/promises';
import { argv } from 'node:process';
import { randomUUID } from 'node:crypto';

const { Pool } = pg;

// ── Configuración ────────────────────────────────────────────
const SUPABASE_URL = 'https://sbhbcgxmxnxyfuzggegj.supabase.co';
const SUPABASE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' +
  'eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNiaGJjZ3hteG54eWZ1emdnZWdqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkzOTI5MDEsImV4cCI6MjA5NDk2ODkwMX0.' +
  'VgRnvGvKZzKJdAJ4hS4TzEZ9N79ckgHO_LjhdGgiqsc';

const PG_URL =
  process.env.DATABASE_URL ||
  'postgresql://dataheart:dataheart_dev_2026@localhost:5432/dataheart_sc';

const DRY_RUN = argv.includes('--dry-run');

// ── Pool PostgreSQL ──────────────────────────────────────────
const pool = new Pool({ connectionString: PG_URL });

// ── Helpers Supabase ─────────────────────────────────────────
const sbHeaders = () => ({
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
});

/**
 * Descarga TODOS los registros de una tabla de Supabase paginando de 1000 en 1000.
 * Devuelve null si la tabla no existe (error 404/400) o es inaccesible (objeto de error).
 */
async function fetchAllFromSupabase(table, query = '') {
  const rows = [];
  let offset = 0;
  const limit = 1000;

  while (true) {
    const url =
      `${SUPABASE_URL}/rest/v1/${table}?` +
      (query ? `${query}&` : '') +
      `limit=${limit}&offset=${offset}`;

    const res = await fetch(url, { headers: sbHeaders() });

    if (!res.ok) {
      if (res.status === 404 || res.status === 400) return null;
      const body = await res.text();
      throw new Error(`Supabase error [${table}] HTTP ${res.status}: ${body}`);
    }

    const page = await res.json();

    if (!Array.isArray(page)) {
      // Supabase devuelve un objeto error en vez de array
      if (page && page.code) return null;
      throw new Error(`Supabase [${table}] respuesta inesperada: ${JSON.stringify(page)}`);
    }

    rows.push(...page);
    if (page.length < limit) break;
    offset += limit;
  }

  return rows;
}

// ── Mapeos de dominio ────────────────────────────────────────

/**
 * Mapea estado de pedido Supabase → valores del nuevo schema.
 * Nuevo schema acepta: 'Recibido', 'En preparación', 'Despachado', 'Entregado'
 */
function mapOrderStatus(raw) {
  if (!raw) return 'Recibido';
  const v = String(raw).trim().toLowerCase();
  if (v === 'pendiente' || v === 'recibido' || v === 'nuevo') return 'Recibido';
  if (v.includes('preparaci'))  return 'En preparación';
  if (v.includes('despach'))    return 'Despachado';
  if (v.includes('entreg'))     return 'Entregado';
  return 'Recibido'; // fallback seguro
}

/**
 * Mapea tipo de documento Supabase → doc_type destino.
 * Valores válidos en destino: CC, NIT, CE, PA, TI
 */
function mapDocType(tipodoc, tipocliente) {
  const VALID = ['CC', 'NIT', 'CE', 'PA', 'TI'];
  const raw = (tipodoc || '').trim().toUpperCase();
  if (VALID.includes(raw)) return raw;
  if (raw === 'PASAPORTE') return 'PA';
  if ((tipocliente || '').toLowerCase() === 'empresa') return 'NIT';
  return 'CC';
}

/**
 * Genera un SKU limpio a partir del nombre del producto.
 * Máximo 40 caracteres. Ejemplo: "Vela Aromática Premium" → "HIST-VELA-AROMATICA-PREMIUM"
 */
function slugToSku(nombre) {
  return 'HIST-' + nombre
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toUpperCase()
    .slice(0, 35);
}

// ── Contadores y errores ──────────────────────────────────────
const stats = {
  clientes:  { leidos: 0, insertados: 0, errores: [] },
  productos: { leidos: 0, insertados: 0, errores: [] },
  pedidos:   { leidos: 0, insertados: 0, errores: [] },
  items:     { leidos: 0, insertados: 0, errores: [] },
};

// ── Migración de Clientes ─────────────────────────────────────
// Supabase: terceros → Destino: clients_donors
//
// Schema destino relevante:
//   id TEXT PK (uuid manual)
//   doc_number TEXT UNIQUE
//   status TEXT default 'Activo'
//   historical_id TEXT (guarda supabase id para trazabilidad)
// ─────────────────────────────────────────────────────────────
async function migrateClientes(client) {
  console.log('\n[clientes] Leyendo tabla "terceros" de Supabase...');
  const rows = await fetchAllFromSupabase('terceros', 'order=id.asc');

  if (rows === null) {
    console.warn('[clientes] WARN: tabla "terceros" no encontrada en Supabase. Saltando.');
    return {};
  }

  stats.clientes.leidos = rows.length;
  console.log(`[clientes] ${rows.length} registros leídos.`);

  // Cache doc_number → nuevo id (para no releer la DB en cada iteración)
  const docCache = {}; // doc_number → pg id
  const idMap    = {}; // supabase id → pg id

  for (const row of rows) {
    try {
      // Construir doc_number limpio
      const rawDoc = (row.numerodoc || row.cedula || row.nit || '')
        .toString()
        .replace(/[^a-zA-Z0-9-]/g, '')
        .slice(0, 50);
      const docNumber = rawDoc || `HIST-${row.id}`;

      const name = (
        row.nombrecompleto ||
        [row.nombres, row.apellidos].filter(Boolean).join(' ').trim() ||
        row.razonsocial ||
        row.contactoempresa ||
        `Sin nombre ${row.id}`
      ).trim().slice(0, 255);

      const docType = mapDocType(row.tipodoc, row.tipocliente);

      if (!DRY_RUN) {
        // Verificar si ya existe por doc_number (unique constraint real)
        if (docCache[docNumber]) {
          idMap[row.id] = docCache[docNumber];
          stats.clientes.insertados++;
          continue;
        }

        const existing = await client.query(
          'SELECT id FROM clients_donors WHERE doc_number = $1 LIMIT 1',
          [docNumber]
        );

        if (existing.rows.length > 0) {
          // Ya existe: actualizar datos si son mejores
          const pgId = existing.rows[0].id;
          await client.query(
            `UPDATE clients_donors SET
               name         = $1,
               phone        = COALESCE(NULLIF($2, ''), phone),
               email        = COALESCE(NULLIF($3, ''), email),
               address      = COALESCE(NULLIF($4, ''), address),
               city         = COALESCE(NULLIF($5, ''), city),
               historical_id = $6
             WHERE id = $7`,
            [
              name,
              (row.telefono1 || '').toString().slice(0, 20) || null,
              (row.correo_principal || row.correoelectronica || '').slice(0, 255) || null,
              (row.direccion || '').slice(0, 500) || null,
              (row.ciudad || '').slice(0, 100) || null,
              String(row.id),
              pgId,
            ]
          );
          docCache[docNumber] = pgId;
          idMap[row.id]       = pgId;
          stats.clientes.insertados++;
        } else {
          // Insertar nuevo
          const newId = randomUUID();
          await client.query(
            `INSERT INTO clients_donors
               (id, name, doc_type, doc_number, phone, email, address, city, commune, neighborhood, status, historical_id, created_at)
             VALUES
               ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
            [
              newId,
              name,
              docType,
              docNumber,
              (row.telefono1 || '').toString().slice(0, 20) || null,
              (row.correo_principal || row.correoelectronica || '').slice(0, 255) || null,
              (row.direccion || '').slice(0, 500) || null,
              (row.ciudad || '').slice(0, 100) || null,
              null, // commune
              null, // neighborhood
              'Activo',
              String(row.id),
              row.created_at || new Date().toISOString(),
            ]
          );
          docCache[docNumber] = newId;
          idMap[row.id]       = newId;
          stats.clientes.insertados++;
        }
      } else {
        // Dry run
        const fakeId = `DRY-${row.id}`;
        docCache[docNumber] = fakeId;
        idMap[row.id]       = fakeId;
        stats.clientes.insertados++;
      }
    } catch (err) {
      stats.clientes.errores.push({
        tabla: 'clientes',
        supabase_id: row.id,
        error: err.message,
        fila: { id: row.id, numerodoc: row.numerodoc, nombres: row.nombres },
      });
    }
  }

  return idMap;
}

// ── Migración de Productos ────────────────────────────────────
// Supabase: catalogo → Destino: products
//
// Schema destino relevante:
//   id TEXT PK (uuid manual)
//   sku TEXT UNIQUE
//   stock INTEGER default 0
//   min_stock INTEGER default 0
// ─────────────────────────────────────────────────────────────
async function migrateProductos(client) {
  console.log('\n[productos] Leyendo tabla "catalogo" de Supabase...');
  const rows = await fetchAllFromSupabase('catalogo', 'order=id.asc');

  if (rows === null) {
    console.warn('[productos] WARN: tabla "catalogo" no encontrada en Supabase. Saltando.');
    return {};
  }

  stats.productos.leidos = rows.length;
  console.log(`[productos] ${rows.length} registros leídos.`);

  const idMap    = {}; // supabase id → pg id
  const skuCache = {}; // sku → pg id

  for (const row of rows) {
    try {
      const nombre = (row.nombre || `Producto ${row.id}`).toString().trim().slice(0, 255);
      const sku    = slugToSku(nombre);
      const precio = parseFloat(row.precio) || 0;
      const activo = row.activo !== false;

      if (!DRY_RUN) {
        if (skuCache[sku]) {
          idMap[row.id] = skuCache[sku];
          stats.productos.insertados++;
          continue;
        }

        const existing = await client.query(
          'SELECT id FROM products WHERE sku = $1 LIMIT 1',
          [sku]
        );

        if (existing.rows.length > 0) {
          const pgId = existing.rows[0].id;
          await client.query(
            'UPDATE products SET name = $1, price = $2, is_active = $3 WHERE id = $4',
            [nombre, precio, activo, pgId]
          );
          skuCache[sku] = pgId;
          idMap[row.id] = pgId;
          stats.productos.insertados++;
        } else {
          const newId = randomUUID();
          await client.query(
            `INSERT INTO products (id, name, sku, stock, min_stock, price, is_active)
             VALUES ($1, $2, $3, 0, 0, $4, $5)`,
            [newId, nombre, sku, precio, activo]
          );
          skuCache[sku] = newId;
          idMap[row.id] = newId;
          stats.productos.insertados++;
        }
      } else {
        const fakeId = `DRY-${row.id}`;
        skuCache[sku] = fakeId;
        idMap[row.id] = fakeId;
        stats.productos.insertados++;
      }
    } catch (err) {
      stats.productos.errores.push({
        tabla: 'productos',
        supabase_id: row.id,
        error: err.message,
        fila: { id: row.id, nombre: row.nombre },
      });
    }
  }

  return idMap;
}

// ── Migración de Pedidos ──────────────────────────────────────
// Supabase: pedidos → Destino: orders
//
// Schema destino relevante:
//   id TEXT PK (uuid manual)
//   client_id TEXT NOT NULL FK → clients_donors.id
//   order_date TIMESTAMP
//   payment_status TEXT default 'Pendiente'
//   source TEXT default 'Manual'
//
// IMPORTANTE: client_id es NOT NULL en destino.
// Si no podemos mapear el tercero_id, buscamos por doc. Si tampoco,
// se registra como error y se salta el pedido.
// ─────────────────────────────────────────────────────────────
async function migratePedidos(client, clienteIdMap) {
  console.log('\n[pedidos] Leyendo tabla "pedidos" de Supabase...');
  const rows = await fetchAllFromSupabase('pedidos', 'order=id.asc');

  if (rows === null) {
    console.warn('[pedidos] WARN: tabla "pedidos" no encontrada en Supabase. Saltando.');
    return {};
  }

  stats.pedidos.leidos = rows.length;
  console.log(`[pedidos] ${rows.length} registros leídos.`);

  const idMap = {}; // supabase id → pg id

  for (const row of rows) {
    try {
      // Resolver client_id
      let clientId = clienteIdMap[row.tercero_id] || null;

      if (!clientId && row.id_nit_comprador && !DRY_RUN) {
        const cleanDoc = String(row.id_nit_comprador)
          .replace(/[^a-zA-Z0-9-]/g, '')
          .slice(0, 50);
        if (cleanDoc) {
          const res = await client.query(
            'SELECT id FROM clients_donors WHERE doc_number = $1 LIMIT 1',
            [cleanDoc]
          );
          if (res.rows.length > 0) clientId = res.rows[0].id;
        }
      }

      // Si aun sin cliente, intentar buscar por nombre_razon_social
      if (!clientId && !DRY_RUN && row.nombre_razon_social) {
        const res = await client.query(
          'SELECT id FROM clients_donors WHERE name ILIKE $1 LIMIT 1',
          [row.nombre_razon_social.trim()]
        );
        if (res.rows.length > 0) clientId = res.rows[0].id;
      }

      if (!clientId && !DRY_RUN) {
        // Crear cliente anónimo para preservar el pedido con trazabilidad
        const anonDoc = `HIST-PED-${row.id}`;
        const anonName = row.nombre_razon_social?.trim() || `Comprador histórico ${row.id}`;

        const existing = await client.query(
          'SELECT id FROM clients_donors WHERE doc_number = $1 LIMIT 1',
          [anonDoc]
        );

        if (existing.rows.length > 0) {
          clientId = existing.rows[0].id;
        } else {
          const anonId = randomUUID();
          await client.query(
            `INSERT INTO clients_donors
               (id, name, doc_type, doc_number, phone, email, address, city, status, historical_id, created_at)
             VALUES ($1, $2, 'CC', $3, $4, $5, $6, $7, 'Activo', $8, $9)`,
            [
              anonId,
              anonName.slice(0, 255),
              anonDoc,
              (row.telefono_comprador || '').slice(0, 20) || null,
              (row.correo_comprador || '').slice(0, 255) || null,
              (row.direccion_comprador || '').slice(0, 500) || null,
              (row.ciudad_comprador || '').slice(0, 100) || null,
              `anon-pedido-${row.id}`,
              row.created_at || new Date().toISOString(),
            ]
          );
          clientId = anonId;
        }
      }

      if (!clientId) {
        // Dry run: usar un placeholder
        clientId = `DRY-CLIENT-${row.id}`;
      }

      // Construir order_date como timestamp
      const orderDate = row.fecha
        ? `${row.fecha}T${row.hora || '00:00:00'}`
        : (row.created_at || new Date().toISOString());

      const status    = mapOrderStatus(row.estado);
      const total     = parseFloat(row.total_pedido) || 0;

      // payment_status: destino usa 'Pendiente', 'Pagado', 'Cancelado'
      let paymentStatus = 'Pendiente';
      const estadoLow = (row.estado || '').toLowerCase();
      if (row.leg_recibo || row.leg_facturado || estadoLow === 'entregado') {
        paymentStatus = 'Pagado';
      } else if (estadoLow === 'cancelado' || estadoLow === 'anulado') {
        paymentStatus = 'Cancelado';
      }

      // source: incluimos el nro_pedido original para trazabilidad
      const source = [
        row.canal || 'Formulario Web',
        row.nro_pedido || `HIST-${row.id}`,
      ].join('|').slice(0, 255);

      if (!DRY_RUN) {
        // Idempotencia: buscar por source (que contiene nro_pedido único)
        const existing = await client.query(
          'SELECT id FROM orders WHERE source = $1 LIMIT 1',
          [source]
        );

        if (existing.rows.length > 0) {
          idMap[row.id] = existing.rows[0].id;
          stats.pedidos.insertados++;
          continue;
        }

        const newId = randomUUID();
        await client.query(
          `INSERT INTO orders (id, client_id, order_date, status, total_amount, payment_status, source, created_by_user_id)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [newId, clientId, orderDate, status, total, paymentStatus, source, null]
        );
        idMap[row.id] = newId;
        stats.pedidos.insertados++;
      } else {
        idMap[row.id] = `DRY-${row.id}`;
        stats.pedidos.insertados++;
      }
    } catch (err) {
      stats.pedidos.errores.push({
        tabla: 'pedidos',
        supabase_id: row.id,
        error: err.message,
        fila: { id: row.id, nro_pedido: row.nro_pedido, estado: row.estado },
      });
    }
  }

  return idMap;
}

// ── Migración de Items ────────────────────────────────────────
// Supabase: pedido_detalle → Destino: order_items
//
// Schema destino relevante:
//   quantity INTEGER (no float)
//   product_id TEXT NOT NULL FK → products.id
//   order_id TEXT NOT NULL FK → orders.id
// ─────────────────────────────────────────────────────────────
async function migrateItems(client, pedidoIdMap, productoIdMap) {
  console.log('\n[items] Leyendo tabla "pedido_detalle" de Supabase...');
  const rows = await fetchAllFromSupabase('pedido_detalle', 'order=id.asc');

  if (rows === null) {
    console.warn('[items] WARN: tabla "pedido_detalle" no encontrada en Supabase. Saltando.');
    return;
  }

  stats.items.leidos = rows.length;
  console.log(`[items] ${rows.length} registros leídos.`);

  // Cache nombre → product.id para evitar consultas repetidas
  const productCache = {};

  for (const row of rows) {
    try {
      const orderId = pedidoIdMap[row.pedido_id];
      if (!orderId) {
        stats.items.errores.push({
          tabla: 'items',
          supabase_id: row.id,
          error: `pedido_id ${row.pedido_id} no tiene order mapeado`,
          fila: { id: row.id, pedido_id: row.pedido_id },
        });
        continue;
      }

      const cantidad   = Math.max(1, Math.round(parseFloat(row.cantidad) || 1)); // INTEGER
      const unitPrice  = parseFloat(row.precio_unitario) || 0;
      const subtotal   = parseFloat(row.subtotal_linea) || cantidad * unitPrice;
      const nombreProd = (row.producto || `Item ${row.id}`).toString().trim().slice(0, 255);

      if (!DRY_RUN) {
        // Resolver product_id
        let productId = productCache[nombreProd] || null;

        if (!productId) {
          const sku = slugToSku(nombreProd);
          const pRes = await client.query(
            'SELECT id FROM products WHERE sku = $1 LIMIT 1',
            [sku]
          );

          if (pRes.rows.length > 0) {
            productId = pRes.rows[0].id;
          } else {
            // Crear producto ad-hoc para este item
            const newProdId = randomUUID();
            await client.query(
              `INSERT INTO products (id, name, sku, stock, min_stock, price, is_active)
               VALUES ($1, $2, $3, 0, 0, $4, true)
               ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name
               RETURNING id`,
              [newProdId, nombreProd, sku, unitPrice]
            );
            // Recuperar el id (puede ser el existente si hubo conflict)
            const retRes = await client.query(
              'SELECT id FROM products WHERE sku = $1 LIMIT 1',
              [sku]
            );
            productId = retRes.rows[0].id;
          }
          productCache[nombreProd] = productId;
        }

        // Verificar duplicado antes de insertar (idempotencia)
        const dupCheck = await client.query(
          'SELECT id FROM order_items WHERE order_id = $1 AND product_id = $2 AND unit_price = $3 LIMIT 1',
          [orderId, productId, unitPrice]
        );

        if (dupCheck.rows.length > 0) {
          stats.items.insertados++;
          continue;
        }

        const newId = randomUUID();
        await client.query(
          `INSERT INTO order_items (id, order_id, product_id, quantity, unit_price, subtotal)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [newId, orderId, productId, cantidad, unitPrice, subtotal]
        );
        stats.items.insertados++;
      } else {
        stats.items.insertados++;
      }
    } catch (err) {
      stats.items.errores.push({
        tabla: 'items',
        supabase_id: row.id,
        error: err.message,
        fila: { id: row.id, pedido_id: row.pedido_id, producto: row.producto },
      });
    }
  }
}

// ── Reporte de integridad ─────────────────────────────────────
function pad(str, len) {
  return String(str).padStart(len);
}

function printReport() {
  const RESET  = '\x1b[0m';
  const BOLD   = '\x1b[1m';
  const GREEN  = '\x1b[32m';
  const YELLOW = '\x1b[33m';
  const CYAN   = '\x1b[36m';
  const RED    = '\x1b[31m';

  console.log('\n' + BOLD + CYAN + '📊 ETL DataHeartSC — Migración histórica' + RESET);
  console.log(CYAN + '==========================================' + RESET);

  const tablas = [
    ['clientes',  stats.clientes],
    ['productos', stats.productos],
    ['pedidos',   stats.pedidos],
    ['items',     stats.items],
  ];

  let totalErrores = 0;
  for (const [nombre, s] of tablas) {
    const errCount = s.errores.length;
    totalErrores  += errCount;
    const icon     = errCount === 0 ? GREEN + '✅' + RESET : YELLOW + '⚠' + RESET;
    const errStr   = errCount > 0 ? RED + ` ⚠ Errores: ${errCount}` + RESET : '';
    console.log(
      `[${nombre.padEnd(9)}] Leídos: ${pad(s.leidos, 5)}  →  Insertados: ${pad(s.insertados, 5)}  ${icon}${errStr}`
    );
  }

  console.log(CYAN + '==========================================' + RESET);

  if (DRY_RUN) {
    console.log(YELLOW + BOLD + '🔍 DRY RUN — No se escribió nada en la base de datos.' + RESET);
  } else if (totalErrores === 0) {
    console.log(GREEN + BOLD + '✅ ETL completado sin errores.' + RESET);
  } else {
    console.log(YELLOW + BOLD + `✅ ETL completado. Total errores: ${totalErrores}` + RESET);
    console.log(YELLOW + '📋 Errores guardados en: etl_errors.json' + RESET);
  }
}

// ── Main ─────────────────────────────────────────────────────
async function main() {
  if (DRY_RUN) {
    console.log('\x1b[33m[INFO] Modo DRY RUN activo — no se modificará la base de datos.\x1b[0m');
  }

  let client;
  try {
    client = await pool.connect();
    await client.query('SELECT 1'); // ping
  } catch (err) {
    console.error('\x1b[31m[FATAL] No se puede conectar a PostgreSQL:', err.message, '\x1b[0m');
    console.error('Verifica que el contenedor Docker esté corriendo:');
    console.error('  docker compose up -d postgres');
    process.exit(1);
  }

  try {
    const clienteIdMap  = await migrateClientes(client);
    const productoIdMap = await migrateProductos(client);
    const pedidoIdMap   = await migratePedidos(client, clienteIdMap);
    await migrateItems(client, pedidoIdMap, productoIdMap);
  } catch (err) {
    console.error('\x1b[31m[FATAL] Error inesperado durante ETL:', err.message, '\x1b[0m');
    console.error(err.stack);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }

  printReport();

  // Guardar errores en JSON si los hay
  const allErrors = [
    ...stats.clientes.errores,
    ...stats.productos.errores,
    ...stats.pedidos.errores,
    ...stats.items.errores,
  ];

  if (allErrors.length > 0 && !DRY_RUN) {
    await writeFile(
      new URL('./etl_errors.json', import.meta.url),
      JSON.stringify(allErrors, null, 2),
      'utf8'
    );
  }
}

main().catch(err => {
  console.error('\x1b[31m[UNCAUGHT]', err.message, '\x1b[0m');
  process.exit(1);
});
