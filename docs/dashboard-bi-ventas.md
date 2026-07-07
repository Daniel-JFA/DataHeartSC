# Dashboard de Ventas — Arquitectura BI
## DataHeartSC · Fundación Infantil Santiago Corazón

> **Versión:** 1.0 · Actualizado: 07-jul-2026  
> **Autor:** Consultoría BI interna · Sprint 9 (implementación prevista)  
> **Propósito:** Definir la lógica de negocio, KPIs y experiencia de análisis del Dashboard de Ventas antes de iniciar el desarrollo del Sprint 9.

---

## I. Filosofía de Diseño

Antes de hablar de métricas, hay que resolver **para quién es cada número**. En esta fundación coexisten dos realidades financieras que el dashboard debe separar con claridad quirúrgica:

- **Ingresos comerciales** — ventas de productos que financian la operación
- **Ingresos filantrópicos** — donaciones que sostienen la misión social

Un error frecuente es mezclarlas en el mismo flujo de caja visual. El analista pierde el hilo. La Directora toma decisiones sobre datos contaminados. La jerarquía de todo el sistema parte de esta separación.

---

## II. Jerarquía Visual — Los Tres Niveles de Lectura

### Nivel 1 — Vista Ejecutiva (lectura en 10 segundos)
La franja superior de la pantalla. Diseñada para **Directora** y **Líder Data Heart**.  
Responde una sola pregunta: **¿cómo estamos hoy vs. cómo deberíamos estar?**

Cuatro tarjetas de cifra grande con indicador de tendencia (flecha + variación porcentual vs. período anterior):

| Tarjeta | Qué muestra | Rol principal |
|---|---|---|
| Ingreso Total del Período | Ventas + donaciones combinadas | Directora |
| Ingresos por Ventas | Solo órdenes tipo Venta / ReciboCaja | Líder Data Heart |
| Ingresos por Donaciones | Solo transacciones `donations` | Líder Data Heart |
| Meta de Cumplimiento | % de avance sobre objetivo del mes | Directora |

> **Regla de diseño:** máximo 4 tarjetas en este nivel. Más de eso y la vista ejecutiva deja de ser ejecutiva.

---

### Nivel 2 — Vista Analítica (lectura en 2-3 minutos)
El cuerpo central. Diseñado para **Asistente Contable** y **Líder de Clientes Benefactores**.  
Responde: **¿por qué estamos así y qué tendencia llevamos?**

**Columna izquierda — Comportamiento temporal:**
- Evolución de ingresos semana a semana (tendencia, estacionalidad)
- Comparativa mes actual vs. mismo mes año anterior

**Columna derecha — Composición del ingreso:**
- Distribución por canal de atención (WhatsApp, Sitio Web, Tienda Física, Frecuenti, Correo)
- Distribución por tipo de orden (Venta, ReciboCaja, Remisión, NotaCredito)

---

### Nivel 3 — Vista Operativa (lectura bajo demanda)
Panel inferior o lateral expandible. Diseñado para **Líder de Clientes** y equipo operativo.  
Responde: **¿qué productos y qué clientes están moviendo los números?**

- Ranking de productos más vendidos (unidades + valor)
- Ranking de clientes/donantes por valor aportado
- Listado de últimas transacciones con estado de pago

---

## III. KPIs Primarios

Indicadores que **nunca deben faltar**, independientemente del filtro activo.

### 1. Ingreso Bruto del Período
Total facturado en el rango de fechas, sumando ventas reales (excluye NotaCredito y devoluciones).  
*Fuente: tabla `orders` — tipos Venta, ReciboCaja, Remision.*

### 2. Ticket Promedio por Orden
Ingreso bruto ÷ número de órdenes. Cuando sube, el equipo vende más por transacción. Cuando baja con ventas altas, hay proliferación de órdenes pequeñas — señal de cambio de perfil en el comprador o el canal.

