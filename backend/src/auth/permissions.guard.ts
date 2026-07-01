import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSION_KEY } from './require-permission.decorator';
import { JwtPayload } from './auth.service';
import { Request } from 'express';

/**
 * Guard de permisos granulares.
 * Debe usarse DESPUÉS de JwtAuthGuard (que popula request.user).
 *
 * @example
 * @UseGuards(JwtAuthGuard, PermissionsGuard)
 * @RequirePermission('inventario:write')
 * @Post()
 * create() { ... }
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string>(PERMISSION_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Si el endpoint no tiene @RequirePermission, se permite (solo JwtAuthGuard aplica)
    if (!required) return true;

    const request = context.switchToHttp().getRequest<Request>();
    const user = (request as any).user as JwtPayload | undefined;

    if (!user?.permissions?.includes(required)) {
      throw new ForbiddenException(
        `Permiso requerido: ${required}`,
      );
    }

    return true;
  }
}
