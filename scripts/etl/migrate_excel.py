"""
ETL: BD Ventas y Donaciones.xlsx → PostgreSQL (DataHeartSC)
============================================================
Migra:
  1. clientes_benefactores (3)  → clients_donors
  2. productos_conceptos        → products
  3. ventas_donaciones          → orders + order_items  (ventas/recibos/remisiones)
                               → donations             (categoría Donaciones)
  4. canal_atencion             → UPDATE orders (canal, municipio, domiciliario)

Ejecutar desde /home/djfa/Dev/projects/Propios/SC/scripts/etl/
  python3 migrate_excel.py
"""

import os, re, uuid, sys
from datetime import datetime, timezone
from decimal import Decimal, InvalidOperation

import pandas as pd
import psycopg2
from psycopg2.extras import execute_values

# ── Conexión ────────────────────────────────────────────────────────────────
DB_URL = "postgresql://dataheart:dataheart_dev_2026@localhost:5432/dataheart_sc"
EXCEL  = os.path.join(os.path.dirname(__file__), "../../BD Ventas y Donaciones.xlsx")

# ── Helpers ─────────────────────────────────────────────────────────────────
def new_id():   return str(uuid.uuid4())
def now():      return datetime.now(timezone.utc)
def safe_str(v):
    if pd.isna(v): return None
    s = str(v).strip()
    return s if s else None
def safe_dec(v):
    if pd.isna(v): return None
    try:   return Decimal(str(v))
    except InvalidOperation: return None
def safe_date(v):
    if pd.isna(v): return None
    try:   return pd.to_datetime(v).to_pydatetime()
    except: return None

def clean_doc_type(raw):
    """Normaliza 'CC:', 'NIT:', 'nit', etc. → 'CC' | 'NIT' | 'OTRO'"""
    if not raw: return "OTRO"
    s = str(raw).strip().upper().rstrip(":")
    if s in ("CC","C.C","CEDULA","CÉDULA"):       return "CC"
    if s in ("NIT","N.I.T"):                       return "NIT"
    if s in ("CE","C.E","EXTRANJERO"):             return "CE"
    if s in ("PASSPORT","PASAPORTE"):              return "PASAPORTE"
    return "OTRO"

def invoice_to_order_type(invoice):
    """Infiere orderType a partir del prefijo de la factura."""
    if not invoice: return "Historico"
    inv = str(invoice).strip().upper()
    if inv.startswith("FV FSC"):          return "Venta"
    if inv.startswith("(FIS) RC"):        return "ReciboCaja"
    if inv.startswith("DMC"):             return "NotaCredito"
    if inv.startswith("DREM"):            return "DevolucionRemision"
    if inv.startswith("REM"):             return "Remision"
    if inv.startswith("(FIS) NC"):        return "NotaCredito"
    return "Venta"

# Productos de la categoría "Donaciones" → van a tabla donations
DONATION_CATEGORY = "Donaciones"

# ── Cargar Excel ─────────────────────────────────────────────────────────────
print("📂 Cargando Excel…")
xl = pd.ExcelFile(EXCEL)

df_cli   = xl.parse("clientes_benefactores (3)")
df_prod  = xl.parse("productos_conceptos")
df_trans = xl.parse("ventas_donaciones")
df_canal = xl.parse("canal_atencion")

print(f"   Clientes  : {len(df_cli):,}")
print(f"   Productos : {len(df_prod):,}")
print(f"   Transacc. : {len(df_trans):,}")
print(f"   Canal     : {len(df_canal):,}")

conn = psycopg2.connect(DB_URL)
cur  = conn.cursor()

report = {"clientes":0, "productos":0, "orders":0, "order_items":0, "donations":0,
          "canal_updated":0, "skip_cli":0, "skip_prod":0, "errors":0}

# ═══════════════════════════════════════════════════════════════════════════════
# 1. CLIENTES
# ═══════════════════════════════════════════════════════════════════════════════
print("\n👥 Migrando clientes…")

# Mapeo externo_id → uuid interno (para usarlo en transacciones)
client_map: dict[str, str] = {}

