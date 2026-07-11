-- ============================================================
-- Catch-up migration: columnas aplicadas directamente con psql
-- en Sprint 2b (ETL Excel) y Sprint ~4b (Módulo Proveedores)
-- ============================================================

-- ── orders: campos ETL Excel ──────────────────────────────
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "order_type" TEXT NOT NULL DEFAULT 'Venta';
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "invoice_number" TEXT;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "canal_atencion" TEXT;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "municipio_entrega" TEXT;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "domiciliario" TEXT;
CREATE INDEX IF NOT EXISTS "orders_invoice_number_idx" ON "orders"("invoice_number");

-- ── products: campos ETL Excel ────────────────────────────
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "category_name" TEXT;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "subcategory_name" TEXT;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "external_id" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "products_external_id_key" ON "products"("external_id");

-- ── providers: expansión SAGRILAFT ───────────────────────
ALTER TABLE "providers" ADD COLUMN IF NOT EXISTS "department" TEXT;
ALTER TABLE "providers" ADD COLUMN IF NOT EXISTS "tipo_solicitud" TEXT;
ALTER TABLE "providers" ADD COLUMN IF NOT EXISTS "tipo_solicitud_otro" TEXT;
ALTER TABLE "providers" ADD COLUMN IF NOT EXISTS "naturaleza" TEXT;
ALTER TABLE "providers" ADD COLUMN IF NOT EXISTS "forma_pago_tipo" TEXT;
ALTER TABLE "providers" ADD COLUMN IF NOT EXISTS "dias_credito" TEXT;
ALTER TABLE "providers" ADD COLUMN IF NOT EXISTS "lugar_expedicion" TEXT;
ALTER TABLE "providers" ADD COLUMN IF NOT EXISTS "fecha_expedicion" TEXT;
ALTER TABLE "providers" ADD COLUMN IF NOT EXISTS "nationality" TEXT;
ALTER TABLE "providers" ADD COLUMN IF NOT EXISTS "departamento_residencia" TEXT;
ALTER TABLE "providers" ADD COLUMN IF NOT EXISTS "ciudad_residencia" TEXT;
ALTER TABLE "providers" ADD COLUMN IF NOT EXISTS "telefono_domicilio" TEXT;
ALTER TABLE "providers" ADD COLUMN IF NOT EXISTS "primer_apellido" TEXT;
ALTER TABLE "providers" ADD COLUMN IF NOT EXISTS "segundo_apellido" TEXT;
ALTER TABLE "providers" ADD COLUMN IF NOT EXISTS "primer_nombre" TEXT;
ALTER TABLE "providers" ADD COLUMN IF NOT EXISTS "segundo_nombre" TEXT;
ALTER TABLE "providers" ADD COLUMN IF NOT EXISTS "nit" TEXT;
ALTER TABLE "providers" ADD COLUMN IF NOT EXISTS "digito_verificacion" TEXT;
ALTER TABLE "providers" ADD COLUMN IF NOT EXISTS "correo_empresa" TEXT;
ALTER TABLE "providers" ADD COLUMN IF NOT EXISTS "telefono_empresa" TEXT;
ALTER TABLE "providers" ADD COLUMN IF NOT EXISTS "direccion_oficina" TEXT;
ALTER TABLE "providers" ADD COLUMN IF NOT EXISTS "rep_legal" JSONB;
ALTER TABLE "providers" ADD COLUMN IF NOT EXISTS "actividad_tipo" TEXT;
ALTER TABLE "providers" ADD COLUMN IF NOT EXISTS "actividad_otro" TEXT;
ALTER TABLE "providers" ADD COLUMN IF NOT EXISTS "codigo_ciiu" TEXT;
ALTER TABLE "providers" ADD COLUMN IF NOT EXISTS "descripcion_actividad" TEXT;
ALTER TABLE "providers" ADD COLUMN IF NOT EXISTS "forma_pago" TEXT;
ALTER TABLE "providers" ADD COLUMN IF NOT EXISTS "tipo_cuenta" TEXT;
ALTER TABLE "providers" ADD COLUMN IF NOT EXISTS "numero_cuenta" TEXT;
ALTER TABLE "providers" ADD COLUMN IF NOT EXISTS "dias_pago" TEXT;
ALTER TABLE "providers" ADD COLUMN IF NOT EXISTS "fact_nombre" TEXT;
ALTER TABLE "providers" ADD COLUMN IF NOT EXISTS "fact_cargo" TEXT;
ALTER TABLE "providers" ADD COLUMN IF NOT EXISTS "fact_telefono" TEXT;
ALTER TABLE "providers" ADD COLUMN IF NOT EXISTS "fact_ext" TEXT;
ALTER TABLE "providers" ADD COLUMN IF NOT EXISTS "fact_celular" TEXT;
ALTER TABLE "providers" ADD COLUMN IF NOT EXISTS "fact_email" TEXT;
ALTER TABLE "providers" ADD COLUMN IF NOT EXISTS "referencias" JSONB;
ALTER TABLE "providers" ADD COLUMN IF NOT EXISTS "accionistas" JSONB;
ALTER TABLE "providers" ADD COLUMN IF NOT EXISTS "total_activos" TEXT;
ALTER TABLE "providers" ADD COLUMN IF NOT EXISTS "total_pasivos" TEXT;
ALTER TABLE "providers" ADD COLUMN IF NOT EXISTS "total_patrimonio" TEXT;
ALTER TABLE "providers" ADD COLUMN IF NOT EXISTS "ingresos_mensuales" TEXT;
ALTER TABLE "providers" ADD COLUMN IF NOT EXISTS "egresos_mensuales" TEXT;
ALTER TABLE "providers" ADD COLUMN IF NOT EXISTS "otros_ingresos_mensuales" TEXT;
ALTER TABLE "providers" ADD COLUMN IF NOT EXISTS "concepto_otros_ingresos" TEXT;
ALTER TABLE "providers" ADD COLUMN IF NOT EXISTS "operaciones" JSONB;
ALTER TABLE "providers" ADD COLUMN IF NOT EXISTS "maneja_recursos_publicos" BOOLEAN;
ALTER TABLE "providers" ADD COLUMN IF NOT EXISTS "tiene_reconocimiento_publico" BOOLEAN;
ALTER TABLE "providers" ADD COLUMN IF NOT EXISTS "ejerce_poder" BOOLEAN;
ALTER TABLE "providers" ADD COLUMN IF NOT EXISTS "es_familiar_ppe" BOOLEAN;
ALTER TABLE "providers" ADD COLUMN IF NOT EXISTS "familiar_ppe_info" TEXT;
ALTER TABLE "providers" ADD COLUMN IF NOT EXISTS "acepta_declaracion" BOOLEAN;
ALTER TABLE "providers" ADD COLUMN IF NOT EXISTS "acepta_tratamiento_datos" BOOLEAN;
ALTER TABLE "providers" ADD COLUMN IF NOT EXISTS "rut_path" TEXT;
ALTER TABLE "providers" ADD COLUMN IF NOT EXISTS "camara_comercio_path" TEXT;
ALTER TABLE "providers" ADD COLUMN IF NOT EXISTS "cert_bancaria_path" TEXT;
ALTER TABLE "providers" ADD COLUMN IF NOT EXISTS "formato_proveedor_path" TEXT;
ALTER TABLE "providers" ALTER COLUMN "status" SET DEFAULT 'Pendiente';
