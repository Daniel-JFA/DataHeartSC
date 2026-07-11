import { PartialType } from '@nestjs/mapped-types';
import { CreateAyudaDto } from './create-ayuda.dto';

export class UpdateAyudaDto extends PartialType(CreateAyudaDto) {}
