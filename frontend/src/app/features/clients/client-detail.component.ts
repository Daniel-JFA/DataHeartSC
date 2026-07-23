import { Component, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CurrencyPipe, DatePipe, DecimalPipe, SlicePipe } from '@angular/common';
import { ClientsService, ClientDetail } from '../../core/services/clients.service';

@Component({
  selector: 'app-client-detail',
  standalone: true,
  imports: [RouterLink, CurrencyPipe, DatePipe, DecimalPipe, SlicePipe],
  templateUrl: './client-detail.component.html',
})
export class ClientDetailComponent implements OnInit {
  private svc   = inject(ClientsService);
  private route = inject(ActivatedRoute);

  client    = signal<ClientDetail | null>(null);
  loading   = signal(true);
  error     = signal('');
  activeTab = signal<'orders' | 'donations'>('orders');

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.svc.getOne(id).subscribe({
      next: c  => { this.client.set(c); this.loading.set(false); },
      error: () => { this.error.set('No se pudo cargar el cliente'); this.loading.set(false); },
    });
  }

  // Alias para uso en template (evita llamadas repetidas a la señal dentro de @if)
  get c(): ClientDetail | null { return this.client(); }

  setTab(tab: 'orders' | 'donations'): void {
    this.activeTab.set(tab);
  }

  statusBadge(status: string): string {
    if (status === 'Activo')    return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    if (status === 'Inactivo')  return 'bg-slate-100 text-slate-500 border-slate-200';
    return 'bg-red-100 text-red-700 border-red-200';
  }

  orderStatusBadge(status: string): string {
    switch (status) {
      case 'Entregado':  return 'bg-emerald-100 text-emerald-700';
      case 'Pendiente':  return 'bg-amber-100 text-amber-700';
      case 'Cancelado':  return 'bg-red-100 text-red-700';
      case 'En proceso': return 'bg-blue-100 text-blue-700';
      default:           return 'bg-slate-100 text-slate-600';
    }
  }

  gatewayBadge(gw: string): string {
    switch (gw) {
      case 'Wompi':   return 'bg-violet-100 text-violet-700';
      case 'PayU':    return 'bg-blue-100 text-blue-700';
      case 'PayPal':  return 'bg-sky-100 text-sky-700';
      case 'Efectivo': return 'bg-emerald-100 text-emerald-700';
      default:        return 'bg-slate-100 text-slate-600';
    }
  }

  donationStatusBadge(status: string): string {
    switch (status) {
      case 'Completado':
      case 'Aprobado':   return 'bg-emerald-100 text-emerald-700';
      case 'Pendiente':  return 'bg-amber-100 text-amber-700';
      case 'Rechazado':
      case 'Fallido':    return 'bg-red-100 text-red-700';
      default:           return 'bg-slate-100 text-slate-600';
    }
  }

  totalDonaciones(): number {
    const cl = this.client();
    if (!cl?.donations?.length) return 0;
    return cl.donations.reduce((sum, d) => sum + parseFloat(d.amount ?? '0'), 0);
  }

  totalPedidos(): number {
    const cl = this.client();
    if (!cl?.orders?.length) return 0;
    return cl.orders.reduce((sum, o) => sum + parseFloat(o.totalAmount ?? '0'), 0);
  }
}
