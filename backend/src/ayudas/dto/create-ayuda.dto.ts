import {
  IsString, IsOptional, IsIn, IsDateString,
  IsInt, IsNumber, Min, MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';

const TIPOS = [
  'Transporte', 'Copagos', 'Medicamento', 'Alimentación', 'Alojamiento',
  'Cita Médica', 'Ayudas Diagnósticas', 'Pañales y otros', 'Ropa y Jugetes',
  'Recreación', 'Capacitación', 'Apoyo emprendimientos', 'Asesorias',
  'Empleo', 'Servicio Funerario', 'Otra',
];

export class CreateAyudaDto {
  @IsString()
  beneficiaryId: string;

  @IsDateString()
  fecha: string;

  @IsString() @IsIn(TIPOS)
  tipoSolicitud: string;

  @IsOptional() @IsInt() @Min(1) @Type(() => Number)
  personasBeneficiadas?: number;

  @IsOptional() @IsString()
  justificacion?: string;

  @IsOptional() @IsNumber() @Min(0) @Type(() => Number)
  valor?: number;

  @IsOptional() @IsString() @IsIn(['Pendiente', 'Resuelta'])
  estado?: string;
}
