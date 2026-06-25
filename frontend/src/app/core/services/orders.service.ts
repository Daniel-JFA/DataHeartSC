import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export interface OrderItem {
  productId: string;
  quantity: number;
}

export interface CreateOrderPayload {
  clientId: string;
  source: string;
  paymentStatus: string;
  items: OrderItem[];
}

export interface Order {
  id: string;
  orderDate: string;
  status: string;
  paymentStatus: string;
  source: string;
  totalAmount: string;
  client: { id: string; name: string; docNumber: string; docType: string; phone?: string };
  items: {
    id: string; quantity: number; unitPrice: string; subtotal: string;
    product: { id: string; name: string; sku: string };
  }[];
}

@Injectable({ providedIn: 'root' })
export class OrdersService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/orders`;

  getAll(page = 1, limit = 20, search = '', status = '', source = '') {
    const params = new HttpParams()
      .set('page', page).set('limit', limit)
      .set('search', search).set('status', status).set('source', source);
    return this.http.get<{ data: Order[]; total: number; page: number; limit: number; totalPages: number }>(
      this.base, { params });
  }

  create(payload: CreateOrderPayload) {
    return this.http.post<Order>(this.base, payload);
  }

  updateStatus(id: string, payload: { status?: string; paymentStatus?: string }) {
    return this.http.put<Order>(`${this.base}/${id}/status`, payload);
  }

  exportXlsx(from: string, to: string) {
    const params = new HttpParams().set('from', from).set('to', to);
    return this.http.get(`${this.base}/export`, { params, responseType: 'blob' });
  }
}
