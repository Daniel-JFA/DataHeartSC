import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

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
      },
      {
        path: 'products',
        loadComponent: () => import('./features/products/products-list.component').then(m => m.ProductsListComponent),
      },
      {
        path: 'orders',
        loadComponent: () => import('./features/orders/orders-list.component').then(m => m.OrdersListComponent),
      },
      {
        path: 'orders/new',
        loadComponent: () => import('./features/orders/order-form.component').then(m => m.OrderFormComponent),
      },
      {
        path: 'donations',
        loadComponent: () => import('./features/donations/donations-list.component').then(m => m.DonationsListComponent),
      },
    ],
  },
  { path: '**', redirectTo: 'dashboard' },
];
