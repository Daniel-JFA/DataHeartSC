import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export interface Client {
  id: string;
  name: string;
  docType: string;
  docNumber: string;
  phone?: string;
  email?: string;
  city?: string;
  status: string;
  createdAt: string;
  _count?: { orders: number; donations: number };
}

export interface PagedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateClientPayload {
  name: string;
  docType: string;
  docNumber: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  commune?: string;
  neighborhood?: string;
}

@Injectable({ providedIn: 'root' })
export class ClientsService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/clients`;

  getAll(page = 1, limit = 20, search = '') {
    const params = new HttpParams()
      .set('page', page)
      .set('limit', limit)
      .set('search', search);
    return this.http.get<PagedResult<Client>>(this.base, { params });
  }

  getOne(id: string) {
    return this.http.get<Client>(`${this.base}/${id}`);
  }

  create(payload: CreateClientPayload) {
    return this.http.post<Client>(this.base, payload);
  }

  update(id: string, payload: Partial<CreateClientPayload>) {
    return this.http.put<Client>(`${this.base}/${id}`, payload);
  }

  deactivate(id: string) {
    return this.http.delete<Client>(`${this.base}/${id}`);
  }
}
