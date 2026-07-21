# Guía de mantenimiento de datos en producción
**DataHeartSC — sc.danielflorez.dev**

---

## El problema central

El script `scripts/deploy_to_server.sh` actual incluye un `pg_restore --clean` al final.
Ese `--clean` **elimina todas las tablas y las recrea desde el dump local** antes de restaurar,
lo que significa que **cualquier dato ingresado en producción se pierde** con cada despliegue.

> Regla de oro: `pg_restore` es para inicialización o recuperación ante desastre.
> Un despliegue normal **nunca debe tocar la base de datos de producción** más allá de
> aplicar migraciones de esquema.

---

## Dos operaciones distintas (no mezclarlas)

| Operación | Cuándo usarla | Qué hace a los datos |
|---|---|---|
| **Despliegue normal** | Cada vez que hay código nuevo | Solo aplica migraciones de esquema. Los datos existentes NO se tocan |
| **Restauración de backup** | Inicialización del servidor o recuperación ante desastre | Reemplaza TODOS los datos con el dump |

---

## 1. Despliegue normal (preserva los datos)

Conectarse al servidor y ejecutar:

```bash
ssh prod
cd /opt/dataheart

# 1. Traer código nuevo
git pull origin main

# 2. Actualizar dependencias y compilar backend
cd backend
npm install
npx prisma migrate deploy   # <-- solo aplica migraciones nuevas, NO toca datos
npx prisma generate
npm run build

# 3. Reiniciar proceso
pm2 restart dataheart-api || pm2 start dist/main.js --name "dataheart-api"

# 4. Compilar frontend
cd ../frontend
npm install
npm run build
# Nginx sirve el build desde dist/frontend/browser/
```

**O usando el script corregido** (ver sección 4):

```bash
# Desde tu máquina local:
bash scripts/deploy_to_server.sh
```

---

## 2. Backup de producción (hacerlo ANTES de cada despliegue)

Desde el servidor:

```bash
# Crear backup con timestamp
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
docker exec dataheart_postgres pg_dump \
  -U dataheart \
  -d dataheart_sc \
  -Fc \
  -f /tmp/dataheart_backup_${TIMESTAMP}.dump

# Copiar backup fuera del contenedor
docker cp dataheart_postgres:/tmp/dataheart_backup_${TIMESTAMP}.dump \
  /opt/dataheart/backups/dataheart_backup_${TIMESTAMP}.dump

# Limpiar temporal del contenedor
docker exec dataheart_postgres rm /tmp/dataheart_backup_${TIMESTAMP}.dump
```

Desde tu máquina local (descarga el backup del servidor):

```bash
mkdir -p data/backups
scp prod:/opt/dataheart/backups/dataheart_backup_*.dump data/backups/
```

> Mantener al menos los últimos 7 backups en `/opt/dataheart/backups/`.

---

## 3. Restauración de backup (solo ante desastre o inicialización)

**ADVERTENCIA: Esto borra todos los datos actuales de producción.**

```bash
ssh prod
cd /opt/dataheart

# Copiar el dump al contenedor
docker cp backups/dataheart_backup_FECHA.dump dataheart_postgres:/tmp/restore.dump

# Restaurar (--clean elimina tablas antes de recrearlas)
docker exec dataheart_postgres pg_restore \
  -U dataheart \
  -d dataheart_sc \
  --clean --no-acl --no-owner \
  /tmp/dataheart_backup_FECHA.dump

# Limpiar
docker exec dataheart_postgres rm /tmp/restore.dump
```

---

## 4. Script de despliegue corregido

El script `scripts/deploy_to_server.sh` fue corregido para **nunca tocar los datos**.
Solo sube código, aplica migraciones y reinicia procesos:

```bash
# Desde tu máquina local:
bash scripts/deploy_to_server.sh
```

Si además necesitas actualizar el seed de roles/permisos (después de cambios en la
matriz de accesos), agrega `--seed` al final:

```bash
bash scripts/deploy_to_server.sh --seed
```

El seed es idempotente: usa `upsert` y no borra registros de usuarios ni datos operativos.

---

## 5. Verificar estado del servidor

```bash
ssh prod

# Ver procesos activos
pm2 list

# Ver logs del backend en vivo
pm2 logs dataheart-api --lines 50

# Verificar que la DB tiene datos
docker exec dataheart_postgres psql -U dataheart -d dataheart_sc -c "
  SELECT
    (SELECT COUNT(*) FROM beneficiaries)  AS beneficiarios,
    (SELECT COUNT(*) FROM clients_donors) AS clientes,
    (SELECT COUNT(*) FROM orders)         AS pedidos,
    (SELECT COUNT(*) FROM users)          AS usuarios;
"

# Ver backups disponibles
ls -lh /opt/dataheart/backups/
```

---

## 6. Estructura de directorios en el servidor

```
/opt/dataheart/
├── backend/          ← código del backend (NestJS)
├── frontend/         ← código del frontend (Angular)
│   └── dist/         ← build de producción (Nginx sirve desde aquí)
├── backups/          ← dumps de PostgreSQL con timestamp
│   └── dataheart_backup_20260721_120000.dump
├── docker-compose.yml
└── scripts/
```

---

## 7. Checklist de despliegue seguro

Antes de cada despliegue en producción:

- [ ] Hacer backup de la DB: `scp prod:/opt/dataheart/backups/...`
- [ ] Verificar que el build local compila sin errores: `npm run build`
- [ ] Revisar si hay migraciones nuevas en `backend/prisma/migrations/`
- [ ] Ejecutar `bash scripts/deploy_to_server.sh`
- [ ] Verificar que pm2 esté corriendo: `ssh prod "pm2 list"`
- [ ] Abrir `https://sc.danielflorez.dev` y hacer login manual
- [ ] Si hubo cambios en roles/permisos: ejecutar el seed en servidor

---

## Historial de cambios de esquema (migraciones)

Cada vez que se corre `npx prisma migrate dev --name <nombre>` en local se crea
un archivo en `backend/prisma/migrations/`. En producción, `npx prisma migrate deploy`
aplica solo las migraciones que aún no se han ejecutado — sin tocar filas existentes.

Para ver qué migraciones están aplicadas en producción:

```bash
ssh prod "cd /opt/dataheart/backend && npx prisma migrate status"
```