# Cargar clientes ya existentes (por doc_number)
cur.execute("SELECT doc_number, id FROM clients_donors")
existing_clients = {row[0]: row[1] for row in cur.fetchall()}
# También por historical_id
cur.execute("SELECT historical_id, id FROM clients_donors WHERE historical_id IS NOT NULL")
existing_by_hist = {row[0]: row[1] for row in cur.fetchall()}

rows_cli = []
for _, row in df_cli.iterrows():
    raw_id   = safe_str(row.get("id_cliente"))
    doc_type = clean_doc_type(row.get("tipo_identificacion"))
    name     = safe_str(row.get("nombre_razon_social")) or "Sin nombre"
    phone    = safe_str(row.get("celular_contacto"))
    email    = safe_str(row.get("correo_electronico"))

    # Limpiar email básico
    if email and "@" not in email:
        email = None

    # doc_number: usar raw_id si es válido; si es "SinCedula" generar uno único
    if not raw_id or raw_id.upper() in ("SINCEDULA", "SIN CEDULA", "N/A", "NA", ""):
        doc_number = f"SC-{name[:20].replace(' ','_')}-{new_id()[:8]}"
        doc_type   = "SIN_CEDULA"
    else:
        doc_number = str(raw_id).strip()

    # Ya existe en DB → registrar en map y skip
    if doc_number in existing_clients:
        client_map[doc_number] = existing_clients[doc_number]
        if raw_id: client_map[str(raw_id).strip()] = existing_clients[doc_number]
        report["skip_cli"] += 1
        continue

    # También buscar por historical_id
    if raw_id and str(raw_id) in existing_by_hist:
        cid = existing_by_hist[str(raw_id)]
        client_map[doc_number] = cid
        client_map[str(raw_id)] = cid
        report["skip_cli"] += 1
        continue

    cid = new_id()
    client_map[doc_number] = cid
    if raw_id: client_map[str(raw_id).strip()] = cid

    # Estado: limpiar campo corrupto — si es un nombre/frase larga → "Activo"
    raw_status = safe_str(row.get("estado_cliente")) or "Activo"
    status = "Activo" if len(raw_status) > 20 else raw_status.title()

    rows_cli.append((
        cid, name, doc_type, doc_number,
        phone, email, status, str(raw_id) if raw_id else None, now()
    ))

if rows_cli:
    execute_values(cur, """
        INSERT INTO clients_donors
          (id, name, doc_type, doc_number, phone, email, status, historical_id, created_at)
        VALUES %s
        ON CONFLICT (doc_number) DO NOTHING
    """, rows_cli)
    report["clientes"] = len(rows_cli)

conn.commit()
print(f"   ✅ Insertados: {report['clientes']:,}  |  Ya existían: {report['skip_cli']:,}")

# Refrescar mapa completo después del insert
cur.execute("SELECT doc_number, id, historical_id FROM clients_donors")
for doc, cid, hist in cur.fetchall():
    client_map[doc] = cid
    if hist: client_map[hist] = cid

# ═══════════════════════════════════════════════════════════════════════════════
# 2. PRODUCTOS
# ═══════════════════════════════════════════════════════════════════════════════
print("\n📦 Migrando productos…")

# Limpiar headers del df_prod (puede tener columnas sin nombre)
df_prod.columns = [str(c).strip() for c in df_prod.columns]

# Mapear external_id → uuid interno
product_map: dict[str, str] = {}

cur.execute("SELECT external_id, id FROM products WHERE external_id IS NOT NULL")
for ext, pid in cur.fetchall():
    product_map[str(ext)] = pid

cur.execute("SELECT sku, id FROM products")
existing_skus = {row[0]: row[1] for row in cur.fetchall()}

# Detectar categoría de donaciones para separar en el ETL de transacciones
donation_product_ids: set[str] = set()

