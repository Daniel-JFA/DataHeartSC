import {
  IsString, IsOptional, IsEmail, IsIn, IsBoolean,
  IsDateString, IsInt, MinLength, Min, Max,
} from 'class-validator';

const DOC_TYPES = [
  'Cédula de Ciudadanía', 'Registro Civil', 'Tarjeta de Identidad',
  'Permiso Especial Permanencia', 'Menor sin Identificación', 'NO ADRES', 'Sin Identificación',
];

export class CreateBeneficiaryDto {
  // -- Identificación --
  @IsString() @MinLength(2)
  firstName: string;

  @IsString() @MinLength(2)
  lastName: string;

  @IsString() @IsIn(DOC_TYPES)
  docType: string;

  @IsString() @MinLength(1)
  docNumber: string;

  @IsOptional() @IsDateString()
  birthDate?: string;

  @IsOptional() @IsString()
  birthCity?: string;

  @IsOptional() @IsString()
  nationality?: string;

  @IsOptional() @IsString() @IsIn(['Masculino', 'Femenino', 'Otro'])
  gender?: string;

  @IsOptional() @IsString()
  etnia?: string;

  @IsOptional() @IsString()
  condicion?: string;

  @IsOptional() @IsDateString()
  deceasedDate?: string;

  // -- Contacto --
  @IsOptional() @IsString()
  phone?: string;

  @IsOptional() @IsString()
  celular?: string;

  @IsOptional() @IsEmail()
  email?: string;

  @IsOptional() @IsString()
  address?: string;

  @IsOptional() @IsString()
  city?: string;

  @IsOptional() @IsString()
  department?: string;

  @IsOptional() @IsBoolean()
  isDisplaced?: boolean;

  // -- Salud --
  @IsOptional() @IsString()
  eps?: string;

  @IsOptional() @IsString() @IsIn(['Subsidiado', 'Contributivo', 'Prepagada', ''])
  regimen?: string;

  @IsOptional() @IsString()
  sisbenGroup?: string;

  @IsOptional() @IsString()
  diagnostico?: string;

  @IsOptional() @IsString()
  otherDiagnosis?: string;

  @IsOptional() @IsString()
  tratadoEn?: string;

  @IsOptional() @IsString()
  clinicaHospital?: string;

  // -- Familia: Madre --
  @IsOptional() @IsString()
  motherName?: string;

  @IsOptional() @IsString()
  motherDocNumber?: string;

  @IsOptional() @IsString()
  motherPhone?: string;

  @IsOptional() @IsString()
  motherOccupation?: string;

  @IsOptional() @IsString()
  motherEducation?: string;

  @IsOptional() @IsString()
  motherProfession?: string;

  @IsOptional() @IsBoolean()
  motherLivesWithChild?: boolean;

  @IsOptional() @IsBoolean()
  motherRespondsEcon?: boolean;

  // -- Familia: Padre --
  @IsOptional() @IsString()
  fatherName?: string;

  @IsOptional() @IsString()
  fatherDocNumber?: string;

  @IsOptional() @IsString()
  fatherPhone?: string;

  @IsOptional() @IsString()
  fatherOccupation?: string;

  @IsOptional() @IsString()
  fatherEducation?: string;

  @IsOptional() @IsString()
  fatherProfession?: string;

  @IsOptional() @IsBoolean()
  fatherLivesWithChild?: boolean;

  @IsOptional() @IsBoolean()
  fatherRespondsEcon?: boolean;

  // -- Familia: Hermanos y Cuidador --
  @IsOptional() @IsBoolean()
  hasSiblings?: boolean;

  @IsOptional() @IsInt() @Min(0)
  numSiblings?: number;

  @IsOptional()
  siblingsData?: object;

  @IsOptional() @IsString()
  caregiverName?: string;

  @IsOptional() @IsString()
  caregiverRelationship?: string;

  @IsOptional() @IsString()
  caregiverPhone?: string;

  // -- Vivienda --
  @IsOptional() @IsString() @IsIn(['Rural', 'Urbano', ''])
  zone?: string;

  @IsOptional() @IsString() @IsIn(['Arrendada', 'Propia', 'Familiar', ''])
  housingType?: string;

  @IsOptional() @IsInt() @Min(1) @Max(6)
  housingStrata?: number;

  @IsOptional()
  publicServices?: string[];

  @IsOptional() @IsBoolean()
  publicTransportNearby?: boolean;

  @IsOptional() @IsInt() @Min(1)
  numPeopleInHome?: number;

  // -- Economía --
  @IsOptional() @IsString()
  incomeSource?: string;

  @IsOptional() @IsBoolean()
  receivesGovSubsidy?: boolean;

  @IsOptional() @IsString()
  govSubsidyType?: string;

  // -- Meta --
  @IsOptional() @IsString()
  comoSeEntero?: string;
}
