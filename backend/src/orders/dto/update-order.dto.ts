import { IsOptional, IsIn } from 'class-validator';

export class UpdateOrderDto {
  @IsOptional() @IsIn(['Recibido', 'En preparación', 'Despachado', 'Entregado', 'Cancelado'])
  status?: string;

  @IsOptional() @IsIn(['Pendiente', 'Pagado', 'Cancelado'])
  paymentStatus?: string;
}
