import { Component, inject, signal, OnInit } from '@angular/core';
import { DecimalPipe, CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import {
  DonationsService,
  Donation,
  DonationStats,
} from '../../core/services/donations.service';

@Component({
  selector: 'app-donations-list',
  standalone: true,
  imports: [DecimalPipe, CurrencyPipe, RouterLink, FormsModule],
  templateUrl: './donations-list.component.html',
})
export class DonationsListComponent implements OnInit {
  private svc = inject(DonationsService);

  donations = signal<Donation[]>([]);
  loading = signal(false);
  error = signal('');
  total = signal(0);
  currentPage = signal(1);
  totalPages = signal(1);

  // Plain string properties for ngModel bindings on select elements
  searchQuery = '';
  gatewayFilter = '';
  statusFilter = '';

  stats = signal<DonationStats | null>(null);

  private searchTimer: ReturnType<typeof setTimeout> | null = null;

  ngOnInit() {
    this.loadDonations();
    this.loadStats();
  }

  loadDonations() {
    this.loading.set(true);
    this.error.set('');
    this.svc
      .getAll({
        page: this.currentPage(),
        limit: 20,
        search: this.searchQuery,
        gateway: this.gatewayFilter || undefined,
        status: this.statusFilter || undefined,
      })
      .subscribe({
        next: (res) => {
          this.donations.set(res.data);
          this.total.set(res.total);
          this.totalPages.set(res.totalPages);
          this.loading.set(false);
        },
        error: () => {
          this.error.set('Error al cargar las donaciones');
          this.loading.set(false);
        },
      });
  }

  loadStats() {
    this.svc.getStats().subscribe({
      next: (s) => this.stats.set(s),
      error: () => {},
    });
  }

  onSearch(event: Event) {
    this.searchQuery = (event.target as HTMLInputElement).value;
    this.currentPage.set(1);
    if (this.searchTimer) clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => this.loadDonations(), 300);
  }

  onFilterChange() {
    this.currentPage.set(1);
    this.loadDonations();
  }

  changePage(n: number) {
    if (n < 1 || n > this.totalPages()) return;
    this.currentPage.set(n);
    this.loadDonations();
  }

  gatewayBadge(gateway: string): string {
    const map: Record<string, string> = {
      Wompi: 'bg-blue-50 text-blue-700 border border-blue-200',
      PayU: 'bg-orange-50 text-orange-700 border border-orange-200',
      PayPal: 'bg-sky-50 text-sky-700 border border-sky-200',
      Frecuenti: 'bg-violet-50 text-violet-700 border border-violet-200',
    };
    return map[gateway] ?? 'bg-slate-100 text-slate-600 border border-slate-200';
  }

  statusBadge(status: string): string {
    const map: Record<string, string> = {
      Approved: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
      Pending: 'bg-amber-50 text-amber-700 border border-amber-200',
      Declined: 'bg-red-50 text-red-700 border border-red-200',
    };
    return map[status] ?? 'bg-slate-100 text-slate-600 border border-slate-200';
  }

  statusDot(status: string): string {
    const map: Record<string, string> = {
      Approved: 'bg-emerald-500',
      Pending: 'bg-amber-500',
      Declined: 'bg-red-500',
    };
    return map[status] ?? 'bg-slate-400';
  }

  formatCOP(value: string | number | null | undefined): string {
    if (value == null) return '$ 0';
    const n = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(n)) return '$ 0';
    return '$ ' + n.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  }

  formatDate(dateStr: string): string {
    const d = new Date(dateStr);
    return d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  readonly gateways = ['Wompi', 'PayU', 'PayPal', 'Frecuenti'];
  readonly statuses = ['Approved', 'Pending', 'Declined'];
}
