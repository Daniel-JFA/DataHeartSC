import { IsString, IsOptional, IsIn, IsArray, ValidateNested, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class OrderItemDto {
  @IsString()
  productId: string;

  @Type(() => Number) @IsInt() @Min(1)
  quantity: number;
}

export class CreateOrderDto {
  @IsString()
  clientId: string;

  @IsOptional() @IsIn(['Manual', 'TiendaFísica', 'WhatsApp', 'Email', 'Shopify'])
  source?: string;

  @IsOptional() @IsIn(['Pendiente', 'Pagado', 'Cancelado'])
  paymentStatus?: string;

  @IsOptional() @IsString()
  notes?: string;

  @IsArray() @ValidateNested({ each: true }) @Type(() => OrderItemDto)
  items: OrderItemDto[];
}
