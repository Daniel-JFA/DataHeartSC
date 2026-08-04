import {
  Controller, Get, Post, Put, Patch, Delete,
  Body, Param, Query, Req, UseGuards,
  ParseIntPipe, DefaultValuePipe, ParseBoolPipe,
} from '@nestjs/common';

import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { CreateStockMovementDto } from './dto/create-stock-movement.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermission } from '../auth/require-permission.decorator';

@Controller('products')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ProductsController {
  constructor(private productsService: ProductsService) {}

  @Get()
  @RequirePermission('inventario:read')
  findAll(
    @Query('page',         new DefaultValuePipe(1),     ParseIntPipe)  page: number,
    @Query('limit',        new DefaultValuePipe(20),    ParseIntPipe)  limit: number,
    @Query('search',       new DefaultValuePipe(''))                   search: string,
    @Query('onlyActive',   new DefaultValuePipe(false), ParseBoolPipe) onlyActive: boolean,
    @Query('categoryName', new DefaultValuePipe(''))                   categoryName: string,
  ) {
    return this.productsService.findAll(page, limit, search, onlyActive, categoryName);
  }

  @Get('categories')
  @RequirePermission('inventario:read')
  getCategoryStats(
    @Query('onlyActive', new DefaultValuePipe(true), ParseBoolPipe) onlyActive: boolean,
  ) {
    return this.productsService.getCategoryStats(onlyActive);
  }

  @Get(':id')
  @RequirePermission('inventario:read')
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @Post()
  @RequirePermission('inventario:write')
  create(@Body() dto: CreateProductDto) {
    return this.productsService.create(dto);
  }

  @Put(':id')
  @RequirePermission('inventario:write')
  update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.productsService.update(id, dto);
  }

  @Patch(':id/toggle-active')
  @RequirePermission('inventario:write')
  toggleActive(@Param('id') id: string) {
    return this.productsService.toggleActive(id);
  }

  @Post(':id/stock-movement')
  @RequirePermission('inventario:write')
  stockMovement(
    @Param('id') id: string,
    @Body() dto: CreateStockMovementDto,
    @Req() req: any,
  ) {
    const userId = (req as any).user?.sub as string;
    return this.productsService.stockMovement(id, dto, userId);
  }

  @Delete(':id')
  @RequirePermission('inventario:write')
  remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }
}
