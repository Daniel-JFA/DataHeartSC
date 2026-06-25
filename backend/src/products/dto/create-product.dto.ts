import { IsString, IsNumber, IsOptional, IsBoolean, Min, MinLength } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateProductDto {
  @IsString() @MinLength(2)
  name: string;

  @IsString() @MinLength(2)
  sku: string;

  @IsOptional() @Type(() => Number) @IsNumber() @Min(0)
  stock?: number;

  @IsOptional() @Type(() => Number) @IsNumber() @Min(0)
  minStock?: number;

  @Type(() => Number) @IsNumber() @Min(0)
  price: number;

  @IsOptional() @IsBoolean()
  isActive?: boolean;
}
