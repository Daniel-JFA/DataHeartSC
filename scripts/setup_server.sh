#!/usr/bin/env bash
# ============================================================
# DataHeartSC — Setup inicial en servidor de pruebas
# Corre desde /opt/dataheart/
#
# Qué hace:
#   1. Verifica que PostgreSQL esté corriendo
#   2. Aplica migraciones Prisma
#   3. Corre el seed (roles + usuario admin)
#   4. Corre el ETL (clientes, productos, pedidos desde Supabase)
#
# Uso:
#   bash scripts/setup_server.sh            # setup completo
#   bash scripts/setup_server.sh --dry-run  # ETL en modo lectura (no escribe nada)
# ============================================================

set -euo pipefail

RESET='\033[0m'
BOLD='\033[1m'
GREEN='\033[32m'
YELLOW='\033[33m'
RED='\033[31m'
CYAN='\033[36m'

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DRY_RUN=""
[[ "${1:-}" == "--dry-run" ]] && DRY_RUN="--dry-run"

log()  { echo -e "${CYAN}[setup]${RESET} $*"; }
ok()   { echo -e "${GREEN}[OK]${RESET} $*"; }
warn() { echo -e "${YELLOW}[WARN]${RESET} $*"; }
fail() { echo -e "${RED}[ERROR]${RESET} $*"; exit 1; }

echo -e "\n${BOLD}${CYAN}DataHeartSC — Setup servidor de pruebas${RESET}"
echo -e "${CYAN}==========================================${RESET}\n"

# ── 1. Verificar PostgreSQL ───────────────────────────────────
log "Verificando PostgreSQL..."
cd "$ROOT_DIR"

if ! docker compose ps 2>/dev/null | grep -q "healthy\|running"; then
  warn "PostgreSQL no está corriendo. Levantando contenedor..."
  docker compose up -d
  log "Esperando que PostgreSQL esté listo..."
  sleep 5
  # Reintentar hasta 30s
  for i in {1..6}; do
    if docker compose ps | grep -q "healthy\|Up"; then
      break
    fi
    sleep 5
  done
fi

# Ping directo a la DB para confirmar
if ! docker compose exec -T postgres pg_isready -U dataheart -d dataheart_sc -q 2>/dev/null; then
  # Intentar sin docker compose exec (servidor puede usar otro método)
  if ! pg_isready -h localhost -p 5432 -U dataheart -d dataheart_sc -q 2>/dev/null; then
    fail "No se puede conectar a PostgreSQL. Verifica que el contenedor esté corriendo:\n  docker compose up -d"
  fi
fi
ok "PostgreSQL accesible."

# ── 2. Migraciones Prisma ─────────────────────────────────────
log "Aplicando migraciones Prisma..."
cd "$ROOT_DIR/backend"

if [[ ! -f ".env" ]]; then
  fail "No existe backend/.env — crea el archivo primero:\n\n  cat > $ROOT_DIR/backend/.env <<EOF\nDATABASE_URL=\"postgresql://dataheart:dataheart_dev_2026@localhost:5432/dataheart_sc?schema=public\"\nJWT_SECRET=\"CAMBIA_ESTE_SECRETO\"\nNODE_ENV=\"production\"\nPORT=3000\nEOF"
fi

npx prisma migrate deploy
npx prisma generate
ok "Migraciones aplicadas."

# ── 3. Seed (roles + usuario admin) ──────────────────────────
log "Corriendo seed (roles + usuario admin)..."
npx ts-node prisma/seed.ts
ok "Seed completado."
echo -e "  ${YELLOW}Credenciales:${RESET} admin@santiagocorazon.org / admin2026"

# ── 4. ETL desde Supabase ─────────────────────────────────────
log "Corriendo ETL de migración histórica${DRY_RUN:+ (DRY RUN)}..."
cd "$ROOT_DIR/scripts/etl"

if [[ ! -d "node_modules" ]]; then
  log "Instalando dependencias del ETL..."
  npm install
fi

node migrate.js $DRY_RUN

# ── Resumen final ─────────────────────────────────────────────
echo -e "\n${BOLD}${GREEN}==========================================${RESET}"
echo -e "${BOLD}${GREEN}Setup completado exitosamente.${RESET}"
echo -e "${GREEN}==========================================${RESET}"
echo -e ""
echo -e "  Backend:  ${CYAN}pm2 logs dataheart-api${RESET}"
echo -e "  Frontend: navegar a la IP/dominio del servidor"
echo -e "  Login:    admin@santiagocorazon.org / admin2026"
echo -e ""
if [[ -f "$ROOT_DIR/scripts/etl/etl_errors.json" ]]; then
  ERRCOUNT=$(node -e "const e=require('./etl_errors.json'); console.log(e.length)" 2>/dev/null || echo "?")
  [[ "$ERRCOUNT" != "0" ]] && warn "Hubo $ERRCOUNT errores en el ETL — revisa: scripts/etl/etl_errors.json"
fi