rows_prod = []
for _, row in df_prod.iterrows():
    ext_id   = safe_str(row.get("id_producto"))
    name     = safe_str(row.get("nombre_producto"))
    category = safe_str(row.get("nombre_categoria"))
    subcat   = safe_str(row.get("tipo_categoria"))

    if not ext_id or not name:
        continue

    ext_id = str(ext_id).strip()
    sku    = f"EXT-{ext_id}"

    if ext_id in product_map:
        if category == DONATION_CATEGORY:
            donation_product_ids.add(product_map[ext_id])
        report["skip_prod"] += 1
        continue

    if sku in existing_skus:
        product_map[ext_id] = existing_skus[sku]
        if category == DONATION_CATEGORY:
            donation_product_ids.add(existing_skus[sku])
        report["skip_prod"] += 1
        continue

    pid = new_id()
    product_map[ext_id] = pid
    if category == DONATION_CATEGORY:
        donation_product_ids.add(pid)

    rows_prod.append((
        pid, name, sku,
        0, 0,                     # stock, min_stock
        Decimal("0"),             # price (no viene en el Excel)
        True,                     # is_active
        category, subcat, ext_id  # category_name, subcategory_name, external_id
    ))

if rows_prod:
    execute_values(cur, """
        INSERT INTO products
          (id, name, sku, stock, min_stock, price, is_active, category_name, subcategory_name, external_id)
        VALUES %s
        ON CONFLICT (sku) DO NOTHING
    """, rows_prod)
    report["productos"] = len(rows_prod)

conn.commit()

# Refrescar mapa productos
cur.execute("SELECT external_id, id FROM products WHERE external_id IS NOT NULL")
for ext, pid in cur.fetchall():
    product_map[str(ext)] = pid

# Detectar donations por category_name desde DB
cur.execute("SELECT id FROM products WHERE category_name = %s", (DONATION_CATEGORY,))
for (pid,) in cur.fetchall():
    donation_product_ids.add(pid)

print(f"   ✅ Insertados: {report['productos']:,}  |  Ya existían: {report['skip_prod']:,}")
print(f"   📌 Productos de donación identificados: {len(donation_product_ids)}")

# ═══════════════════════════════════════════════════════════════════════════════
# 3. TRANSACCIONES  →  orders + order_items | donations
# ═══════════════════════════════════════════════════════════════════════════════
print("\n💳 Migrando transacciones…")

# Cargar facturas ya existentes para idempotencia
cur.execute("SELECT invoice_number FROM orders WHERE invoice_number IS NOT NULL")
existing_invoices: set[str] = {row[0] for row in cur.fetchall()}

cur.execute("SELECT transaction_id FROM donations")
existing_tx: set[str] = {row[0] for row in cur.fetchall()}

# Cliente genérico para filas sin cliente identificable
ANON_DOC = "ANON-ETL-EXCEL"
cur.execute("SELECT id FROM clients_donors WHERE doc_number = %s", (ANON_DOC,))
row_anon = cur.fetchone()
if row_anon:
    anon_client_id = row_anon[0]
else:
    anon_client_id = new_id()
    cur.execute("""
        INSERT INTO clients_donors (id, name, doc_type, doc_number, status, created_at)
        VALUES (%s, 'Cliente Anónimo Excel', 'SIN_CEDULA', %s, 'Activo', %s)
        ON CONFLICT (doc_number) DO NOTHING
    """, (anon_client_id, ANON_DOC, now()))
    conn.commit()

# Agrupar transacciones por id_transaccion para construir pedidos con múltiples items
# En la BD de origen cada fila es 1 producto (puede haber múltiples por factura)
# Agrupamos por numero_factura_recibo

rows_orders      = []
rows_order_items = []
rows_donations   = []

# Agrupar por número de factura
df_trans["_group_key"] = df_trans["numero_factura_recibo"].fillna("").astype(str) + "||" + df_trans["id_cliente"].fillna("").astype(str)

grouped = df_trans.groupby("_group_key", sort=False)

BATCH = 500
batch_orders = []
batch_items  = []
batch_don    = []

