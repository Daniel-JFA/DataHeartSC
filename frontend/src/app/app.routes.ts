import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { permissionGuard } from './core/guards/permission.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent),
  },
  {
    path: '',
    loadComponent: () => import('./shared/layout/shell/shell.component').then(m => m.ShellComponent),
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
      },
      {
        path: 'clients',
        loadComponent: () => import('./features/clients/clients-list.component').then(m => m.ClientsListComponent),
        canActivate: [permissionGuard],
        data: { permission: 'segmentacion:read' },
      },
      {
        path: 'products',
        loadComponent: () => import('./features/products/products-list.component').then(m => m.ProductsListComponent),
        canActivate: [permissionGuard],
        data: { permission: 'inventario:read' },
      },
      {
        path: 'orders',
        loadComponent: () => import('./features/orders/orders-list.component').then(m => m.OrdersListComponent),
        canActivate: [permissionGuard],
        data: { permission: 'ventas_donaciones:read' },
      },
      {
        path: 'orders/new',
        loadComponent: () => import('./features/orders/order-form.component').then(m => m.OrderFormComponent),
        canActivate: [permissionGuard],
        data: { permission: 'ventas_donaciones:write' },
      },
      {
        path: 'donations',
        loadComponent: () => import('./features/donations/donations-list.component').then(m => m.DonationsListComponent),
        canActivate: [permissionGuard],
        data: { permission: 'ventas_donaciones:read' },
      },
    ],
  },
  {
    path: 'proveedores/registro',
    loadComponent: () => import('./features/providers/provider-register.component').then(m => m.ProviderRegisterComponent),
  },
  { path: '**', redirectTo: 'dashboard' },
];
