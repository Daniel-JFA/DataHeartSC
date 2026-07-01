import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Guard de permisos granulares para rutas.
 * Uso: `data: { permission: 'inventario:read' }`
 * Redirige a /dashboard si el usuario no tiene el permiso requerido.
 */
export const permissionGuard: CanActivateFn = (route) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const required = route.data?.['permission'] as string | undefined;
  if (!required) return true;

  if (auth.hasPermission(required)) return true;

  return router.createUrlTree(['/dashboard']);
};
