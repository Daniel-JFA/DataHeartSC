import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export interface Product {
  id: string;
  name: string;
  sku: string;
  stock: number;
  minStock: number;
  price: string;
  isActive: boolean;
}

export interface PagedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable({ providedIn: 'root' })
export class ProductsService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/products`;

  getAll(page = 1, limit = 20, search = '', onlyActive = false) {
    const params = new HttpParams()
      .set('page', page)
      .set('limit', limit)
      .set('search', search)
      .set('onlyActive', onlyActive);
    return this.http.get<PagedResult<Product>>(this.base, { params });
  }
}
