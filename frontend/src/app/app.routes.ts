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
    path: 'proveedores/registro',
    loadComponent: () => import('./features/providers/provider-register.component').then(m => m.ProviderRegisterComponent),
  },
  {
    path: 'familias/caracterizacion',
    loadComponent: () => import('./features/beneficiaries/family-characterization.component').then(m => m.FamilyCharacterizationComponent),
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
      {
        path: 'beneficiaries',
        loadComponent: () => import('./features/beneficiaries/beneficiaries-list.component').then(m => m.BeneficiariesListComponent),
        canActivate: [permissionGuard],
        data: { permission: 'beneficiarios:read' },
      },
      {
        path: 'beneficiaries/:id',
        loadComponent: () => import('./features/beneficiaries/beneficiary-detail.component').then(m => m.BeneficiaryDetailComponent),
        canActivate: [permissionGuard],
        data: { permission: 'beneficiarios:read' },
      },
      {
        path: 'providers',
        loadComponent: () => import('./features/providers/providers-list.component').then(m => m.ProvidersListComponent),
        canActivate: [permissionGuard],
        data: { permission: 'inventario:read' },
      },
      {
        path: 'shopify-test',
        loadComponent: () => import('./features/webhooks/shopify-test.component').then(m => m.ShopifyTestComponent),
      },
      {
        path: 'historial-ayudas',
        loadComponent: () => import('./features/labor-social/historial-ayudas.component').then(m => m.HistorialAyudasComponent),
        canActivate: [permissionGuard],
        data: { permission: 'beneficiarios:read' },
      },
      {
        path: 'sala-ludica',
        loadComponent: () => import('./features/labor-social/sala-ludica.component').then(m => m.SalaLudicaComponent),
      },
      {
        path: 'voluntarios',
        loadComponent: () => import('./features/labor-social/voluntarios.component').then(m => m.VoluntariosComponent),
      },
      {
        path: 'historial-apoyos-voluntarios',
        loadComponent: () => import('./features/labor-social/historial-apoyos-voluntarios.component').then(m => m.HistorialApoyosVoluntariosComponent),
      },
      {
        path: 'segmentacion',
        loadComponent: () => import('./features/comunicaciones/segmentacion.component').then(m => m.SegmentacionComponent),
      },
      {
        path: 'listas-difusion',
        loadComponent: () => import('./features/comunicaciones/listas-difusion.component').then(m => m.ListasDifusionComponent),
      },
      {
        path: 'mailing-masivo',
        loadComponent: () => import('./features/comunicaciones/mailing-masivo.component').then(m => m.MailingMasivoComponent),
      },
    ],
  },
  { path: '**', redirectTo: 'dashboard' },
];
