import {
  IsString,
  IsNotEmpty,
  IsEmail,
  IsOptional,
  IsBoolean,
  IsIn,
} from 'class-validator';
import { Transform } from 'class-transformer';

function toBool(value: unknown): boolean | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  if (typeof value === 'boolean') return value;
  return value === 'true' || value === true;
}

function toJson(value: unknown): unknown {
  if (value === undefined || value === null || value === '') return undefined;
  if (typeof value === 'string') {
    try { return JSON.parse(value); } catch { return undefined; }
  }
  return value;
}

export class RegisterProviderDto {
  // ── Base ──────────────────────────────────────────────────────────
  @IsString() @IsNotEmpty()
  name: string;

  @IsIn(['CC', 'NIT', 'CE'])
  docType: string;

  @IsString() @IsNotEmpty()
  docNumber: string;

  @IsString() @IsOptional()
  contactName?: string;

  @IsString() @IsOptional()
  phone?: string;

  @IsEmail() @IsOptional()
  email?: string;

  @IsString() @IsOptional()
  address?: string;

  @IsString() @IsOptional()
  city?: string;

  @IsString() @IsOptional()
  department?: string;

  // ── Sección 1 - Tipo de solicitud ─────────────────────────────────
  @IsString() @IsOptional()
  tipoSolicitud?: string;

  @IsString() @IsOptional()
  tipoSolicitudOtro?: string;

  // ── Sección 2 - Naturaleza ────────────────────────────────────────
  @IsString() @IsOptional()
  naturaleza?: string;

  @IsString() @IsOptional()
  formaPagoTipo?: string;

  @IsString() @IsOptional()
  diasCredito?: string;

  // ── Sección 3 - Persona Natural ───────────────────────────────────
  @IsString() @IsOptional()
  lugarExpedicion?: string;

  @IsString() @IsOptional()
  fechaExpedicion?: string;

  @IsString() @IsOptional()
  nationality?: string;

  @IsString() @IsOptional()
  departamentoResidencia?: string;

  @IsString() @IsOptional()
  ciudadResidencia?: string;

  @IsString() @IsOptional()
  telefonoDomicilio?: string;

  @IsString() @IsOptional()
  primerApellido?: string;

  @IsString() @IsOptional()
  segundoApellido?: string;

  @IsString() @IsOptional()
  primerNombre?: string;

  @IsString() @IsOptional()
  segundoNombre?: string;

  // ── Sección 4 - Persona Jurídica ──────────────────────────────────
  @IsString() @IsOptional()
  nit?: string;

  @IsString() @IsOptional()
  digitoVerificacion?: string;

  @IsString() @IsOptional()
  correoEmpresa?: string;

  @IsString() @IsOptional()
  telefonoEmpresa?: string;

  @IsString() @IsOptional()
  direccionOficina?: string;

  @IsOptional()
  @Transform(({ value }) => toJson(value))
  repLegal?: Record<string, unknown>;

  // ── Sección 5 - Actividad económica ──────────────────────────────
  @IsString() @IsOptional()
  actividadTipo?: string; // JSON array as string

  @IsString() @IsOptional()
  actividadOtro?: string;

  @IsString() @IsOptional()
  codigoCIIU?: string;

  @IsString() @IsOptional()
  descripcionActividad?: string;

  // ── Sección 6 - Información de pagos ─────────────────────────────
  @IsString() @IsOptional()
  formaPago?: string; // JSON array as string

  @IsString() @IsOptional()
  tipoCuenta?: string;

  @IsString() @IsOptional()
  numeroCuenta?: string;

  @IsString() @IsOptional()
  diasPago?: string;

  // ── Sección 7 - Contacto de facturación ──────────────────────────
  @IsString() @IsOptional()
  factNombre?: string;

  @IsString() @IsOptional()
  factCargo?: string;

  @IsString() @IsOptional()
  factTelefono?: string;

  @IsString() @IsOptional()
  factExt?: string;

  @IsString() @IsOptional()
  factCelular?: string;

  @IsString() @IsOptional()
  factEmail?: string;

  // ── Sección 8 - Referencias comerciales ──────────────────────────
  @IsOptional()
  @Transform(({ value }) => toJson(value))
  referencias?: Record<string, unknown>[];

  // ── Sección 9 - Accionistas ───────────────────────────────────────
  @IsOptional()
  @Transform(({ value }) => toJson(value))
  accionistas?: Record<string, unknown>[];

  // ── Sección 10 - Información financiera ──────────────────────────
  @IsString() @IsOptional()
  totalActivos?: string;

  @IsString() @IsOptional()
  totalPasivos?: string;

  @IsString() @IsOptional()
  totalPatrimonio?: string;

  @IsString() @IsOptional()
  ingresosMensuales?: string;

  @IsString() @IsOptional()
  egresosMensuales?: string;

  @IsString() @IsOptional()
  otrosIngresosMensuales?: string;

  @IsString() @IsOptional()
  conceptoOtrosIngresos?: string;

  // ── Sección 11 - Operaciones internacionales ─────────────────────
  @IsOptional()
  @Transform(({ value }) => toJson(value))
  operaciones?: Record<string, unknown>;

  // ── Sección 12 - PPE ─────────────────────────────────────────────
  @IsBoolean() @IsOptional()
  @Transform(({ value }) => toBool(value))
  manejaRecursosPublicos?: boolean;

  @IsBoolean() @IsOptional()
  @Transform(({ value }) => toBool(value))
  tieneReconocimientoPublico?: boolean;

  @IsBoolean() @IsOptional()
  @Transform(({ value }) => toBool(value))
  ejercePoder?: boolean;

  @IsBoolean() @IsOptional()
  @Transform(({ value }) => toBool(value))
  esFamiliarPPE?: boolean;

  @IsString() @IsOptional()
  familiarPPEInfo?: string;

  // ── Sección 13 - Declaraciones (requeridas) ───────────────────────
  @IsBoolean() @IsNotEmpty()
  @Transform(({ value }) => toBool(value))
  aceptaDeclaracion: boolean;

  @IsBoolean() @IsNotEmpty()
  @Transform(({ value }) => toBool(value))
  aceptaTratamientoDatos: boolean;
}
