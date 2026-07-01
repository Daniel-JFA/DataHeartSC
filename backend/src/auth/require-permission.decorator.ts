import { SetMetadata } from '@nestjs/common';

export const PERMISSION_KEY = 'required_permission';

/**
 * Decora un endpoint con el permiso requerido para acceder.
 * Úsalo junto con PermissionsGuard.
 *
 * @example
 * @RequirePermission('ventas_donaciones:write')
 * @Post()
 * create() { ... }
 */
export const RequirePermission = (permission: string) =>
  SetMetadata(PERMISSION_KEY, permission);
