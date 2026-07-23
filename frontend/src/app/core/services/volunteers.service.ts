import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export interface VolunteerSupport {
  id: string;
  date: string;
  hours: number | null;
  type: string | null;
  mealValue: number | null;
  notes: string | null;
  volunteer: { id: string; firstName: string; lastName: string; docNumber: string };
}

export interface SupportsResponse {
  data: VolunteerSupport[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  kpis: { totalApoyos: number; totalHoras: number; totalAlimentacion: number };
}

export interface Volunteer {
  id: string;
  firstName: string;
  lastName: string;
  docType: string;
  docNumber: string;
  email: string | null;
  phone: string | null;
  city: string | null;
  department: string | null;
  occupation: string | null;
  segment: string | null;
  shirtSize: string | null;
  availability: string | null;
  status: string;
  joinDate: string;
  _count: { supports: number };
}

export interface VolunteersResponse {
  data: Volunteer[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  kpis: { activos: number; inactivos: number };
}

@Injectable({ providedIn: 'root' })
export class VolunteersService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/volunteers`;

  getAll(page: number, limit: number, search?: string, status?: string) {
    let params = new HttpParams()
      .set('page', page)
      .set('limit', limit);
    if (search) params = params.set('search', search);
    if (status) params = params.set('status', status);
    return this.http.get<VolunteersResponse>(this.base, { params });
  }

  updateStatus(id: string, status: string) {
    return this.http.patch(`${this.base}/${id}/status`, { status });
  }

  getSupports(page: number, limit: number, search?: string, type?: string) {
    let params = new HttpParams().set('page', page).set('limit', limit);
    if (search) params = params.set('search', search);
    if (type)   params = params.set('type', type);
    return this.http.get<SupportsResponse>(`${this.base}/supports/all`, { params });
  }
}
