import {
  Controller, Get, Post, Put, Delete,
  Body, Param, Query, UseGuards,
  ParseIntPipe, DefaultValuePipe,
} from '@nestjs/common';
import { BeneficiariesService } from './beneficiaries.service';
import { CreateBeneficiaryDto } from './dto/create-beneficiary.dto';
import { UpdateBeneficiaryDto } from './dto/update-beneficiary.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermission } from '../auth/require-permission.decorator';

@Controller('beneficiaries')
export class BeneficiariesController {
  constructor(private beneficiariesService: BeneficiariesService) {}

  /** Lookup público por número de documento — sin autenticación */
  @Get('public-lookup')
  publicLookup(@Query('docNumber') docNumber: string) {
    return this.beneficiariesService.findByDocNumber(docNumber);
  }

  /** Registro público — sin autenticación */
  @Post('public-register')
  publicRegister(@Body() dto: CreateBeneficiaryDto) {
    return this.beneficiariesService.create(dto);
  }

  /** Actualización pública (formulario de caracterización) — sin autenticación */
  @Put('public-update/:id')
  publicUpdate(@Param('id') id: string, @Body() dto: UpdateBeneficiaryDto) {
    return this.beneficiariesService.update(id, dto);
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermission('beneficiarios:read')
  getStats() {
    return this.beneficiariesService.getStats();
  }

  @Get()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermission('beneficiarios:read')
  findAll(
    @Query('page',   new DefaultValuePipe(1),   ParseIntPipe) page: number,
    @Query('limit',  new DefaultValuePipe(20),  ParseIntPipe) limit: number,
    @Query('search', new DefaultValuePipe(''))               search: string,
    @Query('status', new DefaultValuePipe(''))               status: string,
  ) {
    return this.beneficiariesService.findAll(page, limit, search, status);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermission('beneficiarios:read')
  findOne(@Param('id') id: string) {
    return this.beneficiariesService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermission('beneficiarios:write')
  create(@Body() dto: CreateBeneficiaryDto) {
    return this.beneficiariesService.create(dto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermission('beneficiarios:write')
  update(@Param('id') id: string, @Body() dto: UpdateBeneficiaryDto) {
    return this.beneficiariesService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermission('beneficiarios:write')
  remove(@Param('id') id: string) {
    return this.beneficiariesService.remove(id);
  }
}

