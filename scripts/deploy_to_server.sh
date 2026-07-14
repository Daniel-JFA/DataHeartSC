#!/usr/bin/env bash
# deploy_to_server.sh
# Ejecuta este script desde tu terminal local para automatizar el despliegue y restauración.

set -euo pipefail

RESET='\033[0m'
BOLD='\033[1m'
GREEN='\033[32m'
YELLOW='\033[33m'
CYAN='\033[36m'

echo -e "\n${BOLD}${CYAN}==========================================================${RESET}"
echo -e "${BOLD}${CYAN}Desplegando DataHeartSC y restaurando Base de Datos...${RESET}"
echo -e "${BOLD}${CYAN}==========================================================${RESET}\n"

# 1. Copiar base de datos por SCP al servidor
echo -e "${YELLOW}1. Subiendo base de datos histórica (dataheart_backup.dump) al servidor...${RESET}"
scp data/dataheart_backup.dump prod:/tmp/dataheart_backup.dump

# 2. Conectarse al servidor por SSH y ejecutar actualización + restauración
echo -e "\n${YELLOW}2. Conectando al servidor por SSH para actualizar código y restaurar DB...${RESET}"
ssh prod << 'EOF'
  set -euo pipefail
  
  cd /opt/dataheart
  echo -e "\n--> 📥 Actualizando código desde GitHub (git pull)..."
  git pull origin main

  echo -e "\n--> ⚙️ Instalando dependencias y compilando el Backend..."
  cd backend
  npm install
  npx prisma generate
  npm run build
  
  echo -e "\n--> 🔄 Reiniciando el proceso pm2 del backend..."
  pm2 restart dataheart-api || pm2 start dist/main.js --name "dataheart-api"

  echo -e "\n--> ⚙️ Instalando dependencias y compilando el Frontend..."
  cd ../frontend
  npm install
  npm run build

  echo -e "\n--> 🗄️ Copiando respaldo de DB al contenedor de Postgres..."
  docker cp /tmp/dataheart_backup.dump dataheart_postgres:/tmp/dataheart_backup.dump

  echo -e "\n--> 🗃️ Restaurando base de datos con pg_restore (limpiando tablas anteriores)..."
  docker compose exec -T postgres pg_restore -U dataheart -d dataheart_sc -h localhost -p 5432 -v --clean --no-acl --no-owner /tmp/dataheart_backup.dump

  echo -e "\n--> 🧹 Limpiando archivos temporales en el servidor..."
  rm -f /tmp/dataheart_backup.dump
  docker compose exec -T postgres rm -f /tmp/dataheart_backup.dump
EOF

echo -e "\n${BOLD}${GREEN}==========================================================${RESET}"
echo -e "${BOLD}${GREEN}¡Despliegue y restauración en el servidor completados!${RESET}"
echo -e "${BOLD}${GREEN}==========================================================${RESET}\n"
