import {
  Controller, Get, Post, Put, Delete,
  Body, Param, Query, UseGuards,
  ParseIntPipe, DefaultValuePipe,
} from '@nestjs/common';
import { ClientsService } from './clients.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermission } from '../auth/require-permission.decorator';

@Controller('clients')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ClientsController {
  constructor(private clientsService: ClientsService) {}

  @Get()
  @RequirePermission('segmentacion:read')
  findAll(
    @Query('page',   new DefaultValuePipe(1),  ParseIntPipe) page: number,
    @Query('limit',  new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('search', new DefaultValuePipe(''))               search: string,
  ) {
    return this.clientsService.findAll(page, limit, search);
  }

  @Get(':id')
  @RequirePermission('segmentacion:read')
  findOne(@Param('id') id: string) {
    return this.clientsService.findOne(id);
  }

  @Post()
  @RequirePermission('segmentacion:write')
  create(@Body() dto: CreateClientDto) {
    return this.clientsService.create(dto);
  }

  @Put(':id')
  @RequirePermission('segmentacion:write')
  update(@Param('id') id: string, @Body() dto: UpdateClientDto) {
    return this.clientsService.update(id, dto);
  }

  @Delete(':id')
  @RequirePermission('segmentacion:write')
  remove(@Param('id') id: string) {
    return this.clientsService.remove(id);
  }
}