def flush(conn, cur, batch_orders, batch_items, batch_don, report):
    if batch_orders:
        execute_values(cur, """
            INSERT INTO orders
              (id, client_id, order_date, status, total_amount, payment_status,
               source, order_type, invoice_number)
            VALUES %s
            ON CONFLICT DO NOTHING
        """, batch_orders)
        report["orders"] += len(batch_orders)
    if batch_items:
        execute_values(cur, """
            INSERT INTO order_items (id, order_id, product_id, quantity, unit_price, subtotal)
            VALUES %s
            ON CONFLICT DO NOTHING
        """, batch_items)
        report["order_items"] += len(batch_items)
    if batch_don:
        execute_values(cur, """
            INSERT INTO donations
              (id, client_id, amount, date, payment_gateway, transaction_id, status, campaign, concept, created_at)
            VALUES %s
            ON CONFLICT (transaction_id) DO NOTHING
        """, batch_don)
        report["donations"] += len(batch_don)
    conn.commit()
    return [], [], []

i = 0
for key, grp in grouped:
    invoice_raw = safe_str(grp["numero_factura_recibo"].iloc[0])
    id_cliente  = safe_str(grp["id_cliente"].iloc[0])
    fecha       = safe_date(grp["fecha_transaccion"].iloc[0]) or now()
    nota        = safe_str(grp.get("nota", pd.Series([None])).iloc[0]) if "nota" in grp.columns else None

    # Resolver cliente
    client_id = None
    if id_cliente:
        client_id = client_map.get(str(id_cliente).strip())
    if not client_id:
        client_id = anon_client_id

    order_type = invoice_to_order_type(invoice_raw)

    # ── Calcular total del grupo ───────────────────────────────────────────
    total = Decimal("0")
    for _, item_row in grp.iterrows():
        val = safe_dec(item_row.get("valor_total"))
        if val: total += val

    # ── Separar: donaciones vs órdenes ────────────────────────────────────
    # Si TODOS los productos son donaciones → va a tabla donations
    product_ids_in_group = []
    for _, item_row in grp.iterrows():
        ext = safe_str(item_row.get("id_producto"))
        if ext: product_ids_in_group.append(product_map.get(str(ext).strip()))

    all_donations = product_ids_in_group and all(p in donation_product_ids for p in product_ids_in_group if p)

    if all_donations:
        # Insertar como donación
        tx_id = invoice_raw or f"ETL-{new_id()[:12]}"
        if tx_id in existing_tx:
            continue
        existing_tx.add(tx_id)

        # Determinar concepto del producto
        concept = None
        ext_first = safe_str(grp["id_producto"].iloc[0]) if "id_producto" in grp.columns else None
        if ext_first:
            cur.execute("SELECT name FROM products WHERE external_id = %s", (str(ext_first).strip(),))
            r = cur.fetchone()
            if r: concept = r[0]

        batch_don.append((
            new_id(), client_id, total, fecha,
            "Manual",   # payment_gateway — manual (no viene de webhook)
            tx_id,
            "Approved",
            nota,       # campaign
            concept,    # concept
            now()
        ))

    else:
        # Insertar como orden
        if invoice_raw and invoice_raw in existing_invoices:
            continue
        if invoice_raw:
            existing_invoices.add(invoice_raw)

        order_id = new_id()
        batch_orders.append((
            order_id, client_id, fecha,
            "Entregado",          # status histórico
            total,
            "Pagado",             # payment_status histórico
            "Manual",             # source
            order_type,
            invoice_raw,
        ))

        for _, item_row in grp.iterrows():
            ext        = safe_str(item_row.get("id_producto"))
            val_total  = safe_dec(item_row.get("valor_total")) or Decimal("0")
            val_unit   = safe_dec(item_row.get("valor_unitario")) or Decimal("0")
            qty_raw    = item_row.get("cantidad")
            qty        = int(qty_raw) if not pd.isna(qty_raw) and str(qty_raw).replace(".","").isdigit() else 1

            product_id = product_map.get(str(ext).strip()) if ext else None
            if not product_id:
                # Producto genérico para registros históricos sin producto
                cur.execute("SELECT id FROM products WHERE sku = 'PROD-GENERICO-ETL'")
                rr = cur.fetchone()
                if rr:
                    product_id = rr[0]
                else:
                    product_id = new_id()
                    cur.execute("""
                        INSERT INTO products (id, name, sku, stock, min_stock, price, is_active)
                        VALUES (%s, 'Producto Histórico', 'PROD-GENERICO-ETL', 0, 0, 0, false)
                        ON CONFLICT (sku) DO NOTHING RETURNING id
                    """, (product_id,))
                    rr2 = cur.fetchone()
                    if rr2: product_id = rr2[0]

            if val_unit == 0 and qty > 0 and val_total != 0:
                val_unit = val_total / qty

            batch_items.append((
                new_id(), order_id, product_id,
                qty, val_unit, val_total
            ))

    i += 1
    if i % BATCH == 0:
        batch_orders, batch_items, batch_don = flush(conn, cur, batch_orders, batch_items, batch_don, report)
        print(f"   … {i:,} grupos procesados | órdenes:{report['orders']:,} | donaciones:{report['donations']:,}")