### 3. Tasa de Conversión por Canal
De todos los contactos por canal, qué porcentaje terminó en orden pagada. Revela qué canales generan intención real de compra vs. solo consultas.  
*Dimensión: `orders.canal_atencion`*

### 4. Valor por Donante Activo
Total donaciones ÷ donantes únicos en el período. KPI de salud de la base filantrópica. Si baja, puede indicar entrada de muchos donantes nuevos de bajo valor (positivo) o retirada de donantes grandes (crítico).  
*Fuente: tabla `donations` + `clients_donors`*

### 5. Índice de Recurrencia
Porcentaje de clientes que compraron más de una vez en el período. Una fundación con misión social debería tener recurrencia alta — los compradores creen en la causa.

### 6. Días de Cartera
Promedio de días entre fecha de orden y pago efectivo. Revela riesgo de flujo de caja en pedidos con crédito o pago contra entrega.  
*Fuente: `orders.order_date` vs. `orders.payment_status = 'Pagado'`*

---

## IV. KPIs Secundarios

Indicadores que **explican** a los primarios. Aparecen en el Nivel 2 bajo demanda.

### Sobre el Portafolio de Productos
| KPI | Señal de alerta |
|---|---|
| Concentración de ventas (top 10 productos) | Si supera 70%: riesgo de dependencia de pocas referencias |
| Rotación por categoría | Baja rotación + alto inventario = candidato a promoción |
| Precio promedio por canal del mismo producto | Variación indica inconsistencia en política de precios |

### Sobre los Clientes
| KPI | Qué revela |
|---|---|
| Tasa de reactivación (inactivos > 90 días que volvieron) | Efecto de campañas de recuperación |
| Clientes nuevos vs. recurrentes | En etapa madura: > 60% debería ser recurrente |
| Distribución geográfica del ingreso | Optimiza logística del domiciliario por municipio |

### Sobre las Donaciones
| KPI | Qué revela |
|---|---|
| Frecuencia de donación (única vs. mensual) | Los de patrón mensual son el activo filantrópico más valioso |
| Donación promedio por gateway (Wompi / PayU / Frecuenti) | Perfil del donante según canal digital |

---

## V. Filtros y Dimensiones de Segmentación

### Dimensiones de Tiempo
- **Rango de fechas libre** — filtro universal, siempre visible
- **Comparación de período** — vs. período anterior o mismo período año pasado
- **Granularidad** — día / semana / mes / trimestre (mismo gráfico, distinta resolución)

### Dimensiones Comerciales
| Filtro | Valores disponibles | Fuente |
|---|---|---|
| Canal de atención | WhatsApp, Sitio Web, Tienda Física, Frecuenti, Correo, Interno | `orders.canal_atencion` |
| Tipo de orden | Venta, ReciboCaja, Remisión, NotaCredito, Histórico | `orders.order_type` |
| Estado de pago | Pagado, Pendiente | `orders.payment_status` |
| Categoría de producto | Donaciones, Productos, Eventos… | `products.category_name` |
| Domiciliario | Lista de repartidores | `orders.domiciliario` |

### Dimensiones Geográficas
- **Municipio de entrega** — para operaciones de envío (`orders.municipio_entrega`)
- **Ciudad del cliente** — de dónde viene la demanda (`clients_donors.city`)

### Dimensiones de Cliente
- **Tipo de persona** — Natural (CC) vs. Jurídica (NIT)
- **Segmento de valor** — Alto (top 10%) / Medio / Bajo — definir umbrales por monto histórico

> **Regla de oro:** nunca más de 5 filtros activos simultáneamente. Más de eso y el analista no sabe si está leyendo un patrón real o un artefacto de su propia segmentación.

---

## VI. Tipo de Gráfico por Pregunta Analítica

