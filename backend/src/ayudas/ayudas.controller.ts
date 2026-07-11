import {
  Controller, Get, Post, Put, Delete,
  Body, Param, Query, UseGuards,
  ParseIntPipe, DefaultValuePipe,
} from '@nestjs/common';
import { AyudasService } from './ayudas.service';
import { CreateAyudaDto } from './dto/create-ayuda.dto';
import { UpdateAyudaDto } from './dto/update-ayuda.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermission } from '../auth/require-permission.decorator';

@Controller('ayudas')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AyudasController {
  constructor(private ayudasService: AyudasService) {}

  @Get('stats')
  @RequirePermission('beneficiarios:read')
  getStats() {
    return this.ayudasService.getStats();
  }

  @Get('beneficiary/:beneficiaryId')
  @RequirePermission('beneficiarios:read')
  findByBeneficiary(@Param('beneficiaryId') beneficiaryId: string) {
    return this.ayudasService.findByBeneficiary(beneficiaryId);
  }

  @Get()
  @RequirePermission('beneficiarios:read')
  findAll(
    @Query('page',           new DefaultValuePipe(1),   ParseIntPipe) page: number,
    @Query('limit',          new DefaultValuePipe(20),  ParseIntPipe) limit: number,
    @Query('beneficiaryId',  new DefaultValuePipe(''))               beneficiaryId: string,
    @Query('tipoSolicitud',  new DefaultValuePipe(''))               tipoSolicitud: string,
    @Query('estado',         new DefaultValuePipe(''))               estado: string,
  ) {
    return this.ayudasService.findAll(page, limit, beneficiaryId, tipoSolicitud, estado);
  }

  @Get(':id')
  @RequirePermission('beneficiarios:read')
  findOne(@Param('id') id: string) {
    return this.ayudasService.findOne(id);
  }

  @Post()
  @RequirePermission('beneficiarios:write')
  create(@Body() dto: CreateAyudaDto) {
    return this.ayudasService.create(dto);
  }

  @Put(':id')
  @RequirePermission('beneficiarios:write')
  update(@Param('id') id: string, @Body() dto: UpdateAyudaDto) {
    return this.ayudasService.update(id, dto);
  }

  @Delete(':id')
  @RequirePermission('beneficiarios:write')
  remove(@Param('id') id: string) {
    return this.ayudasService.remove(id);
  }
}
