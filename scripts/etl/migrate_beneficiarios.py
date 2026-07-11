"""
ETL: Datos Personales + AYUDAS → PostgreSQL (DataHeartSC)
==========================================================
Migra:
  1. Datos Personales Junio.xlsx  →  beneficiaries  (998 filas, 26 columnas)
  2. AYUDAS Junio.xlsx            →  ayudas          (4,160 filas, 7 columnas)

Idempotente:
  - beneficiaries: ON CONFLICT (doc_number) DO UPDATE (actualiza campos vacíos)
  - ayudas: inserta solo si la tabla está vacía; de lo contrario muestra aviso
    y permite forzar con --force-ayudas

Ejecutar desde raíz del proyecto:
  python3 scripts/etl/migrate_beneficiarios.py
  python3 scripts/etl/migrate_beneficiarios.py --force-ayudas   # reimporta ayudas
  python3 scripts/etl/migrate_beneficiarios.py --only-ayudas    # solo carga ayudas
"""

import os, sys, uuid, re, argparse
from datetime import datetime, timezone
from decimal import Decimal, InvalidOperation

import pandas as pd
import psycopg2
from psycopg2.extras import execute_values

# ── Config ──────────────────────────────────────────────────────────────────
DB_URL           = "postgresql://dataheart:dataheart_dev_2026@localhost:5432/dataheart_sc"
ROOT             = os.path.join(os.path.dirname(__file__), "../..")
EXCEL_PERSONAS   = os.path.join(ROOT, "Datos Personales Junio.xlsx")
EXCEL_AYUDAS     = os.path.join(ROOT, "AYUDAS Junio.xlsx")

# ── Parsear args ─────────────────────────────────────────────────────────────
parser = argparse.ArgumentParser()
parser.add_argument("--force-ayudas", action="store_true",
                    help="Elimina todas las ayudas existentes y las reimporta")
parser.add_argument("--only-ayudas", action="store_true",
                    help="Salta la carga de beneficiarios; solo carga ayudas")
args = parser.parse_args()

# ── Helpers ──────────────────────────────────────────────────────────────────
def new_id():   return str(uuid.uuid4())
def now():      return datetime.now(timezone.utc)

def safe_str(v):
    if v is None: return None
    if isinstance(v, float) and pd.isna(v): return None
    try:
        if pd.isna(v): return None
    except (TypeError, ValueError):
        pass
    s = str(v).strip()
    return s if s else None

def safe_date(v, fmt=None):
    if v is None: return None
    try:
        if pd.isna(v): return None
    except (TypeError, ValueError):
        pass
    if isinstance(v, datetime): return v
    s = str(v).strip()
    if not s: return None
    fmts = [fmt] if fmt else ["%d/%m/%Y", "%Y-%m-%d", "%m/%d/%Y", "%d-%m-%Y"]
    for f in fmts:
        try: return datetime.strptime(s, f)
        except ValueError: pass
    try: return pd.to_datetime(s, dayfirst=True).to_pydatetime()
    except: return None

def safe_dec(v):
    if v is None: return Decimal("0")
    try:
        if pd.isna(v): return Decimal("0")
    except (TypeError, ValueError):
        pass
    try:
        return Decimal(str(v).strip().replace(",", "."))
    except InvalidOperation:
        return Decimal("0")

def safe_int(v):
    if v is None: return None
    try:
        if pd.isna(v): return None
    except (TypeError, ValueError):
        pass
    try: return int(v)
    except (ValueError, TypeError): return None

def norm_doc_number(v):
    """Convierte a string limpio; maneja enteros del Excel (1747 → '1747')."""
    if v is None: return None
    try:
        if pd.isna(v): return None
    except (TypeError, ValueError):
        pass
    # El Excel puede devolver 1747.0
    try:
        fv = float(v)
        if fv == int(fv):
            return str(int(fv))
    except (ValueError, TypeError):
        pass
    return str(v).strip()

def norm_doc_type(v):
    """Normaliza tipos de documento al valor canónico."""
    if not v: return "Sin Identificación"
    s = str(v).strip()
    MAP = {
        "cedula de ciudadanía": "Cédula de Ciudadanía",
        "cedula de ciudadania": "Cédula de Ciudadanía",
        "registro civil":       "Registro Civil",
        "tarjeta de identidad": "Tarjeta de Identidad",
        "permiso especial permanencia": "Permiso Especial Permanencia",
        "menor sin identificación":     "Menor sin Identificación",
        "menor sin identificacion":     "Menor sin Identificación",
        "no adres":             "NO ADRES",
    }
    return MAP.get(s.lower(), s)

