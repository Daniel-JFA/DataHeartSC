import { PartialType } from '@nestjs/mapped-types';
import { IsOptional, IsIn } from 'class-validator';
import { CreateClientDto } from './create-client.dto';

export class UpdateClientDto extends PartialType(CreateClientDto) {
  @IsOptional() @IsIn(['Activo', 'Inactivo'])
  status?: string;
}
