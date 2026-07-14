# Guía de Despliegue para la IA del Servidor (DataHeartSC)
**Fecha:** 14 de Julio de 2026

Este archivo contiene las instrucciones técnicas para que el agente de IA que opere en el servidor de producción (`sc.danielflorez.dev`) realice el despliegue de los nuevos módulos (Caracterización de Familias, Webhooks de Shopify y Dashboard Premium) y restaure la base de datos histórica.

---

## 1. Actualización de Código (Git Pull)
Ejecuta la actualización del código desde la rama `main` en el directorio de producción del servidor:
```bash
cd /opt/dataheart
git pull origin main
```

---

## 2. Configuración de Variables de Entorno
Asegúrate de que el archivo `.env` del backend en el servidor (`/opt/dataheart/backend/.env`) tenga la variable del webhook de Shopify agregada:
```env
SHOPIFY_WEBHOOK_SECRET="e8a7dae6edf92c4ea496d50304ee42ef7ed7cff2a3ff86f7f948d3b886d0159d"
```

---

## 3. Compilación y Despliegue del Backend
El backend utiliza **NestJS + Prisma**. Ejecuta los siguientes pasos para instalar dependencias, generar los tipos del cliente Prisma y reiniciar la aplicación:
```bash
cd /opt/dataheart/backend
npm install
npx prisma generate
npm run build
pm2 restart dataheart-api   # O el nombre del proceso asignado en PM2
```

---

## 4. Compilación y Despliegue del Frontend
El frontend utiliza **Angular 18**. Ejecuta la instalación y la compilación para producción:
```bash
cd /opt/dataheart/frontend
npm install
npm run build              # Esto generará los archivos estáticos en dist/
```
*Nota: Asegúrate de que Nginx esté apuntando correctamente al directorio `dist/` generado.*

---

## 5. Sincronización e Importación de la Base de Datos (Respaldo)
Para importar todos los registros históricos localizados en local (15,594 clientes, 1,002 beneficiarios y 25,151 órdenes), debes restaurar el dump de base de datos.

### Pasos para la Restauración en Docker:
1. Asegúrate de transferir el archivo `dataheart_backup.dump` al servidor (o cópialo si ya lo incluiste).
2. Copia el archivo al interior del contenedor Docker de PostgreSQL:
   ```bash
   docker cp /tmp/dataheart_backup.dump dataheart_postgres:/tmp/
   ```
3. Ejecuta la restauración binaria usando `pg_restore` (la bandera `--clean` asegura que las tablas antiguas se limpien previamente para evitar duplicados):
   ```bash
   docker compose exec postgres pg_restore -U dataheart -d dataheart_sc -h localhost -p 5432 -v --clean --no-acl --no-owner /tmp/dataheart_backup.dump
   ```

---

## 6. Verificación de Rutas y Logs
Una vez desplegado todo, verifica los siguientes puntos clave:
* **Webhook Shopify:** Haz una petición POST de prueba a `https://sc.danielflorez.dev/api/webhooks/shopify/orders` (debería retornar 401 Unauthorized si la firma no es válida, confirmando que la seguridad HMAC funciona).
* **Formulario de Caracterización:** Verifica que la ruta `https://sc.danielflorez.dev/familias/caracterizacion` sea accesible públicamente sin requerir token JWT.
* **Dashboard:** Verifica que las nuevas gráficas carguen los datos correctamente haciendo una llamada a `GET https://sc.danielflorez.dev/api/dashboard/stats`.
