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
  categoryName: string | null;
  subcategoryName: string | null;
}

export interface CategoryStat {
  name: string;
  total: number;
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

  getAll(page = 1, limit = 20, search = '', onlyActive = false, categoryName = '') {
    let params = new HttpParams()
      .set('page', page)
      .set('limit', limit)
      .set('search', search)
      .set('onlyActive', onlyActive);
    if (categoryName) params = params.set('categoryName', categoryName);
    return this.http.get<PagedResult<Product>>(this.base, { params });
  }

  getCategoryStats(onlyActive = true) {
    const params = new HttpParams().set('onlyActive', onlyActive);
    return this.http.get<CategoryStat[]>(`${this.base}/categories`, { params });
  }

  toggleActive(id: string) {
    return this.http.patch<{ id: string; isActive: boolean }>(`${this.base}/${id}/toggle-active`, {});
  }

  stockMovement(id: string, body: { movementType: 'Entrada' | 'Salida'; quantity: number; description?: string }) {
    return this.http.post<Product>(`${this.base}/${id}/stock-movement`, body);
  }
}
