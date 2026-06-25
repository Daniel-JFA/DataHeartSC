import { Component, inject, signal, effect } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { OrdersService, Order } from '../../core/services/orders.service';
import { PaginationComponent } from '../../shared/components/pagination/pagination.component';

@Component({
  selector: 'app-orders-list',
  standalone: true,
  imports: [PaginationComponent, RouterLink],
  templateUrl: './orders-list.component.html',
})
export class OrdersListComponent {
  private svc   = inject(OrdersService);
  private route = inject(ActivatedRoute);

  orders     = signal<Order[]>([]);
  total      = signal(0);
  totalPages = signal(1);
  page       = signal(1);
  limit      = signal(20);
  search     = signal('');
  statusFilter = signal('');
  loading    = signal(false);
  createdId  = signal('');

  // Export state
  exportFrom = signal(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10));
  exportTo   = signal(new Date().toISOString().slice(0, 10));

  statusOptions = ['', 'Recibido', 'En preparación', 'Despachado', 'Entregado', 'Cancelado'];
  statusColors: Record<string, string> = {
    'Recibido':       'bg-blue-100 text-blue-700',
    'En preparación': 'bg-yellow-100 text-yellow-700',
    'Despachado':     'bg-purple-100 text-purple-700',
    'Entregado':      'bg-green-100 text-green-700',
    'Cancelado':      'bg-red-100 text-red-700',
  };
  paymentColors: Record<string, string> = {
    'Pagado':    'bg-green-100 text-green-700',
    'Pendiente': 'bg-yellow-100 text-yellow-700',
    'Cancelado': 'bg-red-100 text-red-700',
  };

  constructor() {
    this.route.queryParams.subscribe(p => {
      if (p['created']) this.createdId.set(p['created']);
    });
    effect(() => { this.load(); });
  }

  load() {
    this.loading.set(true);
    this.svc.getAll(this.page(), this.limit(), this.search(), this.statusFilter()).subscribe({
      next: r => {
        this.orders.set(r.data);
        this.total.set(r.total);
        this.totalPages.set(r.totalPages);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  onSearch(e: Event)  { this.search.set((e.target as HTMLInputElement).value); this.page.set(1); }
  onStatus(e: Event)  { this.statusFilter.set((e.target as HTMLSelectElement).value); this.page.set(1); }
  onPageChange(p: number) { this.page.set(p); }

  exportXlsx() {
    this.svc.exportXlsx(this.exportFrom(), this.exportTo()).subscribe({
      next: blob => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `pedidos_${this.exportFrom()}_${this.exportTo()}.xlsx`;
        a.click();
        URL.revokeObjectURL(url);
      },
    });
  }

  updateStatus(order: Order, status: string) {
    this.svc.updateStatus(order.id, { status }).subscribe({ next: () => this.load() });
  }

  formatCOP = (n: string) => `$${Number(n).toLocaleString('es-CO')}`;
  formatDate = (d: string) => new Date(d).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
}
