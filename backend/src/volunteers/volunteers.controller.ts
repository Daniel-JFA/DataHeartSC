import {
  Controller, Get, Patch, Param, Body, Query,
  UseGuards, ParseIntPipe, DefaultValuePipe,
} from '@nestjs/common';
import { VolunteersService } from './volunteers.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RequirePermission } from '../auth/require-permission.decorator';
import { PermissionsGuard } from '../auth/permissions.guard';

@Controller('volunteers')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class VolunteersController {
  constructor(private service: VolunteersService) {}

  @Get()
  @RequirePermission('voluntarios:read')
  findAll(
    @Query('page',  new DefaultValuePipe(1),  ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('search') search?: string,
    @Query('status') status?: string,
  ) {
    return this.service.findAll(page, limit, search, status);
  }

  @Get(':id')
  @RequirePermission('voluntarios:read')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id/status')
  @RequirePermission('voluntarios:write')
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: string,
  ) {
    return this.service.updateStatus(id, status);
  }
}
