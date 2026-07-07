#!/usr/bin/env bash
# =============================================================================
# DataHeartSC — Setup completo de base de datos
# =============================================================================
#
# USO (desde la raíz del proyecto):
#   bash scripts/setup_db.sh              # setup + seed + ambos ETLs
#   bash scripts/setup_db.sh --only-db    # solo docker + migraciones + seed
#   bash scripts/setup_db.sh --check      # solo verificar estado actual
#
# QUÉ HACE:
#   1. Levanta PostgreSQL en Docker si no está corriendo
#   2. Crea backend/.env si no existe (con valores de desarrollo)
#   3. Aplica todas las migraciones Prisma
#   4. Corre el seed (7 roles reales + 14 permisos + 8 usuarios)
#   5. ETL #1 — migrate.js  : Supabase → PostgreSQL (clientes históricos)
#   6. ETL #2 — migrate_excel.py : Excel ventas 2015-2026 → PostgreSQL
#
# DATOS QUE QUEDAN CARGADOS:
#   • 15.594 clientes/donantes  (clients_donors)
#   • 468    productos           (products)
#   • 25.151 órdenes            (orders)
#   • 38.086 ítems de órdenes   (order_items)
#   • 4.493  donaciones         (donations)
#   • 7 roles + 8 usuarios reales de la fundación
#
# REQUISITOS:
#   - Docker y docker compose instalados
#   - Node.js 18+, npm
#   - Python 3.9+ con pip
#   - El archivo "BD Ventas y Donaciones.xlsx" en la raíz del proyecto
#     (para el ETL #2 del Excel)
#
# =============================================================================

set -euo pipefail

RESET='\033[0m'; BOLD='\033[1m'
GREEN='\033[32m'; YELLOW='\033[33m'; RED='\033[31m'; CYAN='\033[36m'

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MODE="${1:-full}"   # full | --only-db | --check

log()  { echo -e "${CYAN}[setup]${RESET} $*"; }
ok()   { echo -e "${GREEN}[  OK  ]${RESET} $*"; }
warn() { echo -e "${YELLOW}[ WARN ]${RESET} $*"; }
fail() { echo -e "${RED}[ERROR ]${RESET} $*"; exit 1; }
sep()  { echo -e "${CYAN}─────────────────────────────────────────────${RESET}"; }

echo ""
echo -e "${BOLD}${CYAN}DataHeartSC — Setup de Base de Datos${RESET}"
echo -e "${CYAN}======================================${RESET}"
echo -e "  Raíz del proyecto: ${ROOT_DIR}"
echo -e "  Modo: ${MODE}"
sep