# Flush final
flush(conn, cur, batch_orders, batch_items, batch_don, report)

print(f"\n   ✅ Órdenes:    {report['orders']:,}")
print(f"   ✅ Items:      {report['order_items']:,}")
print(f"   ✅ Donaciones: {report['donations']:,}")

# ═══════════════════════════════════════════════════════════════════════════════
# 4. CANAL DE ATENCIÓN → UPDATE orders
# ═══════════════════════════════════════════════════════════════════════════════
print("\n📡 Actualizando canal de atención en órdenes…")

for _, row in df_canal.iterrows():
    invoice = safe_str(row.get("numero_factura_recibo"))
    if not invoice: continue
    canal    = safe_str(row.get("canal_atencion"))
    municipio= safe_str(row.get("municipio_entrega"))
    domi     = safe_str(row.get("domiciliarios"))

    if canal or municipio or domi:
        cur.execute("""
            UPDATE orders
               SET canal_atencion     = COALESCE(%s, canal_atencion),
                   municipio_entrega  = COALESCE(%s, municipio_entrega),
                   domiciliario       = COALESCE(%s, domiciliario)
             WHERE invoice_number = %s
        """, (canal, municipio, domi, invoice))
        report["canal_updated"] += cur.rowcount

conn.commit()
print(f"   ✅ Órdenes actualizadas con canal: {report['canal_updated']:,}")

# ═══════════════════════════════════════════════════════════════════════════════
# RESUMEN FINAL
# ═══════════════════════════════════════════════════════════════════════════════
cur.execute("SELECT COUNT(*) FROM clients_donors"); total_cli = cur.fetchone()[0]
cur.execute("SELECT COUNT(*) FROM products");       total_prod = cur.fetchone()[0]
cur.execute("SELECT COUNT(*) FROM orders");         total_ord  = cur.fetchone()[0]
cur.execute("SELECT COUNT(*) FROM donations");      total_don  = cur.fetchone()[0]
cur.execute("SELECT SUM(total_amount) FROM orders"); total_amt = cur.fetchone()[0] or 0

cur.close()
conn.close()

print(f"""
╔══════════════════════════════════════════════════╗
║          ETL EXCEL — RESUMEN FINAL               ║
╠══════════════════════════════════════════════════╣
║  Clientes     insertados : {report['clientes']:>8,}             ║
║  Clientes     omitidos   : {report['skip_cli']:>8,} (ya existían) ║
║  Productos    insertados : {report['productos']:>8,}             ║
║  Órdenes      insertadas : {report['orders']:>8,}             ║
║  Items        insertados : {report['order_items']:>8,}             ║
║  Donaciones   insertadas : {report['donations']:>8,}             ║
║  Canal        actualizados: {report['canal_updated']:>7,}             ║
╠══════════════════════════════════════════════════╣
║  TOTALES EN DB                                   ║
║  clients_donors           : {total_cli:>8,}             ║
║  products                 : {total_prod:>8,}             ║
║  orders                   : {total_ord:>8,}             ║
║  donations                : {total_don:>8,}             ║
║  Valor total órdenes      : ${float(total_amt)/1e6:>7.1f}M COP       ║
╚══════════════════════════════════════════════════╝
""")
