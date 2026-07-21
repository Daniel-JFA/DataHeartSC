import { Component, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { environment } from '../../../environments/environment';

interface SimulatePayload {
  orderNumber: number;
  totalPrice: string;
  financialStatus: 'paid' | 'pending';
  customerName: string;
  customerEmail: string;
  city: string;
}

interface SimulateResult {
  status: string;
  action: 'created' | 'updated' | 'skipped';
  message: string;
  orderId?: string;
  invoiceNumber?: string;
  clientId?: string;
}

@Component({
  selector: 'app-shopify-test',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <div class="p-8 max-w-2xl mx-auto">

      <div class="mb-6">
        <h2 class="text-2xl font-bold text-slate-800">Prueba Webhook Shopify</h2>
        <p class="text-sm text-slate-500 mt-1">
          Simula un pedido entrante de Shopify para verificar que el webhook funciona correctamente.
        </p>
      </div>

      <!-- Formulario -->
      <div class="bg-white rounded-xl border border-slate-200 p-6 space-y-4">

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-medium text-slate-600 mb-1">Número de pedido</label>
            <input type="number" [(ngModel)]="payload.orderNumber"
              class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500" />
          </div>
          <div>
            <label class="block text-xs font-medium text-slate-600 mb-1">Total (COP)</label>
            <input type="text" [(ngModel)]="payload.totalPrice" placeholder="85000.00"
              class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500" />
          </div>
        </div>

        <div>
          <label class="block text-xs font-medium text-slate-600 mb-1">Estado de pago</label>
          <select [(ngModel)]="payload.financialStatus"
            class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500">
            <option value="paid">paid — Pagado</option>
            <option value="pending">pending — Pendiente</option>
          </select>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-medium text-slate-600 mb-1">Nombre del cliente</label>
            <input type="text" [(ngModel)]="payload.customerName" placeholder="María García"
              class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500" />
          </div>
          <div>
            <label class="block text-xs font-medium text-slate-600 mb-1">Email del cliente</label>
            <input type="email" [(ngModel)]="payload.customerEmail" placeholder="cliente@ejemplo.com"
              class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500" />
          </div>
        </div>

        <div>
          <label class="block text-xs font-medium text-slate-600 mb-1">Ciudad de entrega</label>
          <input type="text" [(ngModel)]="payload.city" placeholder="Bogotá"
            class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500" />
        </div>

        <button (click)="simulate()" [disabled]="loading()"
          class="w-full py-2.5 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
          @if (loading()) {
            <svg class="animate-spin w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
            </svg>
            Enviando...
          } @else {
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4">
              <path d="M3.105 2.288a.75.75 0 00-.826.95l1.414 4.926A1.5 1.5 0 005.135 9.25h6.115a.75.75 0 010 1.5H5.135a1.5 1.5 0 00-1.442 1.086l-1.414 4.926a.75.75 0 00.826.95 28.897 28.897 0 0015.293-7.154.75.75 0 000-1.115A28.897 28.897 0 003.105 2.288z" />
            </svg>
            Enviar pedido simulado
          }
        </button>
      </div>

      <!-- Resultado -->
      @if (result()) {
        <div class="mt-4 rounded-xl border p-5 space-y-3"
          [class]="result()!.status === 'success'
            ? 'bg-green-50 border-green-200'
            : 'bg-red-50 border-red-200'">

          <div class="flex items-center gap-2">
            @if (result()!.status === 'success') {
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-5 h-5 text-green-600">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clip-rule="evenodd" />
              </svg>
              <span class="text-sm font-semibold text-green-800">{{ result()!.message }}</span>
            } @else {
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-5 h-5 text-red-600">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clip-rule="evenodd" />
              </svg>
              <span class="text-sm font-semibold text-red-800">Error al procesar</span>
            }
          </div>

          @if (result()!.status === 'success') {
            <dl class="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
              <dt class="text-slate-500">Acción</dt>
              <dd class="font-medium text-slate-800">
                @if (result()!.action === 'created') { Pedido creado }
                @else if (result()!.action === 'updated') { Pedido actualizado a Pagado }
                @else { Pedido ya existía (idempotencia) }
              </dd>
              @if (result()!.invoiceNumber) {
                <dt class="text-slate-500">Referencia</dt>
                <dd class="font-medium text-slate-800">{{ result()!.invoiceNumber }}</dd>
              }
              @if (result()!.orderId) {
                <dt class="text-slate-500">ID pedido</dt>
                <dd class="font-medium text-slate-800 font-mono text-xs">{{ result()!.orderId }}</dd>
              }
            </dl>

            @if (result()!.action === 'created' || result()!.action === 'updated') {
              <a routerLink="/orders"
                class="inline-flex items-center gap-1.5 text-sm text-brand-600 hover:text-brand-700 font-medium">
                Ver en Pedidos →
              </a>
            }
          } @else {
            <pre class="text-xs text-red-700 bg-red-100 rounded p-3 overflow-auto">{{ errorText() }}</pre>
          }
        </div>
      }

      <!-- Nota informativa -->
      <div class="mt-4 bg-slate-50 border border-slate-200 rounded-lg p-4 text-xs text-slate-500 space-y-1">
        <p class="font-medium text-slate-600">¿Cómo funciona?</p>
        <p>Este simulador envía un payload al endpoint <code class="bg-slate-100 px-1 rounded">/webhooks/shopify/simulate</code> saltando la validación HMAC. El procesamiento es idéntico al webhook real de Shopify.</p>
        <p>Para probar con firma real, usa el botón <strong>"Enviar notificación de prueba"</strong> en el admin de Shopify.</p>
      </div>
    </div>
  `,
})
export class ShopifyTestComponent {
  private http = inject(HttpClient);

  payload: SimulatePayload = {
    orderNumber: Math.floor(Math.random() * 9000) + 1000,
    totalPrice: '85000.00',
    financialStatus: 'paid',
    customerName: 'Cliente Prueba',
    customerEmail: '',
    city: 'Bogotá',
  };

  loading = signal(false);
  result = signal<SimulateResult | null>(null);
  errorText = signal('');

  simulate() {
    this.loading.set(true);
    this.result.set(null);
    this.errorText.set('');

    this.http.post<SimulateResult>(
      `${environment.apiUrl}/webhooks/shopify/simulate`,
      this.payload
    ).subscribe({
      next: (res) => {
        this.result.set(res);
        this.loading.set(false);
        // Nuevo número para la próxima prueba
        this.payload.orderNumber = Math.floor(Math.random() * 9000) + 1000;
      },
      error: (err) => {
        this.result.set({ status: 'error', action: 'created', message: 'Error' });
        this.errorText.set(JSON.stringify(err.error ?? err.message, null, 2));
        this.loading.set(false);
      },
    });
  }
}
