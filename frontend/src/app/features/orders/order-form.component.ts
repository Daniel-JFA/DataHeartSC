import { Component, inject, signal, computed } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpClient, HttpParams } from '@angular/common/http';
import { OrdersService, CreateOrderPayload } from '../../core/services/orders.service';
import { environment } from '../../../environments/environment';

interface ClientOption { id: string; name: string; docType: string; docNumber: string; phone?: string; }
interface ProductOption { id: string; name: string; sku: string; price: string; }
interface LineItem { product: ProductOption; quantity: number; }

@Component({
  selector: 'app-order-form',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './order-form.component.html',
})
export class OrderFormComponent {
  private svc    = inject(OrdersService);
  private router = inject(Router);
  private http   = inject(HttpClient);
  private fb     = inject(FormBuilder);

  // Client search
  clientQuery     = signal('');
  clientResults   = signal<ClientOption[]>([]);
  selectedClient  = signal<ClientOption | null>(null);
  searchingClient = signal(false);

  // Product search
  productQuery      = signal('');
  productResults    = signal<ProductOption[]>([]);
  searchingProduct  = signal(false);

  // Cart
  lines = signal<LineItem[]>([]);

  // Totals
  total = computed(() =>
    this.lines().reduce((s, l) => s + Number(l.product.price) * l.quantity, 0)
  );

  itemsCount = computed(() =>
    this.lines().reduce((s, l) => s + l.quantity, 0)
  );

  // Order meta
  form = this.fb.group({
    source:        ['Manual', Validators.required],
    paymentStatus: ['Pendiente', Validators.required],
  });

  saving = signal(false);
  error  = signal('');

  sources       = ['Manual', 'TiendaFísica', 'WhatsApp', 'Email'];
  paymentStates = ['Pendiente', 'Pagado', 'Cancelado'];

  // ── Client search ─────────────────────────────
  searchClients(q: string) {
    this.clientQuery.set(q);
    if (q.length < 2) { this.clientResults.set([]); return; }
    this.searchingClient.set(true);
    const params = new HttpParams().set('search', q).set('limit', '8');
    this.http.get<{ data: ClientOption[] }>(`${environment.apiUrl}/clients`, { params }).subscribe({
      next: r => { this.clientResults.set(r.data); this.searchingClient.set(false); },
      error: () => this.searchingClient.set(false),
    });
  }

  selectClient(c: ClientOption) {
    this.selectedClient.set(c);
    this.clientResults.set([]);
    this.clientQuery.set(c.name);
  }

  clearClient() {
    this.selectedClient.set(null);
    this.clientQuery.set('');
  }

  // ── Product search ────────────────────────────
  searchProducts(q: string) {
    this.productQuery.set(q);
    if (q.length < 2) { this.productResults.set([]); return; }
    this.searchingProduct.set(true);
    const params = new HttpParams().set('search', q).set('limit', '8').set('onlyActive', 'true');
    this.http.get<{ data: ProductOption[] }>(`${environment.apiUrl}/products`, { params }).subscribe({
      next: r => { this.productResults.set(r.data); this.searchingProduct.set(false); },
      error: () => this.searchingProduct.set(false),
    });
  }

  addProduct(p: ProductOption) {
    this.productQuery.set('');
    this.productResults.set([]);
    const existing = this.lines().findIndex(l => l.product.id === p.id);
    if (existing >= 0) {
      this.lines.update(lines =>
        lines.map((l, i) => i === existing ? { ...l, quantity: l.quantity + 1 } : l)
      );
    } else {
      this.lines.update(lines => [...lines, { product: p, quantity: 1 }]);
    }
  }

  updateQty(idx: number, qty: number) {
    if (qty < 1) { this.removeLine(idx); return; }
    this.lines.update(lines => lines.map((l, i) => i === idx ? { ...l, quantity: qty } : l));
  }

  removeLine(idx: number) {
    this.lines.update(lines => lines.filter((_, i) => i !== idx));
  }

  // ── Submit ────────────────────────────────────
  submit() {
    if (!this.selectedClient()) { this.error.set('Selecciona un cliente'); return; }
    if (!this.lines().length)   { this.error.set('Añade al menos un producto'); return; }

    this.saving.set(true);
    this.error.set('');

    const payload: CreateOrderPayload = {
      clientId:      this.selectedClient()!.id,
      source:        this.form.value.source!,
      paymentStatus: this.form.value.paymentStatus!,
      items: this.lines().map(l => ({ productId: l.product.id, quantity: l.quantity })),
    };

    this.svc.create(payload).subscribe({
      next: order => {
        this.saving.set(false);
        this.router.navigate(['/orders'], { queryParams: { created: order.id } });
      },
      error: (e: { error?: { message?: string } }) => {
        this.error.set(e.error?.message || 'Error al crear el pedido');
        this.saving.set(false);
      },
    });
  }

  formatCOP = (n: number) => `$${n.toLocaleString('es-CO')}`;
}
