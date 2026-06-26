import { Component, OnInit, OnDestroy, inject, signal, ElementRef, ViewChild } from '@angular/core';
import { DecimalPipe, CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DashboardService, DashboardStats } from '../../core/services/dashboard.service';
import Chart from 'chart.js/auto';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [DecimalPipe, CurrencyPipe, RouterLink],
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent implements OnInit, OnDestroy {
  private svc = inject(DashboardService);

  stats   = signal<DashboardStats | null>(null);
  loading = signal(true);
  error   = signal('');

  revenueChart: Chart | null = null;
  statusChart:  Chart | null = null;

  private revenueCanvas: HTMLCanvasElement | null = null;
  private statusCanvas: HTMLCanvasElement | null = null;

  @ViewChild('revenueChart') set revenueCanvasRef(ref: ElementRef<HTMLCanvasElement> | undefined) {
    this.revenueCanvas = ref ? ref.nativeElement : null;
    this.tryInitCharts();
  }

  @ViewChild('statusChart') set statusCanvasRef(ref: ElementRef<HTMLCanvasElement> | undefined) {
    this.statusCanvas = ref ? ref.nativeElement : null;
    this.tryInitCharts();
  }

  readonly statusColors: Record<string, string> = {
    'Recibido':       'bg-blue-100 text-blue-700',
    'En preparación': 'bg-yellow-100 text-yellow-700',
    'Despachado':     'bg-purple-100 text-purple-700',
    'Entregado':      'bg-green-100 text-green-700',
    'Cancelado':      'bg-red-100 text-red-700',
  };

  readonly paymentColors: Record<string, string> = {
    'Pagado':    'bg-emerald-100 text-emerald-700',
    'Pendiente': 'bg-yellow-100 text-yellow-700',
    'Cancelado': 'bg-red-100 text-red-700',
  };

  ngOnInit(): void {
    this.svc.getStats().subscribe({
      next: data => {
        this.stats.set(data);
        this.loading.set(false);
        this.tryInitCharts();
      },
      error: () => {
        this.error.set('No se pudo cargar el dashboard. Verifica tu conexión.');
        this.loading.set(false);
      },
    });
  }

  ngOnDestroy(): void {
    this.revenueChart?.destroy();
    this.statusChart?.destroy();
  }

  private tryInitCharts(): void {
    const stats = this.stats();
    if (!stats) return;

    if (this.revenueCanvas) {
      this.initRevenueChart(this.revenueCanvas, stats);
    }
    if (this.statusCanvas) {
      this.initStatusChart(this.statusCanvas, stats);
    }
  }

  private initRevenueChart(canvas: HTMLCanvasElement, stats: DashboardStats): void {
    this.revenueChart?.destroy();
    this.revenueChart = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: stats.revenueByDay.map(d => d.date.slice(5)),
        datasets: [{
          data: stats.revenueByDay.map(d => d.total),
          backgroundColor: 'rgba(225, 29, 72, 0.15)',
          borderColor: '#e11d48',
          borderWidth: 2,
          borderRadius: 4,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: {
            grid: { display: false },
            ticks: { maxTicksLimit: 10, font: { size: 11 } },
          },
          y: {
            grid: { color: '#f1f5f9' },
            ticks: {
              font: { size: 11 },
              callback: (v) => '$' + Number(v).toLocaleString('es-CO'),
            },
          },
        },
      },
    });
  }

  private initStatusChart(canvas: HTMLCanvasElement, stats: DashboardStats): void {
    this.statusChart?.destroy();
    const chartStatusColors: Record<string, string> = {
      'Recibido':       '#64748b',
      'En preparación': '#f59e0b',
      'Despachado':     '#3b82f6',
      'Entregado':      '#10b981',
      'Cancelado':      '#ef4444',
    };

    this.statusChart = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: stats.ordersByStatus.map(s => s.status),
        datasets: [{
          data: stats.ordersByStatus.map(s => s.count),
          backgroundColor: stats.ordersByStatus.map(s => chartStatusColors[s.status] || '#94a3b8'),
          borderWidth: 0,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '65%',
        plugins: {
          legend: { position: 'bottom', labels: { font: { size: 12 }, padding: 16 } },
        },
      },
    });
  }


  formatCOP(n: number): string {
    return '$' + n.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  }

  formatDate(d: string): string {
    return new Date(d).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  statusBadge(status: string): string {
    return this.statusColors[status] || 'bg-slate-100 text-slate-600';
  }

  paymentBadge(status: string): string {
    return this.paymentColors[status] || 'bg-slate-100 text-slate-600';
  }

  stockPercent(stock: number, minStock: number): number {
    if (minStock === 0) return 100;
    return Math.min(100, Math.round((stock / minStock) * 100));
  }

  today(): string {
    return new Date().toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  }
}
