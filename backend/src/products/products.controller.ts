import {
  Controller, Get, Post, Put, Delete,
  Body, Param, Query, UseGuards,
  ParseIntPipe, DefaultValuePipe, ParseBoolPipe,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('products')
@UseGuards(JwtAuthGuard)
export class ProductsController {
  constructor(private productsService: ProductsService) {}

  @Get()
  findAll(
    @Query('page',       new DefaultValuePipe(1),     ParseIntPipe)  page: number,
    @Query('limit',      new DefaultValuePipe(20),    ParseIntPipe)  limit: number,
    @Query('search',     new DefaultValuePipe(''))                   search: string,
    @Query('onlyActive', new DefaultValuePipe(false), ParseBoolPipe) onlyActive: boolean,
  ) {
    return this.productsService.findAll(page, limit, search, onlyActive);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateProductDto) {
    return this.productsService.create(dto);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.productsService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }
}
