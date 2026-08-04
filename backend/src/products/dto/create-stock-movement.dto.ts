import { IsIn, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateStockMovementDto {
  @IsIn(['Entrada', 'Salida', 'Ajuste'])
  movementType: 'Entrada' | 'Salida' | 'Ajuste';

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  quantity: number;

  @IsOptional()
  @IsString()
  description?: string;
}
