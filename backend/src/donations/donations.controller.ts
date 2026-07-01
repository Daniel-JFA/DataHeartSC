import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { DonationsService } from './donations.service';
import { CreateDonationDto } from './dto/create-donation.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermission } from '../auth/require-permission.decorator';

@Controller('donations')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class DonationsController {
  constructor(private donationsService: DonationsService) {}

  @Get('stats')
  @RequirePermission('ventas_donaciones:read')
  getStats() {
    return this.donationsService.getStats();
  }

  @Get()
  @RequirePermission('ventas_donaciones:read')
  findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('search', new DefaultValuePipe('')) search: string,
    @Query('gateway', new DefaultValuePipe('')) gateway: string,
    @Query('status', new DefaultValuePipe('')) status: string,
  ) {
    return this.donationsService.findAll(
      page,
      limit,
      search,
      gateway || undefined,
      status || undefined,
    );
  }

  @Get(':id')
  @RequirePermission('ventas_donaciones:read')
  findOne(@Param('id') id: string) {
    return this.donationsService.findOne(id);
  }

  @Post()
  @RequirePermission('ventas_donaciones:write')
  create(@Body() dto: CreateDonationDto) {
    return this.donationsService.create(dto);
  }

  @Patch(':id/status')
  @RequirePermission('ventas_donaciones:write')
  updateStatus(
    @Param('id') id: string,
    @Body() body: { status: string },
  ) {
    return this.donationsService.updateStatus(id, body.status);
  }
}
