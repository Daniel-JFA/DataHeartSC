# Guía de despliegue — DataHeartSC

Servidor remoto con Docker Compose (`docker-compose.prod.yml`).

---

## 1. Primera vez (setup inicial del servidor)

```bash
# Copiar el repo al servidor
git clone <url-del-repo> /opt/dataheart
cd /opt/dataheart

# Crear el archivo de variables de entorno
cp .env.production.example .env.production
nano .env.production          # completar todas las variables

# Levantar todo
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build
```

Las migraciones de base de datos **corren automáticamente** al arrancar el contenedor `backend`.

---

## 2. Actualizar producción (el caso normal)

```bash
# En el servidor remoto
cd /opt/dataheart

# Traer los cambios
git pull origin main

# Reconstruir backend y frontend, dejar postgres y redis intactos
docker compose -f docker-compose.prod.yml --env-file .env.production \
  up -d --build backend frontend

# Ver que todo arrancó bien (las migraciones aparecen aquí)
docker compose -f docker-compose.prod.yml logs backend --tail=60 --follow
```

Si todo está bien verás algo como:
```
Running migration: 20260803171732_add_observaciones_privadas_motivo_rechazo
🚀 Application is running on: http://[::]:3000
```

---

## 3. Cargar datos desde los archivos Excel (ETL)

Esto se hace **después** de que el backend esté corriendo.

### Opción A — Correr el ETL desde tu máquina local apuntando a la DB remota

Requiere que el puerto 5432 del servidor sea accesible (o túnel SSH).

```bash
# Túnel SSH (si el puerto no está expuesto directamente)
ssh -L 5433:localhost:5432 usuario@IP_SERVIDOR &

# Correr el ETL apuntando al túnel
cd scripts/etl
DB_URL="postgresql://dataheart:PASSWORD_PROD@localhost:5433/dataheart_sc" \
  python3 migrate_excel.py
```

### Opción B — Copiar los archivos Excel al servidor y correr el ETL allá

```bash
# Copiar los 3 archivos Excel al servidor
scp "BD Ventas y Donaciones.xlsx" \
    "BD Productos por Categoria.xlsx" \
    "BD Clientes Benefactores.xlsx" \
    usuario@IP_SERVIDOR:/opt/dataheart/

# Entrar al servidor y correr el ETL
ssh usuario@IP_SERVIDOR
cd /opt/dataheart

# Instalar dependencias Python si no están
pip3 install pandas psycopg2-binary openpyxl

# Leer el password de la DB desde .env.production
source .env.production
DB_URL="postgresql://${DB_USER}:${DB_PASSWORD}@localhost:5432/${DB_NAME}" \
  python3 scripts/etl/migrate_excel.py
```

> **Nota:** el ETL es idempotente — puede correrse múltiples veces sin duplicar datos.
> Clientes existentes se actualizan con teléfono/email/dirección/ciudad si estaban vacíos.

---

## 4. Verificar el estado de la base de datos

```bash
# En el servidor
docker exec -it dataheart_postgres psql -U dataheart -d dataheart_sc -c "
  SELECT
    (SELECT COUNT(*) FROM clients_donors) AS clientes,
    (SELECT COUNT(*) FROM products)       AS productos,
    (SELECT COUNT(*) FROM orders)         AS ordenes,
    (SELECT COUNT(*) FROM donations)      AS donaciones;
"
```

---

## 5. Rollback de emergencia

```bash
# Volver a la versión anterior del código
git log --oneline -10          # identificar el commit anterior
git checkout <commit-anterior>
docker compose -f docker-compose.prod.yml --env-file .env.production \
  up -d --build backend frontend

# Nota: las migraciones de DB no se revierten automáticamente.
# Si hay un problema de schema contactar al desarrollador.
```

---

## Migraciones pendientes en este deploy

| Migración | Descripción |
|---|---|
| `20260803171732_add_observaciones_privadas_motivo_rechazo` | Agrega campos `observacionesPrivadas` en beneficiarios y `motivoRechazo` en proveedores |

Se aplican automáticamente al levantar el backend.
