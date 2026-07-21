#!/usr/bin/env bash
# configure_server.sh
# Configura variables de entorno y reinicia servicios en el servidor de producción.
# Ejecutar desde /opt/dataheart/:  bash scripts/configure_server.sh

set -euo pipefail

RESET='\033[0m'; BOLD='\033[1m'
GREEN='\033[32m'; YELLOW='\033[33m'; CYAN='\033[36m'; RED='\033[31m'

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="$ROOT_DIR/backend/.env"

ok()   { echo -e "${GREEN}[  OK  ]${RESET} $*"; }
log()  { echo -e "${CYAN}[setup]${RESET} $*"; }
warn() { echo -e "${YELLOW}[ WARN ]${RESET} $*"; }

echo -e "\n${BOLD}${CYAN}DataHeartSC — Configuración del servidor${RESET}\n"

# ── 1. SHOPIFY_WEBHOOK_SECRET ──────────────────────────────────
SHOPIFY_SECRET="e8a7dae6edf92c4ea496d50304ee42ef7ed7cff2a3ff86f7f948d3b886d0159d"

log "Configurando SHOPIFY_WEBHOOK_SECRET en $ENV_FILE ..."

if grep -q "SHOPIFY_WEBHOOK_SECRET" "$ENV_FILE" 2>/dev/null; then
  # Actualizar si ya existe
  sed -i "s|^SHOPIFY_WEBHOOK_SECRET=.*|SHOPIFY_WEBHOOK_SECRET=\"$SHOPIFY_SECRET\"|" "$ENV_FILE"
  ok "SHOPIFY_WEBHOOK_SECRET actualizado."
else
  # Agregar si no existe
  echo "SHOPIFY_WEBHOOK_SECRET=\"$SHOPIFY_SECRET\"" >> "$ENV_FILE"
  ok "SHOPIFY_WEBHOOK_SECRET agregado."
fi

# ── 2. Verificar Nginx proxy /api ──────────────────────────────
log "Verificando configuración de Nginx para /api ..."

NGINX_OK=false
for f in /etc/nginx/sites-enabled/*; do
  if grep -q "proxy_pass.*3000\|proxy_pass.*localhost" "$f" 2>/dev/null; then
    NGINX_OK=true
    ok "Nginx ya tiene proxy configurado en: $f"
    break
  fi
done

if ! $NGINX_OK; then
  warn "No se encontró proxy /api en Nginx. Buscando el archivo de config..."
  NGINX_CONF=$(ls /etc/nginx/sites-enabled/ 2>/dev/null | head -1)

  if [[ -z "$NGINX_CONF" ]]; then
    warn "No hay archivos en sites-enabled. Revisa Nginx manualmente."
  else
    CONF_FILE="/etc/nginx/sites-enabled/$NGINX_CONF"
    log "Agregando bloque location /api/ en $CONF_FILE ..."

    # Insertar location /api/ antes del cierre del primer bloque server
    sudo sed -i '/^}/i \
    location /api/ {\
        proxy_pass http://localhost:3000/;\
        proxy_http_version 1.1;\
        proxy_set_header Upgrade $http_upgrade;\
        proxy_set_header Connection "upgrade";\
        proxy_set_header Host $host;\
        proxy_set_header X-Real-IP $remote_addr;\
        proxy_cache_bypass $http_upgrade;\
    }' "$CONF_FILE"

    sudo nginx -t && sudo systemctl reload nginx
    ok "Nginx actualizado y recargado."
  fi
fi

# ── 3. Rebuild y restart backend ───────────────────────────────
log "Compilando backend y reiniciando pm2..."
cd "$ROOT_DIR/backend"
npm run build
pm2 restart dataheart-api || pm2 start dist/main.js --name "dataheart-api"
ok "Backend reiniciado."

# ── 4. Verificación final ──────────────────────────────────────
echo ""
log "Verificando endpoint de Shopify..."
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:3000/webhooks/shopify/orders \
  -H "Content-Type: application/json" \
  -H "x-shopify-hmac-sha256: test" \
  -d '{"id":1}' 2>/dev/null || echo "000")

if [[ "$STATUS" == "401" ]]; then
  ok "Endpoint responde 401 (HMAC inválido) — webhook secret activo y funcionando."
elif [[ "$STATUS" == "400" ]]; then
  warn "Endpoint responde 400 — puede que falte rawBody middleware. Revisa main.ts."
else
  warn "Endpoint responde $STATUS — revisa los logs: pm2 logs dataheart-api"
fi

echo -e "\n${BOLD}${GREEN}======================================${RESET}"
echo -e "${BOLD}${GREEN}  Configuración completada.${RESET}"
echo -e "${BOLD}${GREEN}======================================${RESET}"
echo -e "  Shopify URL:  ${CYAN}https://sc.danielflorez.dev/api/webhooks/shopify/orders${RESET}"
echo -e "  Logs:         ${CYAN}pm2 logs dataheart-api${RESET}\n"