def email_valid(v):
    s = safe_str(v)
    if not s: return None
    return s if "@" in s else None

# ── Conectar ─────────────────────────────────────────────────────────────────
print("🔗 Conectando a PostgreSQL…")
conn = psycopg2.connect(DB_URL)
cur  = conn.cursor()

# ─────────────────────────────────────────────────────────────────────────────
# PARTE 1: beneficiaries  ←  Datos Personales Junio.xlsx
# ─────────────────────────────────────────────────────────────────────────────
if not args.only_ayudas:
    print(f"\n📂 Cargando '{os.path.basename(EXCEL_PERSONAS)}'…")
    df = pd.read_excel(EXCEL_PERSONAS, sheet_name="Datos Personales", dtype=str)
    # Limpiar nombres de columnas
    df.columns = [str(c).strip() for c in df.columns]
    print(f"   Filas: {len(df):,}  |  Columnas: {list(df.columns)}")

    # Cargar doc_numbers ya existentes → para upsert eficiente
    cur.execute("SELECT doc_number FROM beneficiaries")
    existing_docs = {row[0] for row in cur.fetchall()}

    report = {"inserted": 0, "updated": 0, "skipped": 0, "errors": 0}
    rows_insert = []
    rows_update = []

    for idx, row in df.iterrows():
        try:
            doc_raw  = row.get("Cédula") or row.get("Cedula") or row.get("cedula")
            doc_num  = norm_doc_number(doc_raw)
            if not doc_num:
                report["skipped"] += 1
                continue

            doc_type = norm_doc_type(row.get("Tipo Documento"))

            # Nombres: el Excel trae Nombres y Apellidos separados
            first = safe_str(row.get("Nombres")) or "Sin nombre"
            last  = safe_str(row.get("Apellidos")) or "Sin apellido"

            birth_date   = safe_date(row.get("Fecha de Nacimiento"))
            birth_city   = safe_str(row.get("Ciudad de Nacimiento"))
            gender       = safe_str(row.get("Género") or row.get("Genero"))
            etnia        = safe_str(row.get("Etnia"))
            condicion    = safe_str(row.get("Condición") or row.get("Condicion"))

            # Fallecido: si tiene fecha → deceased_date y status = Fallecido
            deceased_raw  = row.get("Fallecido")
            deceased_date = safe_date(deceased_raw)
            status        = "Fallecido" if deceased_date else "Activo"

            phone    = safe_str(row.get("Teléfono") or row.get("Telefono"))
            celular  = safe_str(row.get("Celular"))
            email    = email_valid(row.get("Correo Electrónico") or row.get("Correo Electronico"))
            address  = safe_str(row.get("Dirección") or row.get("Direccion"))
            city     = safe_str(row.get("Ciudad"))
            dept     = safe_str(row.get("Departamento"))

            eps          = safe_str(row.get("EPS"))
            regimen      = safe_str(row.get("Régimen") or row.get("Regimen"))
            diagnostico  = safe_str(row.get("Diagnóstico") or row.get("Diagnostico"))
            tratado_en   = safe_str(row.get("Dónde ha sido tratado") or row.get("Donde ha sido tratado"))

            mother_name = safe_str(row.get("Madre"))
            mother_occ  = safe_str(row.get("Ocupación Madre") or row.get("Ocupacion Madre"))
            father_name = safe_str(row.get("Padre"))
            father_occ  = safe_str(row.get("Ocupación Padre") or row.get("Ocupacion Padre"))

            como_se_entero = safe_str(row.get("Cómo se enteró") or row.get("Como se entero"))
            last_updated   = safe_date(row.get("Fecha de Actualización") or row.get("Fecha de Actualizacion"))

            ts = now()
            record = (
                doc_type, first, last, birth_date, birth_city, gender, etnia, condicion,
                deceased_date, status,
                phone, celular, email, address, city, dept,
                eps, regimen, diagnostico, tratado_en,
                mother_name, mother_occ, father_name, father_occ,
                como_se_entero, last_updated,
            )

            if doc_num in existing_docs:
                rows_update.append((doc_num, *record))
                report["updated"] += 1
            else:
                rows_insert.append((
                    new_id(), doc_num, *record, ts, ts   # created_at, updated_at
                ))
                existing_docs.add(doc_num)
                report["inserted"] += 1

        except Exception as e:
            print(f"   ⚠️  Error fila {idx}: {e}")
            report["errors"] += 1

    # ── Inserts nuevos ────────────────────────────────────────────────────────
    BATCH = 200
    if rows_insert:
        for i in range(0, len(rows_insert), BATCH):
            chunk = rows_insert[i:i+BATCH]
            execute_values(cur, """
                INSERT INTO beneficiaries (
                  id, doc_number,
                  doc_type, first_name, last_name, birth_date, birth_city,
                  gender, etnia, condicion, deceased_date, status,
                  phone, celular, email, address, city, department,
                  eps, regimen, diagnostico, tratado_en,
                  mother_name, mother_occupation, father_name, father_occupation,
                  como_se_entero, last_updated_at, created_at, updated_at
                ) VALUES %s
                ON CONFLICT (doc_number) DO NOTHING
            """, chunk)
        conn.commit()

    # ── Updates (enriquece campos nulos de registros existentes) ─────────────
    if rows_update:
        for tup in rows_update:
            doc_num_upd = tup[0]
            cur.execute("""
                UPDATE beneficiaries SET
                  doc_type          = COALESCE(NULLIF(doc_type,''), %s),
                  first_name        = COALESCE(NULLIF(first_name,''), %s),
                  last_name         = COALESCE(NULLIF(last_name,''), %s),
                  birth_date        = COALESCE(birth_date, %s),
                  birth_city        = COALESCE(birth_city, %s),
                  gender            = COALESCE(gender, %s),
                  etnia             = COALESCE(etnia, %s),
                  condicion         = COALESCE(condicion, %s),
                  deceased_date     = COALESCE(deceased_date, %s),
                  status            = CASE WHEN status = 'Activo' THEN COALESCE(%s, status) ELSE status END,
                  phone             = COALESCE(phone, %s),
                  celular           = COALESCE(celular, %s),
                  email             = COALESCE(email, %s),
                  address           = COALESCE(address, %s),
                  city              = COALESCE(city, %s),
                  department        = COALESCE(department, %s),
                  eps               = COALESCE(eps, %s),
                  regimen           = COALESCE(regimen, %s),
                  diagnostico       = COALESCE(diagnostico, %s),
                  tratado_en        = COALESCE(tratado_en, %s),
                  mother_name       = COALESCE(mother_name, %s),
                  mother_occupation = COALESCE(mother_occupation, %s),
                  father_name       = COALESCE(father_name, %s),
                  father_occupation = COALESCE(father_occupation, %s),
                  como_se_entero    = COALESCE(como_se_entero, %s),
                  last_updated_at   = COALESCE(last_updated_at, %s),
                  updated_at        = NOW()
                WHERE doc_number = %s
            """, tup[1:] + (doc_num_upd,))
        conn.commit()

    print(f"   ✅ Insertados : {report['inserted']:,}")
    print(f"   🔄 Actualizados: {report['updated']:,}")
    print(f"   ⏭️  Errores    : {report['errors']:,}")

