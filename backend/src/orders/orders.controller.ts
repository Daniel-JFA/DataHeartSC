import {
  Controller, Get, Post, Put, Body, Param, Query, Res, UseGuards,
  ParseIntPipe, DefaultValuePipe,
} from '@nestjs/common';
import type { Response } from 'express';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GetUser } from '../auth/get-user.decorator';

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private ordersService: OrdersService) {}

  @Get()
  findAll(
    @Query('page',   new DefaultValuePipe(1),  ParseIntPipe) page: number,
    @Query('limit',  new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('search', new DefaultValuePipe(''))               search: string,
    @Query('status', new DefaultValuePipe(''))               status: string,
    @Query('source', new DefaultValuePipe(''))               source: string,
  ) {
    return this.ordersService.findAll(page, limit, search, status, source);
  }

  // IMPORTANT: export must come BEFORE :id route to avoid Express matching 'export' as an ID
  @Get('export')
  async export(
    @Query('from') from: string,
    @Query('to')   to: string,
    @Res() res: Response,
  ) {
    const buffer = await this.ordersService.exportToExcel(from, to);
    const date = new Date().toISOString().slice(0, 10);
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="pedidos_worldoffice_${date}.xlsx"`,
      'Content-Length': buffer.byteLength,
    });
    res.end(Buffer.from(buffer));
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.ordersService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateOrderDto, @GetUser() user: any) {
    return this.ordersService.create(dto, user.sub);
  }

  @Put(':id/status')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateOrderDto) {
    return this.ordersService.updateStatus(id, dto);
  }
}
