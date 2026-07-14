import {
  Controller, Get, Post, Put, Body, Param, Query, Res, UseGuards,
  ParseIntPipe, DefaultValuePipe,
} from '@nestjs/common';
import type { Response } from 'express';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermission } from '../auth/require-permission.decorator';
import { GetUser } from '../auth/get-user.decorator';

@Controller('orders')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class OrdersController {
  constructor(private ordersService: OrdersService) {}

  @Get()
  @RequirePermission('ventas_donaciones:read')
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
  @RequirePermission('ventas_donaciones:read')
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
  @RequirePermission('ventas_donaciones:read')
  findOne(@Param('id') id: string) {
    return this.ordersService.findOne(id);
  }

  @Post()
  @RequirePermission('ventas_donaciones:write')
  create(@Body() dto: CreateOrderDto, @GetUser() user: any) {
    return this.ordersService.create(dto, user.sub);
  }

  @Put(':id/status')
  @RequirePermission('ventas_donaciones:write')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateOrderDto) {
    return this.ordersService.updateStatus(id, dto);
  }

  @Put(':id/payment-status')
  @RequirePermission('ventas_donaciones:write')
  updatePaymentStatus(
    @Param('id') id: string,
    @Body('paymentStatus') paymentStatus: string,
  ) {
    return this.ordersService.updatePaymentStatus(id, paymentStatus);
  }
}
