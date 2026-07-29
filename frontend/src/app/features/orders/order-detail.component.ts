import { Component, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { OrdersService, Order } from '../../core/services/orders.service';

@Component({
  selector: 'app-order-detail',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './order-detail.component.html',
})
export class OrderDetailComponent implements OnInit {
  private svc   = inject(OrdersService);
  private route = inject(ActivatedRoute);

  order   = signal<Order | null>(null);
  loading = signal(true);
  error   = signal('');

  statusOptions = ['Recibido', 'En preparación', 'Despachado', 'Entregado', 'Cancelado'];
  paymentOptions = ['Pendiente', 'Pagado', 'Cancelado'];

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

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.svc.getOne(id).subscribe({
      next: o  => { this.order.set(o); this.loading.set(false); },
      error: () => { this.error.set('No se pudo cargar el pedido'); this.loading.set(false); },
    });
  }

  updateStatus(status: string) {
    const o = this.order();
    if (!o) return;
    this.svc.updateStatus(o.id, { status }).subscribe({
      next: updated => this.order.set({ ...o, ...updated }),
    });
  }

  updatePayment(paymentStatus: string) {
    const o = this.order();
    if (!o) return;
    this.svc.updateStatus(o.id, { paymentStatus }).subscribe({
      next: updated => this.order.set({ ...o, ...updated }),
    });
  }

  formatCOP = (n: string | number) => `$${Number(n).toLocaleString('es-CO')}`;
  formatDate = (d: string) => new Date(d).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}