# ─────────────────────────────────────────────────────────────────────────────
# MODO --check: solo muestra el estado actual de la DB
# ─────────────────────────────────────────────────────────────────────────────
if [[ "$MODE" == "--check" ]]; then
  log "Verificando estado de la base de datos..."
  cd "$ROOT_DIR"

  if ! docker compose ps 2>/dev/null | grep -q "healthy\|running\|Up"; then
    warn "El contenedor de PostgreSQL NO está corriendo."
    echo -e "  Para levantarlo: ${CYAN}docker compose up -d${RESET}"
    exit 0
  fi

  ok "Contenedor PostgreSQL: corriendo"

  COUNTS=$(docker compose exec -T postgres psql -U dataheart -d dataheart_sc -t -A -c "
    SELECT
      (SELECT COUNT(*) FROM clients_donors)   AS clientes,
      (SELECT COUNT(*) FROM products)         AS productos,
      (SELECT COUNT(*) FROM orders)           AS ordenes,
      (SELECT COUNT(*) FROM order_items)      AS items,
      (SELECT COUNT(*) FROM donations)        AS donaciones,
      (SELECT COUNT(*) FROM roles)            AS roles,
      (SELECT COUNT(*) FROM users)            AS usuarios,
      (SELECT COUNT(*) FROM permissions)      AS permisos;
  " 2>/dev/null || echo "0|0|0|0|0|0|0|0")

  IFS='|' read -r cli pro ord itm don rol usr per <<< "$COUNTS"
  echo ""
  echo -e "  ${BOLD}Tabla              Registros${RESET}"
  sep
  printf "  %-20s %s\n" "clients_donors"  "${cli:-0}"
  printf "  %-20s %s\n" "products"        "${pro:-0}"
  printf "  %-20s %s\n" "orders"          "${ord:-0}"
  printf "  %-20s %s\n" "order_items"     "${itm:-0}"
  printf "  %-20s %s\n" "donations"       "${don:-0}"
  printf "  %-20s %s\n" "roles"           "${rol:-0}"
  printf "  %-20s %s\n" "permissions"     "${per:-0}"
  printf "  %-20s %s\n" "users"           "${usr:-0}"
  sep

  [[ "${cli:-0}" -gt 10000 ]] && ok "DB tiene datos completos (ETL ya corrió)." \
                               || warn "DB vacía o parcial — corre sin --check para poblarla."
  exit 0
fi


# ─────────────────────────────────────────────────────────────────────────────
# PASO 1: Docker + PostgreSQL
# ─────────────────────────────────────────────────────────────────────────────
sep
log "PASO 1 — PostgreSQL en Docker"
cd "$ROOT_DIR"

if ! command -v docker &>/dev/null; then
  fail "Docker no está instalado. Instálalo desde https://docs.docker.com/engine/install/"
fi

if ! docker compose ps 2>/dev/null | grep -q "healthy\|running\|Up"; then
  log "Levantando contenedor de PostgreSQL..."
  docker compose up -d

  log "Esperando healthcheck (máx. 60 s)..."
  for i in {1..12}; do
    if docker compose exec -T postgres pg_isready -U dataheart -d dataheart_sc -q 2>/dev/null; then
      break
    fi
    [[ $i -eq 12 ]] && fail "PostgreSQL no respondió después de 60 s.\n  Revisa: docker compose logs postgres"
    sleep 5
  done
fi

# Verificación final
docker compose exec -T postgres pg_isready -U dataheart -d dataheart_sc -q \
  || fail "No se puede conectar a dataheart_sc.\n  Revisa: docker compose ps && docker compose logs postgres"
ok "PostgreSQL accesible en localhost:5432 · base: dataheart_sc"


# ─────────────────────────────────────────────────────────────────────────────
# PASO 2: backend/.env
# ─────────────────────────────────────────────────────────────────────────────
sep
log "PASO 2 — Archivo backend/.env"
ENV_FILE="$ROOT_DIR/backend/.env"

if [[ ! -f "$ENV_FILE" ]]; then
  warn "No existe backend/.env — creando con valores de desarrollo..."
  cat > "$ENV_FILE" <<'EOF'
DATABASE_URL="postgresql://dataheart:dataheart_dev_2026@localhost:5432/dataheart_sc?schema=public"
JWT_SECRET="dataheart_jwt_secret_dev_CAMBIA_EN_PRODUCCION"
NODE_ENV="development"
PORT=3000
EOF
  ok "backend/.env creado."
  warn "IMPORTANTE: cambia JWT_SECRET antes de ir a producción."
else
  ok "backend/.env ya existe."
fi


# ─────────────────────────────────────────────────────────────────────────────
# PASO 3: Dependencias Node + Migraciones Prisma
# ─────────────────────────────────────────────────────────────────────────────
sep
log "PASO 3 — Dependencias Node.js y migraciones Prisma"
cd "$ROOT_DIR/backend"

if [[ ! -d "node_modules" ]]; then
  log "Instalando dependencias npm..."
  npm install --silent
fi

log "Aplicando migraciones Prisma..."
npx prisma migrate deploy

log "Regenerando Prisma Client..."
npx prisma generate

ok "Esquema de base de datos aplicado (18 tablas + índices)."


# ─────────────────────────────────────────────────────────────────────────────
# PASO 4: Seed — Roles, Permisos y Usuarios
# ─────────────────────────────────────────────────────────────────────────────
sep
log "PASO 4 — Seed: roles, permisos y usuarios"
cd "$ROOT_DIR/backend"

npx ts-node prisma/seed.ts

ok "Seed completado."
echo ""
echo -e "  ${BOLD}Usuarios cargados (contraseña inicial: dataheart2026):${RESET}"
echo -e "  luisa@santiagocorazon.org      → DIRECTORA"
echo -e "  ana@santiagocorazon.org        → LIDER_DATA_HEART"
echo -e "  alejandra@santiagocorazon.org  → ASISTENTE_CONTABLE"
echo -e "  doris@santiagocorazon.org      → CONTADORA"
echo -e "  paula@santiagocorazon.org      → LIDER_CLIENTES_BENEFACTORES"
echo -e "  marcela@santiagocorazon.org    → LIDER_ATENCION_FAMILIAS"
echo -e "  megan@santiagocorazon.org      → LIDER_COMUNICACIONES"
echo -e "  ${YELLOW}admin@santiagocorazon.org      → Admin (contraseña: admin2026)${RESET}"


# ─────────────────────────────────────────────────────────────────────────────
# Si solo se pidió --only-db, terminar aquí
# ─────────────────────────────────────────────────────────────────────────────
if [[ "$MODE" == "--only-db" ]]; then
  sep
  echo -e "\n${BOLD}${GREEN}Setup básico completado (--only-db).${RESET}"
  echo -e "  Los ETLs de datos históricos NO corrieron."
  echo -e "  Para cargar todos los datos: ${CYAN}bash scripts/setup_db.sh${RESET}\n"
  exit 0
fi


# ─────────────────────────────────────────────────────────────────────────────
# PASO 5: ETL #1 — migrate.js (Supabase → PostgreSQL)
# Migra los primeros 14.839 clientes desde la base de datos Supabase anterior.
# Requiere variable SUPABASE_URL en el entorno o en .env del etl.
# Si no está configurada, saltamos este paso con advertencia.
# ─────────────────────────────────────────────────────────────────────────────
sep
log "PASO 5 — ETL #1: Supabase → PostgreSQL (migrate.js)"
cd "$ROOT_DIR/scripts/etl"

if [[ ! -f "migrate.js" ]]; then
  warn "No se encontró scripts/etl/migrate.js — saltando ETL Supabase."
else
  # Instalar dependencias Node del ETL si faltan
  if [[ ! -d "node_modules" ]]; then
    log "Instalando dependencias del ETL Node..."
    npm install --silent
  fi

  # Verificar si ya hay clientes cargados (idempotencia)
  CLIENT_COUNT=$(docker compose -f "$ROOT_DIR/docker-compose.yml" exec -T postgres \
    psql -U dataheart -d dataheart_sc -t -A \
    -c "SELECT COUNT(*) FROM clients_donors;" 2>/dev/null || echo "0")

  if [[ "${CLIENT_COUNT:-0}" -gt 5000 ]]; then
    ok "Ya hay ${CLIENT_COUNT} clientes en la DB — ETL Supabase saltado (ya corrió)."
  else
    log "Corriendo ETL Supabase (puede tardar 1-2 min)..."
    node migrate.js && ok "ETL Supabase completado." \
                    || warn "ETL Supabase terminó con errores — revisa etl_errors.json"
  fi
fi


# ─────────────────────────────────────────────────────────────────────────────
# PASO 6: ETL #2 — migrate_excel.py (Excel ventas 2015-2026)
# Requiere: "BD Ventas y Donaciones.xlsx" en la raíz del proyecto.
# Carga 25.040 órdenes, 38.086 ítems, 4.493 donaciones, 355 productos extra.
# ─────────────────────────────────────────────────────────────────────────────
sep
log "PASO 6 — ETL #2: Excel ventas 2015-2026 (migrate_excel.py)"

EXCEL_FILE="$ROOT_DIR/BD Ventas y Donaciones.xlsx"

if [[ ! -f "$EXCEL_FILE" ]]; then
  warn "No se encontró: 'BD Ventas y Donaciones.xlsx' en la raíz."
  warn "  Copia el archivo ahí y vuelve a correr este paso:"
  warn "  cd $ROOT_DIR && bash scripts/setup_db.sh"
  warn "  (los pasos 1-5 ya completados se saltarán automáticamente)"
else
  # Verificar Python
  PYTHON=$(command -v python3 || command -v python || echo "")
  [[ -z "$PYTHON" ]] && fail "Python 3 no está instalado. Instálalo con: sudo apt install python3 python3-pip"

  # Entorno virtual del ETL
  ETL_VENV="$ROOT_DIR/scripts/etl/.venv"
  if [[ ! -d "$ETL_VENV" ]]; then
    log "Creando entorno virtual Python para el ETL..."
    $PYTHON -m venv "$ETL_VENV"
  fi

  source "$ETL_VENV/bin/activate"

  # Instalar dependencias si faltan
  if ! python -c "import pandas, psycopg2" 2>/dev/null; then
    log "Instalando dependencias Python (pandas, psycopg2, openpyxl)..."
    pip install pandas psycopg2-binary openpyxl --quiet
  fi

  # Verificar idempotencia: contar órdenes actuales
  ORDER_COUNT=$(docker compose -f "$ROOT_DIR/docker-compose.yml" exec -T postgres \
    psql -U dataheart -d dataheart_sc -t -A \
    -c "SELECT COUNT(*) FROM orders;" 2>/dev/null || echo "0")

  if [[ "${ORDER_COUNT:-0}" -gt 20000 ]]; then
    ok "Ya hay ${ORDER_COUNT} órdenes en la DB — ETL Excel saltado (ya corrió)."
  else
    log "Corriendo ETL Excel (puede tardar 3-5 min, son ~38k filas)..."
    cd "$ROOT_DIR/scripts/etl"
    python migrate_excel.py \
      && ok "ETL Excel completado." \
      || warn "ETL Excel terminó con errores — revisa la salida arriba."
  fi

  deactivate
fi


# ─────────────────────────────────────────────────────────────────────────────
# RESUMEN FINAL
# ─────────────────────────────────────────────────────────────────────────────
sep
log "Verificando estado final de la base de datos..."
cd "$ROOT_DIR"

COUNTS=$(docker compose exec -T postgres psql -U dataheart -d dataheart_sc -t -A -c "
  SELECT
    (SELECT COUNT(*) FROM clients_donors)   AS clientes,
    (SELECT COUNT(*) FROM products)         AS productos,
    (SELECT COUNT(*) FROM orders)           AS ordenes,
    (SELECT COUNT(*) FROM order_items)      AS items,
    (SELECT COUNT(*) FROM donations)        AS donaciones,
    (SELECT COUNT(*) FROM roles)            AS roles,
    (SELECT COUNT(*) FROM users)            AS usuarios;
" 2>/dev/null || echo "0|0|0|0|0|0|0")

IFS='|' read -r cli pro ord itm don rol usr <<< "$COUNTS"

echo ""
echo -e "${BOLD}${GREEN}============================================${RESET}"
echo -e "${BOLD}${GREEN}  DataHeartSC — Setup completado          ${RESET}"
echo -e "${BOLD}${GREEN}============================================${RESET}"
echo ""
echo -e "  ${BOLD}Tabla              Registros${RESET}"
sep
printf "  %-22s %'d\n" "clients_donors"  "${cli:-0}"
printf "  %-22s %'d\n" "products"        "${pro:-0}"
printf "  %-22s %'d\n" "orders"          "${ord:-0}"
printf "  %-22s %'d\n" "order_items"     "${itm:-0}"
printf "  %-22s %'d\n" "donations"       "${don:-0}"
printf "  %-22s %'d\n" "roles"           "${rol:-0}"
printf "  %-22s %'d\n" "users"           "${usr:-0}"
sep
echo ""
echo -e "  Backend:   ${CYAN}cd backend && npm run start:dev${RESET}"
echo -e "  Frontend:  ${CYAN}cd frontend && npm start${RESET}"
echo -e "  Prisma:    ${CYAN}cd backend && npx prisma studio${RESET}"
echo -e "  Estado DB: ${CYAN}bash scripts/setup_db.sh --check${RESET}"
echo ""

# Alertar si ETL de errores existe
if [[ -f "$ROOT_DIR/scripts/etl/etl_errors.json" ]]; then
  ERR=$(python3 -c "import json,sys; d=json.load(open('$ROOT_DIR/scripts/etl/etl_errors.json')); print(len(d))" 2>/dev/null || echo "?")
  [[ "${ERR:-0}" != "0" ]] && warn "${ERR} errores en ETL — revisa: scripts/etl/etl_errors.json"
fi
