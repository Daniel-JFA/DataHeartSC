import { Controller, Get, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import type { UpdateUserDto } from './admin.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermission } from '../auth/require-permission.decorator';

@Controller('admin')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermission('admin:access')
export class AdminController {
  constructor(private service: AdminService) {}

  @Get('users')
  getUsers() {
    return this.service.getUsers();
  }

  @Patch('users/:id')
  updateUser(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
  ) {
    return this.service.updateUser(id, dto);
  }

  @Get('roles')
  getRoles() {
    return this.service.getRoles();
  }
}