# ─────────────────────────────────────────────────────────────────────────────
# PARTE 2: ayudas  ←  AYUDAS Junio.xlsx
# ─────────────────────────────────────────────────────────────────────────────
print(f"\n📂 Cargando '{os.path.basename(EXCEL_AYUDAS)}'…")
df_a = pd.read_excel(EXCEL_AYUDAS, sheet_name="AYUDAS", dtype=str)
df_a.columns = [str(c).strip() for c in df_a.columns]
print(f"   Filas: {len(df_a):,}  |  Columnas: {list(df_a.columns)}")

# Verificar si ya hay ayudas cargadas
cur.execute("SELECT COUNT(*) FROM ayudas")
ayudas_count = cur.fetchone()[0]

if ayudas_count > 0 and not args.force_ayudas:
    print(f"\n⚠️  La tabla 'ayudas' ya tiene {ayudas_count:,} registros.")
    print("   Usa --force-ayudas para eliminar y reimportar.")
    print("   Saltando carga de ayudas.")
else:
    if ayudas_count > 0 and args.force_ayudas:
        print(f"   🗑️  Eliminando {ayudas_count:,} ayudas existentes (--force-ayudas)…")
        cur.execute("DELETE FROM ayudas")
        conn.commit()

    # Construir mapa doc_number → beneficiary.id
    cur.execute("SELECT doc_number, id FROM beneficiaries")
    ben_map = {row[0]: row[1] for row in cur.fetchall()}
    print(f"   🗺️  Beneficiarios en DB: {len(ben_map):,}")

    report_a = {"inserted": 0, "new_ben": 0, "skipped": 0, "errors": 0}
    rows_ayudas = []
    minimal_bens = []   # beneficiarios mínimos a crear para cedulas sin registro

    for idx, row in df_a.iterrows():
        try:
            cedula_raw = row.get("Cedula") or row.get("Cédula") or row.get("cedula")
            doc_num    = norm_doc_number(cedula_raw)
            if not doc_num:
                report_a["skipped"] += 1
                continue

            fecha         = safe_date(row.get("Fecha"))
            tipo          = safe_str(row.get("Solicitud")) or "Otra"
            personas      = safe_int(row.get("Personas Beneficiadas")) or 1
            justificacion = safe_str(row.get("Justificación") or row.get("Justificacion"))
            valor         = safe_dec(row.get("Valor"))
            estado_raw    = safe_str(row.get("Estado de la solicitud")) or "Pendiente"
            # Normalizar: "Resuelta" ↔ "Pendiente"
            estado = "Resuelta" if "resuelta" in estado_raw.lower() else "Pendiente"

            # Buscar beneficiario
            ben_id = ben_map.get(doc_num)

            if not ben_id:
                # Crear beneficiario mínimo para no perder la ayuda
                ben_id = new_id()
                ts_min = now()
                minimal_bens.append((
                    ben_id, doc_num,
                    "Sin Identificación",   # doc_type
                    "Beneficiario",         # first_name
                    f"({doc_num})",         # last_name — placeholder claro
                    "Activo",               # status
                    ts_min,                 # created_at
                    ts_min,                 # updated_at
                ))
                ben_map[doc_num] = ben_id
                report_a["new_ben"] += 1

            ts_a = now()
            rows_ayudas.append((
                new_id(), ben_id, fecha, tipo,
                personas, justificacion, valor, estado, ts_a, ts_a
            ))

        except Exception as e:
            print(f"   ⚠️  Error fila {idx}: {e}")
            report_a["errors"] += 1

    # Insertar beneficiarios mínimos
    if minimal_bens:
        execute_values(cur, """
            INSERT INTO beneficiaries
              (id, doc_number, doc_type, first_name, last_name, status, created_at, updated_at)
            VALUES %s
            ON CONFLICT (doc_number) DO NOTHING
        """, minimal_bens)
        conn.commit()
        print(f"   ➕ Beneficiarios mínimos creados (solo aparecen en ayudas): {len(minimal_bens):,}")

    # Insertar ayudas en lotes
    BATCH = 500
    if rows_ayudas:
        for i in range(0, len(rows_ayudas), BATCH):
            chunk = rows_ayudas[i:i+BATCH]
            execute_values(cur, """
                INSERT INTO ayudas
                  (id, beneficiary_id, fecha, tipo_solicitud,
                   personas_beneficiadas, justificacion, valor, estado, created_at, updated_at)
                VALUES %s
            """, chunk)
        conn.commit()
        report_a["inserted"] = len(rows_ayudas)

    print(f"   ✅ Ayudas insertadas : {report_a['inserted']:,}")
    print(f"   ⏭️  Filas saltadas    : {report_a['skipped']:,}")
    print(f"   ⚠️  Errores          : {report_a['errors']:,}")

