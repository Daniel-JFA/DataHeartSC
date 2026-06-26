import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export interface DonationClient {
  id: string;
  name: string;
  docNumber: string;
}

export interface Donation {
  id: string;
  clientId: string;
  amount: string | number;
  date: string;
  paymentGateway: string;
  transactionId: string;
  status: string;
  campaign?: string;
  concept?: string;
  createdAt: string;
  client?: DonationClient;
}

export interface DonationStats {
  totalDonations: number;
  totalAmount: string | number;
  approvedAmount: string | number;
  pendingAmount: string | number;
  byGateway: { gateway: string; count: number; amount: string | number }[];
  byStatus: { status: string; count: number }[];
}

export interface DonationPagedResult {
  data: Donation[];
  total: number;
  page: number;
  totalPages: number;
}

export interface CreateDonationPayload {
  clientId: string;
  amount: number;
  paymentGateway: string;
  transactionId: string;
  status?: string;
  campaign?: string;
  concept?: string;
  date?: string;
}

@Injectable({ providedIn: 'root' })
export class DonationsService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/donations`;

  getAll(params: {
    page?: number;
    limit?: number;
    search?: string;
    gateway?: string;
    status?: string;
  }) {
    let httpParams = new HttpParams()
      .set('page', params.page ?? 1)
      .set('limit', params.limit ?? 20)
      .set('search', params.search ?? '');

    if (params.gateway) {
      httpParams = httpParams.set('gateway', params.gateway);
    }
    if (params.status) {
      httpParams = httpParams.set('status', params.status);
    }

    return this.http.get<DonationPagedResult>(this.base, { params: httpParams });
  }

  getStats() {
    return this.http.get<DonationStats>(`${this.base}/stats`);
  }

  create(data: CreateDonationPayload) {
    return this.http.post<Donation>(this.base, data);
  }

  updateStatus(id: string, status: string) {
    return this.http.patch<Donation>(`${this.base}/${id}/status`, { status });
  }
}
