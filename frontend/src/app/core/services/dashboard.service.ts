import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface DashboardStats {
  kpis: {
    totalClients: number;
    activeClients: number;
    totalProducts: number;
    lowStockProducts: number;
    totalOrders: number;
    totalRevenue: number;
    paidRevenue: number;
    totalDonations: number;
    totalDonationsAmount: number;
  };
  ordersByStatus: Array<{ status: string; count: number }>;
  revenueByDay: Array<{ date: string; total: number }>;
  donationsByDay: Array<{ date: string; total: number }>;
  topCategories: Array<{ category: string; total: number }>;
  donationsByGateway: Array<{ gateway: string; amount: number }>;
  recentOrders: Array<{
    id: string;
    orderDate: string;
    clientName: string;
    totalAmount: number;
    status: string;
    paymentStatus: string;
    itemCount: number;
  }>;
  lowStockItems: Array<{
    id: string;
    name: string;
    sku: string;
    stock: number;
    minStock: number;
  }>;
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private http = inject(HttpClient);

  getStats(): Observable<DashboardStats> {
    return this.http.get<DashboardStats>(`${environment.apiUrl}/dashboard/stats`);
  }
}