# ── Resumen final ─────────────────────────────────────────────────────────────
cur.execute("SELECT COUNT(*) FROM beneficiaries");           total_ben = cur.fetchone()[0]
cur.execute("SELECT COUNT(*) FROM beneficiaries WHERE status = 'Fallecido'"); total_fall = cur.fetchone()[0]
cur.execute("SELECT COUNT(*) FROM ayudas");                  total_ayu = cur.fetchone()[0]
cur.execute("SELECT COUNT(*) FROM ayudas WHERE estado = 'Resuelta'"); total_res = cur.fetchone()[0]
cur.execute("SELECT SUM(valor) FROM ayudas");                total_val = cur.fetchone()[0] or 0
cur.execute("SELECT tipo_solicitud, COUNT(*) FROM ayudas GROUP BY 1 ORDER BY 2 DESC LIMIT 5")
top_tipos = cur.fetchall()

cur.close()
conn.close()

print(f"""
╔══════════════════════════════════════════════════════╗
║       ETL BENEFICIARIOS — RESUMEN FINAL              ║
╠══════════════════════════════════════════════════════╣
║  Beneficiarios en DB      : {total_ben:>8,}               ║
║    → Fallecidos           : {total_fall:>8,}               ║
║  Ayudas en DB             : {total_ayu:>8,}               ║
║    → Resueltas            : {total_res:>8,}               ║
║  Valor total ayudas       : ${float(total_val)/1e6:>7.1f}M COP         ║
╠══════════════════════════════════════════════════════╣
║  Top 5 tipos de solicitud:                           ║""")
for tipo, cnt in top_tipos:
    print(f"║    {tipo:<30s} {cnt:>6,}        ║")
print("╚══════════════════════════════════════════════════════╝")
