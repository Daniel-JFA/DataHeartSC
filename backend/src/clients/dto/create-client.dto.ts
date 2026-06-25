import { IsString, IsOptional, IsEmail, IsIn, MinLength } from 'class-validator';

export class CreateClientDto {
  @IsString() @MinLength(2)
  name: string;

  @IsString() @IsIn(['CC', 'NIT', 'CE', 'PA', 'TI', 'Otro'])
  docType: string;

  @IsString() @MinLength(4)
  docNumber: string;

  @IsOptional() @IsString()
  phone?: string;

  @IsOptional() @IsEmail()
  email?: string;

  @IsOptional() @IsString()
  address?: string;

  @IsOptional() @IsString()
  city?: string;

  @IsOptional() @IsString()
  commune?: string;

  @IsOptional() @IsString()
  neighborhood?: string;
}
