#!/usr/bin/env bash
# deploy_to_server.sh
# Despliegue seguro a producción — NUNCA toca los datos de la base de datos.
# Solo aplica migraciones de esquema (npx prisma migrate deploy).
#
# Uso:
#   bash scripts/deploy_to_server.sh          # solo código + migraciones
#   bash scripts/deploy_to_server.sh --seed   # + re-aplica seed de roles/permisos

set -euo pipefail

RESET='\033[0m'
BOLD='\033[1m'
GREEN='\033[32m'
YELLOW='\033[33m'
CYAN='\033[36m'
RED='\033[31m'

RUN_SEED=false
[[ "${1:-}" == "--seed" ]] && RUN_SEED=true

echo -e "\n${BOLD}${CYAN}==========================================================${RESET}"
echo -e "${BOLD}${CYAN}  DataHeartSC — Despliegue a producción${RESET}"
echo -e "${BOLD}${CYAN}==========================================================${RESET}"
echo -e "  ${YELLOW}IMPORTANTE: Los datos de producción NO serán modificados.${RESET}"
echo -e "  Solo se actualizará el código y se aplicarán migraciones de esquema.\n"

# ── 1. Backup automático de producción ────────────────────────
echo -e "${YELLOW}1. Creando backup de la base de datos de producción...${RESET}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
ssh prod "
  BACKUP_DIR=/opt/dataheart/backups
  mkdir -p \$BACKUP_DIR

  docker exec dataheart_postgres pg_dump \
    -U dataheart -d dataheart_sc -Fc \
    -f /tmp/dataheart_backup_${TIMESTAMP}.dump

  docker cp dataheart_postgres:/tmp/dataheart_backup_${TIMESTAMP}.dump \
    \$BACKUP_DIR/dataheart_backup_${TIMESTAMP}.dump

  docker exec dataheart_postgres rm /tmp/dataheart_backup_${TIMESTAMP}.dump

  # Conservar solo los últimos 7 backups
  ls -t \$BACKUP_DIR/dataheart_backup_*.dump 2>/dev/null | tail -n +8 | xargs rm -f

  echo '  Backup guardado en: '\$BACKUP_DIR/dataheart_backup_${TIMESTAMP}.dump
"
echo -e "${GREEN}  ✓ Backup creado en servidor: /opt/dataheart/backups/dataheart_backup_${TIMESTAMP}.dump${RESET}"

# ── 2. Actualizar código y aplicar migraciones ─────────────────
echo -e "\n${YELLOW}2. Actualizando código y compilando en el servidor...${RESET}"
ssh prod << ENDSSH
  set -euo pipefail
  cd /opt/dataheart

  echo "--> Actualizando código (git pull)..."
  git pull origin main

  echo "--> Backend: instalando dependencias..."
  cd backend
  npm install

  echo "--> Aplicando migraciones de esquema (los datos NO se tocan)..."
  npx prisma migrate deploy
  npx prisma generate

  echo "--> Compilando backend..."
  npm run build

  echo "--> Reiniciando proceso pm2..."
  pm2 restart dataheart-api || pm2 start dist/main.js --name "dataheart-api"

  echo "--> Frontend: instalando dependencias y compilando..."
  cd ../frontend
  npm install
  npm run build
ENDSSH

# ── 3. Seed (opcional, solo con --seed) ───────────────────────
if $RUN_SEED; then
  echo -e "\n${YELLOW}3. Aplicando seed de roles y permisos (--seed activado)...${RESET}"
  echo -e "   ${YELLOW}Nota: el seed es idempotente y NO borra usuarios ni datos operativos.${RESET}"
  ssh prod "
    cd /opt/dataheart/backend
    npx ts-node --project tsconfig.json prisma/seed.ts
  "
  echo -e "${GREEN}  ✓ Seed de roles/permisos aplicado.${RESET}"
fi

# ── 4. Verificación final ──────────────────────────────────────
echo -e "\n${YELLOW}4. Verificando estado del servidor...${RESET}"
ssh prod "
  pm2 list --no-color | grep -E 'dataheart|name'
  echo ''
  docker exec dataheart_postgres psql -U dataheart -d dataheart_sc -t -A -c \"
    SELECT 'beneficiarios=' || COUNT(*) FROM beneficiaries
    UNION ALL SELECT 'clientes=' || COUNT(*) FROM clients_donors
    UNION ALL SELECT 'pedidos=' || COUNT(*) FROM orders
    UNION ALL SELECT 'usuarios=' || COUNT(*) FROM users;
  \" 2>/dev/null | sed 's/^/  /'
"

echo -e "\n${BOLD}${GREEN}==========================================================${RESET}"
echo -e "${BOLD}${GREEN}  Despliegue completado. Los datos de producción están intactos.${RESET}"
echo -e "${BOLD}${GREEN}==========================================================${RESET}"
echo -e "  Backup de seguridad: /opt/dataheart/backups/dataheart_backup_${TIMESTAMP}.dump"
echo -e "  Sitio: ${CYAN}https://sc.danielflorez.dev${RESET}\n"
