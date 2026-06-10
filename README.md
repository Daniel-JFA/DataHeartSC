# DataHeartSC - Plataforma Centralizada ERP/CRM
## Cliente: Fundación Infantil Santiago Corazón
## Desarrollador: Daniel Jaime Florez Aguirre

DataHeartSC es una plataforma corporativa a medida diseñada para integrar, centralizar y automatizar los procesos operativos, comerciales, de recaudo de donaciones y de control de inventarios de la **Fundación Infantil Santiago Corazón**. 

El proyecto está estructurado bajo un esquema de **Monorepositorio** que agrupa tanto el frontend administrativo como el backend y la persistencia de datos.

---

## 📁 Estructura del Proyecto

*   📂 **[`/frontend`](file:///home/djfa/Dev/projects/Propios/SC/frontend)**: Aplicación web administrativa desarrollada en **Angular v18** utilizando estilos responsivos con **Tailwind CSS**.
*   📂 **[`/backend`](file:///home/djfa/Dev/projects/Propios/SC/backend)**: Capa de aplicación y servicios API desarrollada en **NestJS** (Node.js) utilizando **TypeScript**.
*   📂 **[`/backend/prisma`](file:///home/djfa/Dev/projects/Propios/SC/backend/prisma)**: Definición del esquema de datos relacional y migraciones con **Prisma ORM**.
*   📄 **[`estimacion_entregas_propuesta_2.md`](file:///home/djfa/Dev/projects/Propios/SC/estimacion_entregas_propuesta_2.md)**: Planificación y alcance de las entregas funcionales acordadas.
*   📄 **[`plan_sprints_tecnico.md`](file:///home/djfa/Dev/projects/Propios/SC/plan_sprints_tecnico.md)**: Cronograma técnico detallado de **20 Sprints semanales** para el equipo de desarrollo.

---

## 🛠️ Stack Tecnológico Principal
*   **Frontend:** Angular 18+, RxJS, Tailwind CSS.
*   **Backend:** NestJS, TypeScript, BullMQ (cola de tareas asíncronas), Redis.
*   **Base de Datos:** PostgreSQL (Dedicado) + Extensión espacial **PostGIS**.
*   **ORM:** Prisma ORM.
*   **Infraestructura:** Servicios administrados PaaS (ej. Render/Railway/GCP Cloud Run) y DBaaS (AWS RDS/GCP Cloud SQL/Neon).
*   **Almacenamiento de Certificados:** Cloud Object Storage (S3 / Cloudflare R2).
*   **Integraciones de Terceros:** Shopify API (Venta online), Wompi/PayU/PayPal API (Donaciones), WhatsApp Business API (Notificaciones transaccionales) y Correo SMTP.

---

## 🚀 Instalación y Desarrollo en Local

### Requisitos Previos
Asegúrate de tener instalado en tu sistema:
*   Node.js (versión 18 o superior recomendada)
*   npm (versión 9 o superior)
*   Motor de base de datos PostgreSQL activo (con extensión PostGIS instalada)

### 1. Configuración de Base de Datos y Backend
1. Navega al directorio del servidor backend:
   ```bash
   cd backend
   ```
2. Instala las dependencias del proyecto:
   ```bash
   npm install
   ```
3. Crea un archivo de variables de entorno `.env` en la raíz de `/backend` basado en las necesidades de tu base de datos local:
   ```env
   DATABASE_URL="postgresql://USUARIO:CONTRASEÑA@localhost:5432/BASE_DATOS?schema=public"
   JWT_SECRET="una-clave-secreta-segura"
   ```
4. Ejecuta las migraciones de Prisma para modelar las tablas relacionales y poblar los roles iniciales de base de datos:
   ```bash
   npx prisma migrate dev
   ```
5. Inicia el servidor de desarrollo del backend:
   ```bash
   npm run start:dev
   ```

### 2. Configuración del Frontend
1. Abre una nueva terminal y navega al directorio del cliente frontend:
   ```bash
   cd frontend
   ```
2. Instala las dependencias de Angular:
   ```bash
   npm install
   ```
3. Inicia el servidor de desarrollo de Angular:
   ```bash
   npm run start
   ```
4. Abre tu navegador e ingresa a `http://localhost:4200` para visualizar el panel de administración.

---

## 🔒 Buenas Prácticas de Desarrollo y Seguridad
*   **Validación de Firmas (Webhooks):** Todos los webhooks de Shopify y pasarelas de pago deben validar sus firmas criptográficas (HMAC SHA256) antes de procesar cualquier payload.
*   **Concurrencia:** Utilizar transacciones de base de datos y bloqueos pesimistas (`SELECT ... FOR UPDATE`) en el backend al realizar deducciones de stock de productos y materias primas.
*   **Autenticación:** Toda petición a endpoints protegidos de la API requiere el paso del token JWT en la cabecera `Authorization: Bearer <token>`.
