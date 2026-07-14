# Plan Técnico de Sprints Semanales (Optimizado y Mitigado) - Centralización de Procesos
## Cliente: Fundación Infantil Santiago Corazón
## Rol: Staff Cloud Architect & Senior Technical Project Manager
*   **Plazo Total:** 5 Meses (20 semanas de 1 semana por sprint).
*   **Enfoque de Desarrollo:** Solo Developer (Full-stack + DevOps) ➔ Requiere automatización máxima de infraestructura (PaaS/DBaaS) para eliminar sobrecargas operativas de administración de servidores.
*   **Stack Definido:** Angular (v18+) | Node.js (NestJS / TypeScript) | PostgreSQL con PostGIS | PaaS (Render/Railway/GCP Cloud Run) | DBaaS (AWS RDS/GCP Cloud SQL/Neon).

---

## 1. Mapeo de Arquitectura Cloud de Alta Disponibilidad

```mermaid
graph TD
    subgraph Canales de Ingreso
        Shopify[Shopify Storefront] -->|Webhooks HTTPS + HMAC| API
        Wompi[Wompi / PayU / Paypal] -->|Webhooks de Pago| API
    end

    subgraph Plataforma Cloud (PaaS/DBaaS)
        subgraph PaaS - Capa de Aplicación
            AngularAdmin[Admin Angular - Vercel / Cloudflare Pages] <-->|Rest API con JWT| API[NestJS API - Render / Cloud Run]
            API -->|Jobs en Cola| Queue[Redis / BullMQ]
            Queue -->|Worker Asíncrono| PDFWorker[PDF Generator Engine]
        end

        subgraph DBaaS - Capa de Datos
            API <-->|Conexión Pooling PgBouncer| DB[(PostgreSQL + PostGIS)]
            PDFWorker -->|Guardado de Adjuntos| Storage[Cloud Object Storage - AWS S3 / R2]
        end
    end

    subgraph Canales de Salida
        API -->|Notificación Transaccional| WhatsApp[WhatsApp Cloud API]
        API -->|Envío de Certificados| SMTP[Nodemailer / SendGrid]
        DB -->|Conexión Directa SQL| Looker[Looker Studio / Reportes]
    ## 2. Plan de Sprints Semana a Semana (Sprints 1 a 20)

El proyecto se estructura en **5 hitos funcionales de 4 semanas cada uno**, organizados para respetar el ciclo de vida del software, evitar cuellos de botella y garantizar que las integraciones críticas tengan sus bases listas antes de con### 📦 HITO 1: Consolidación de Bases de Datos, Migración de Access y Ventas Manuales (Semanas 1 a 4)
> [!IMPORTANT]
> **Enfoque:** Diseñar e instanciar el esquema unificado de toda la base de datos corporativa (Clientes, Beneficiarios, Voluntarios, Proveedores, Inventario, Pedidos) e importar todo el histórico de Access. Construir el formulario de pedidos reactivo en Angular (**APP Diana Fase 1**) y el exportador contable para **World Office**.

#### 📅 SPRINT 1: Cimientos Cloud y Modelado del Esquema de Datos Consolidado
*   **Tarea 1.1 [DevOps/BD] - Aprovisionamiento de PostgreSQL/Supabase**
    *   *Descripción:* Instanciar la base de datos PostgreSQL gestionada. Configurar límites de pool de conexiones y SSL forzado.
    *   *DoD:* Conexión de prueba exitosa a la base de datos cloud desde local y remoto.
*   **Tarea 1.2 [Backend] - Modelado de Todas las Tablas del Sistema en Prisma**
    *   *Descripción:* Diseñar e implementar el esquema consolidado de base de datos en el ORM Prisma. Debe incluir todas las tablas relacionales del sistema: `users`, `roles`, `clients_donors`, `beneficiaries` (niños), `volunteers`, `providers`, `products`, `inputs`, `companions`, `product_inputs` (recetas), `orders`, `order_items`, `donations` y `certificates`.
    *   *DoD:* Migración unificada inicial ejecutada en Postgres cloud mediante `npx prisma migrate status` sin errores de integridad referencial.
*   **Tarea 1.3 [Frontend] - Inicialización de Angular 18**
    *   *Descripción:* Crear el frontend Angular con enrutamiento dinámico, interceptor HTTP base y estilos CSS.
    *   *DoD:* Aplicación base compilada y desplegada en hosting estático con CI/CD automatizado desde GitHub.

#### 📅 SPRINT 2: Seguridad JWT y Migración Completa de Access (ETL)
*   **Tarea 2.1 [Backend] - Autenticación y Control de Accesos por Rol (RBAC)**
    *   *Descripción:* Implementar endpoints de login/registro (`POST /api/auth/login`) cifrando claves con `bcrypt`. Generar tokens JWT seguros con expiración de 8 horas.
    *   *DoD:* Endpoint retorna JWT y datos públicos del perfil; middleware bloquea peticiones sin token.
*   **Tarea 2.2 [Data] - Script ETL de Migración de Access a Postgres Consolidado**
    *   *Descripción:* Crear script en Python/Node que lea la base de datos histórica de Access, limpie datos inconsistentes de clientes e historial de ventas pasadas, y los cargue en el nuevo esquema de PostgreSQL unificado.
    *   *DoD:* Script de migración ejecutado exitosamente con verificación de integridad (conteo de filas de Access vs. Postgres).

#### 📅 SPRINT 3: CRM (Clientes y Donantes) y Catálogo de Productos
*   **Tarea 3.1 [Backend] - Endpoints CRUD para CRM y Catálogo**
    *   *Descripción:* Diseñar esquemas de entrada/salida y endpoints CRUD para `clients_donors` y `products` (con sus variantes/precios).
    *   *DoD:* CRUDs listos en backend con filtros de búsqueda por nombre e identificación (cuyo tiempo de respuesta sea <200ms).
*   **Tarea 3.2 [Frontend] - Tablas del CRM y Vista de Productos**
    *   *Descripción:* Diseñar en Angular las grillas interactivas del CRM (con paginación y buscador integrado al backend) y el catálogo de productos terminados.
    *   *DoD:* Formulario reactivo de creación de clientes y visualización de historial de compras migrado de Access.

#### 📅 SPRINT 4: Gestión de Pedidos Manuales y Exportador World Office (Entrega Hito 1)
*   **Tarea 4.1 [Frontend] - Formulario de Pedido Manual (Reemplazo APP Diana - Fase 1)**
    *   *Descripción:* Formulario dinámico en Angular con autocompletado del CRM y selector dinámico de productos para ventas de tienda física o ventas directas por WhatsApp/Email.
    *   *DoD:* Modificar cantidad recalcula el total automáticamente; clic en enviar crea el pedido en base de datos.
*   **Tarea 4.2 [Backend] - Exportador Contable para World Office**
    *   *Descripción:* Programar servicio de exportación a CSV/Excel con las cabeceras requeridas según la plantilla de importación contable de World Office.
    *   *DoD:* Clic en exportar descarga el archivo con los datos transaccionales del periodo seleccionado.
*   **Criterio de Aceptación Hito 1:** Toda la base de datos unificada del sistema (incluyendo beneficiarios, voluntarios y proveedores) está modelada e instanciada en PostgreSQL. El histórico de Access está completamente migrado. El personal puede registrar pedidos manuales en la nueva APP Diana y exportar transacciones contables a World Office.

---

### 📦 HITO 2: Automatización de Ingresos y Motor de Certificados (Semanas 5 a 8)
> [!IMPORTANT]
> **Enfoque:** Automatizar los canales de ingresos en línea (Shopify para ventas, Wompi/PayU para donaciones) y activar el envío automático de certificados en PDF por correo electrónico.

#### 📅 SPRINT 5: Integración de Pedidos Shopify (Webhook)
*   **Tarea 5.1 [Backend] - Captura de Webhooks de Shopify y Seguridad HMAC**
    *   *Descripción:* Endpoint `POST /api/webhooks/shopify/orders` para capturar compras de Shopify en tiempo real. Validar firma criptográfica con header `X-Shopify-Hmac-SHA256`.
    *   *DoD:* El backend rechaza firmas inválidas y procesa las válidas insertando la orden en PostgreSQL.
*   **Tarea 5.2 [Backend] - Idempotencia de Pedidos**
    *   *Descripción:* Controlar que si Shopify reintenta enviar el webhook, no se duplique el pedido en base de datos (clave única basada en ID de Shopify).
    *   *DoD:* Peticiones idénticas consecutivas producen un solo registro en la base de datos.

#### 📅 SPRINT 6: Pasarelas de Pago (Wompi y PayU Webhooks)
*   **Tarea 6.1 [Backend] - Integración de Webhooks de Wompi y PayU**
    *   *Descripción:* Desarrollar endpoints receptores de transacciones para Wompi y PayU. Identificar donantes por correo/cédula, crearlos en el CRM si no existen y registrar la transacción en `donations`.
    *   *DoD:* Los pagos aprobados simulan la creación/asociación del donante y el registro del ingreso exitosamente.

#### 📅 SPRINT 7: Motor de Certificados PDF (Cola Asíncrona)
*   **Tarea 7.1 [Backend/DevOps] - Setup de Cola de Tareas (BullMQ + Redis)**
    *   *Descripción:* Configurar una cola Redis para el procesamiento en segundo plano. Esto evita retrasos en la API al generar archivos grandes.
    *   *DoD:* Conexión y encolamiento de tareas de prueba verificado.
*   **Tarea 7.2 [Backend] - Worker de Generación de PDFs y Carga a Cloud Storage**
    *   *Descripción:* Desarrollar el script que lee los datos de la donación, genera el PDF del certificado firmado y lo sube automáticamente a un almacenamiento seguro (AWS S3 / Cloudflare R2).
    *   *DoD:* URLs seguras y temporales del PDF guardadas en la tabla `certificates`.

#### 📅 SPRINT 8: Automatización SMTP (Correo), Descarga Web y Dashboard de Monitoreo Inicial (Entrega Hito 2)
*   **Tarea 8.1 [Backend] - Envío SMTP Automático al Donar**
    *   *Descripción:* Integrar Nodemailer apuntando al servidor de correo de la fundación. Al procesarse la donación en la cola, enviar automáticamente un correo con el PDF adjunto.
    *   *DoD:* Flujo simulado completo (Webhook pago -> Generación PDF -> Recepción de email con adjunto).
*   **Tarea 8.2 [Frontend] - Historial y Descarga de Certificados**
    *   *Descripción:* Pantalla en Angular para listar certificados generados, con botones de descarga segura y opción de "Reenviar por correo" manualmente.
    *   *DoD:* Clic abre el PDF directamente del Cloud Storage.
*   **Tarea 8.3 [Frontend] - Tablero de Monitoreo Inicial (Ingresos en Tiempo Real)**
    *   *Descripción:* Diseñar una pantalla de inicio sencilla en Angular con tarjetas informativas de indicadores clave de control (KPIs: total de pedidos Shopify acumulados, total de donaciones aprobadas en el mes, y un listado en vivo de las últimas 10 transacciones).
    *   *DoD:* La pantalla de inicio del panel muestra estadísticas básicas y actividades recientes al cargar.
*   **Criterio de Aceptación Hito 2:** Las compras en Shopify y donaciones en Wompi/PayU ingresan solas al sistema en segundos y se autogenera el PDF de certificado. El operador cuenta con un tablero de control inicial en Angular para monitorear el flujo de ingresos en tiempo real.

---

### 📦 HITO 3: Gestión de Beneficiarios, WhatsApp API y Dashboard Diana (Semanas 9 a 12)
> [!IMPORTANT]
> **Enfoque:** Desarrollar las vistas de administración para la base de datos de Beneficiarios (ya existente desde el Hito 1), habilitar las notificaciones por WhatsApp API, e integrar el Dashboard Operativo y Reportes de Dirección.

#### 📅 SPRINT 9: Pantallas de Administración de Beneficiarios (Niños)
*   **Tarea 9.1 [Backend/Frontend] - CRUD Visual de Beneficiarios**
    *   *Descripción:* Desarrollar los endpoints y las pantallas en Angular para visualizar, buscar y actualizar los registros de la tabla `beneficiaries`.
    *   *DoD:* CRUD completo operativo en el panel administrativo que permite asociar patrocinios de donantes a niños.

#### 📅 SPRINT 10: Notificaciones por WhatsApp Business API
*   **Tarea 10.1 [Backend] - Integración de API WhatsApp Cloud**
    *   *Descripción:* Programar servicio HTTP para enviar mensajes automáticos usando plantillas aprobadas de Meta API.
    *   *DoD:* Notificar despacho de pedido al cliente o enviar agradecimiento con link de descarga de certificado en PDF al donante automáticamente por WhatsApp.

#### 📅 SPRINT 11: Pasarela PayPal y Sincronización de Correos Masivos
*   **Tarea 11.1 [Backend] - Webhook/IPN PayPal**
    *   *Descripción:* Integrar la recepción de pagos internacionales por PayPal.
    *   *DoD:* Donaciones PayPal registradas con su respectivo certificado generado.
*   **Tarea 11.2 [Backend] - Sync con Mailchimp / Mailerlite**
    *   *Descripción:* Sincronización de los nuevos correos del CRM hacia las listas de Mailchimp/Mailerlite.
    *   *DoD:* Donante nuevo aparece en Mailchimp de forma automática.

#### 📅 SPRINT 12: Dashboard Operativo y KPIs Públicos (Entrega Hito 3)
*   **Tarea 12.1 [Frontend] - Panel de Control de Pedidos (Reemplazo APP Diana - Dashboard)**
    *   *Descripción:* Diseñar la grilla de administración de órdenes en tiempo real en Angular, con filtros y botones interactivos para el cambio de estados de envío.
    *   *DoD:* Cambiar el estado de un pedido desde el dashboard actualiza Postgres y dispara la notificación de WhatsApp.
*   **Tarea 12.2 [Frontend] - Panel de Gráficos de Gestión (Looker Studio) y KPIs Públicos**
    *   *Descripción:* Gráficos en Angular usando `ngx-charts` con métricas financieras y visualización de KPIs públicos en un iframe.
    *   *DoD:* Métricas se actualizan de forma instantánea según la base de datos unificada.
*   **Criterio de Aceptación Hito 3:** Pantallas de gestión de beneficiarios listas, el tablero centralizado de órdenes de la APP Diana operando en Angular y las métricas financieras integradas en tiempo real.

---

### 📦 HITO 4: Gestión de Voluntarios, Segmentación Avanzada y Geolocalización (Semanas 13 a 16)
> [!IMPORTANT]
> **Enfoque:** Desarrollar las vistas de administración para la base de datos de Voluntarios, habilitar segmentación de donantes en PostgreSQL (sin Databricks) y construir el mapa interactivo.

#### 📅 SPRINT 13: Pantallas de Administración de Voluntarios
*   **Tarea 13.1 [Backend/Frontend] - CRUD Visual de Voluntarios**
    *   *Descripción:* Desarrollar los endpoints y vistas en Angular para registrar, actualizar e interconectar a la tabla `volunteers` con las campañas activas.
    *   *DoD:* Altas, bajas y asignación de voluntarios operativas en el software.

#### 📅 SPRINT 14: Segmentador de Donantes Avanzado (Reemplazo de Databricks)
*   **Tarea 14.1 [Backend/Frontend] - Query Builder de Segmentación en Postgres**
    *   *Descripción:* Desarrollar un filtro avanzado en Angular/Postgres para agrupar donantes según criterios compuestos directamente en SQL.
    *   *DoD:* Generación del segmento de donantes en segundos con opción de exportar a CSV para Mailchimp.

#### 📅 SPRINT 15: Geolocalización Espacial (PostGIS Setup)
*   **Tarea 15.1 [Backend/Data] - Geocodificación de Direcciones**
    *   *Descripción:* Script backend que convierte las direcciones de los donantes y clientes en puntos geométricos `Point` de PostGIS.
    *   *DoD:* Columna `geom` poblada con latitud y longitud válidas.

#### 📅 SPRINT 16: Mapa Interactivo de Impacto (Leaflet) (Entrega Hito 4)
*   **Tarea 16.1 [Frontend] - Visualizador de Mapa Leaflet en Angular**
    *   *Descripción:* Integrar mapa Leaflet en Angular y la web pública pintando clusters y heatmaps de donantes agrupados por barrios/comunas.
    *   *DoD:* Mapa carga de forma dinámica mostrando densidad de impacto.
*   **Criterio de Aceptación Hito 4:** Pantallas de gestión de voluntarios integradas, segmentador de donantes dinámico funcionando de forma local y mapa interactivo de calor espacial de donantes operando en producción.

---

### 📦 HITO 5: Inventarios, Proveedores y Ajustes Transaccionales (Semanas 17 a 20)
> [!IMPORTANT]
> **Enfoque:** Incorporar el control de inventario avanzado (insumos, recetas y acompañantes de los productos), asegurar las deducciones automáticas seguras y realizar la capacitación y el despliegue final.

#### 📅 SPRINT 17: Catálogo de Inventario Avanzado e Insumos
*   **Tarea 17.1 [Backend/Frontend] - Módulo de Insumos, Acompañantes y Recetas**
    *   *Descripción:* Crear tablas `inputs` (materia prima como hilos, telas), `companions` (bolsas, moños) y `recipes` (cuántos insumos requiere cada producto). Crear las pantallas de configuración en Angular.
    *   *DoD:* Crear una receta vinculando un producto terminado con sus respectivos insumos requeridos.

#### 📅 SPRINT 18: Ajustes Manuales e Indicadores de Stock Mínimo
*   **Tarea 18.1 [Backend/Frontend] - Movimientos de Inventario y Alertas**
    *   *Descripción:* Tabla `inventory_movements` para auditoría de stock. Diseñar modal en Angular para registrar ajustes manuales (daños, mermas). Destacar en color rojo los insumos o productos por debajo del stock mínimo.
    *   *DoD:* Ajuste manual actualiza stock e inserta log con el usuario responsable.

#### 📅 SPRINT 19: Descuento Dinámico Transaccional y Concurrencia (ACID)
*   **Tarea 19.1 [Backend] - Lógica de Descuento de Stock en Transacciones SQL**
    *   *Descripción:* Desarrollar el disparador transaccional que, al cambiar un pedido de Shopify o tienda física a estado "En preparación", descuente el stock de insumos usando bloqueo pesimista `SELECT ... FOR UPDATE` de Postgres para evitar stock negativo en ventas concurrentes.
    *   *DoD:* Si no hay insumos suficientes, la venta se bloquea con alerta controlada y hace rollback de la transacción.

#### 📅 SPRINT 20: Despliegue Final, Backups y Capacitación (Entrega Hito 5)
*   **Tarea 20.1 [DevOps] - Despliegue en Servidor Definitivo con HTTPS**
    *   *Descripción:* Compilar Angular y NestJS en producción. Configurar dominio oficial, SSL con Let's Encrypt y un cron job para backups diarios de PostgreSQL subidos a la nube.
    *   *DoD:* Dominio HTTPS activo y seguro; archivo SQL de backup verificado en la nube.
*   **Tarea 20.2 [Gestión] - Capacitación de Personal y Acta de Entrega**
    *   *Descripción:* Sesión grabada de capacitación a directivos y operadores en el uso del CRM, pedidos, inventario e interpretación de reportes contables.
    *   *DoD:* Acta de entrega del proyecto firmada y entrega final de repositorios.
*   **Criterio de Aceptación Hito 5:** Sistema operativo al 100% en producción con descuento inteligente de existencias integrado a las ventas, personal capacitado y backups automáticos activos.
/ Gestión] - Pruebas de Sistema, Capacitación y Firma de Acta**
    *   *Descripción:* Realizar pruebas funcionales cruzadas de todo el flujo del software. Capacitar al personal administrativo de la fundación y realizar la firma del acta de entrega.
    *   *Criterio de Aceptación:* Todos los flujos funcionan sin fallos, el personal sabe registrar inventarios y pedidos, y el proyecto se marca como completado y entregado.
