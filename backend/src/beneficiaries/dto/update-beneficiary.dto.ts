import { PartialType } from '@nestjs/mapped-types';
import { CreateBeneficiaryDto } from './create-beneficiary.dto';
import { IsOptional, IsString, IsIn } from 'class-validator';

export class UpdateBeneficiaryDto extends PartialType(CreateBeneficiaryDto) {
  @IsOptional() @IsString() @IsIn(['Activo', 'Inactivo', 'Fallecido'])
  status?: string;
}