| Pregunta | Gráfico recomendado | Justificación |
|---|---|---|
| ¿Cómo evolucionan los ingresos en el tiempo? | Línea continua con área sombreada | Tendencia y volumen simultáneos |
| ¿Cómo va este mes vs. el anterior? | Barras agrupadas (2 columnas por período) | Comparación directa sin ambigüedad |
| ¿Qué canal genera más ingreso? | Barras horizontales, mayor a menor | Fácil ranking, etiquetas largas no se cortan |
| ¿Cómo se distribuye el ingreso entre categorías? | Treemap (mapa rectangular) | Proporción y jerarquía al mismo tiempo |
| ¿Cómo se distribuyen los montos de donación? | Histograma de frecuencias | Revela picos (donantes típicos) o cola larga |
| ¿Dónde están los clientes geográficamente? | Mapa de calor por municipio | La distribución territorial no se lee en tabla |
| ¿Nuevos vs. recurrentes en el tiempo? | Área apilada 100% | Muestra cómo cambia la composición de la base |
| ¿Cuáles son los 10 productos más vendidos? | Barras horizontales dobles (unidades + valor) | Evita optimizar solo por volumen |
| ¿Cómo va el cumplimiento de meta? | Barra de progreso lineal | Lectura instantánea de posición relativa |
| ¿Cuánto tarda en pagarse una orden? | Box plot por canal | Revela outliers y distribución real, no solo promedio |

---

## VII. Principios de Experiencia del Analista

### Pregunta progresiva
El dashboard permite ir de lo general a lo específico sin cambiar de pantalla.  
`WhatsApp bajó` → clic en WhatsApp → `qué productos bajaron` → `qué clientes específicos dejaron de comprar`  
Cada gráfico es la puerta al siguiente nivel de detalle.

### Contexto siempre visible
El rango de fechas activo y los filtros aplicados visibles en todo momento (esquina superior).  
El analista que olvida qué filtros tiene activos toma decisiones incorrectas.

### Anomalía resaltada
El sistema distingue visualmente entre un número "normal" y uno que se desvía del patrón histórico — con una señal discreta (punto, subrayado), no con colores alarmistas.

### Exportable significativo
La exportación entrega la **vista filtrada**, no la base de datos cruda.  
La exportación es la última milla de la decisión.

---

## VIII. Roadmap de Madurez

| Fase | Sprints | Qué se construye | Quién lo usa |
|---|---|---|---|
| **1 — Visibilidad básica** | Sprint 9 | Ingresos totales + canal + evolución temporal | Directora, Líder Data Heart |
| **2 — Diagnóstico operativo** | Sprint 10-11 | Ranking productos + comportamiento clientes + recurrencia | Equipo operativo, Asistente Contable |
| **3 — Inteligencia predictiva** | Sprint 14+ | Segmentación RFM, proyecciones, alertas de abandono | Líder Comunicaciones, Directora |

> **Nota sobre RFM** (Sprint 14): Recencia (cuándo compró por última vez) + Frecuencia (cuántas veces) + Monto (cuánto gastó) — la segmentación estándar de la industria para clasificar clientes y personalizar comunicaciones.

---

## IX. Mapeo de Roles → Accesos al Dashboard

Basado en la matriz RBAC implementada en Sprint 2:

| Rol | Nivel 1 (Ejecutivo) | Nivel 2 (Analítico) | Nivel 3 (Operativo) | Exportar |
|---|---|---|---|---|
| DIRECTORA | ✅ | ✅ Solo lectura | ❌ | ❌ |
| LIDER_DATA_HEART | ✅ | ✅ | ✅ | ✅ |
| ASISTENTE_CONTABLE | ✅ | ✅ | ✅ | ✅ |
| CONTADORA | ✅ Solo financiero | ✅ Solo financiero | ❌ | ✅ |
| LIDER_CLIENTES_BENEFACTORES | ✅ | ✅ | ✅ | ✅ |
| LIDER_ATENCION_FAMILIAS | ✅ Solo ventas | ✅ Solo ventas | ✅ | ❌ |
| LIDER_COMUNICACIONES | ❌ | ✅ Solo segmentación | ❌ | ❌ |

> Este mapeo usa los permisos `dashboards:read`, `ventas_donaciones:read` y `segmentacion:read` ya implementados.
