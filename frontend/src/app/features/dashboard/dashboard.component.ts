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
  categoryChart: Chart | null = null;
  gatewayChart: Chart | null = null;

  private revenueCanvas: HTMLCanvasElement | null = null;
  private statusCanvas: HTMLCanvasElement | null = null;
  private categoryCanvas: HTMLCanvasElement | null = null;
  private gatewayCanvas: HTMLCanvasElement | null = null;

  @ViewChild('revenueChart') set revenueCanvasRef(ref: ElementRef<HTMLCanvasElement> | undefined) {
    this.revenueCanvas = ref ? ref.nativeElement : null;
    this.tryInitCharts();
  }

  @ViewChild('statusChart') set statusCanvasRef(ref: ElementRef<HTMLCanvasElement> | undefined) {
    this.statusCanvas = ref ? ref.nativeElement : null;
    this.tryInitCharts();
  }

  @ViewChild('categoryChart') set categoryCanvasRef(ref: ElementRef<HTMLCanvasElement> | undefined) {
    this.categoryCanvas = ref ? ref.nativeElement : null;
    this.tryInitCharts();
  }

  @ViewChild('gatewayChart') set gatewayCanvasRef(ref: ElementRef<HTMLCanvasElement> | undefined) {
    this.gatewayCanvas = ref ? ref.nativeElement : null;
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
    this.categoryChart?.destroy();
    this.gatewayChart?.destroy();
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
    if (this.categoryCanvas) {
      this.initCategoryChart(this.categoryCanvas, stats);
    }
    if (this.gatewayCanvas) {
      this.initGatewayChart(this.gatewayCanvas, stats);
    }
  }

  private initRevenueChart(canvas: HTMLCanvasElement, stats: DashboardStats): void {
    this.revenueChart?.destroy();

    const ctx = canvas.getContext('2d');
    let gradientSales: any = 'rgba(79, 70, 229, 0.05)';
    let gradientDonations: any = 'rgba(225, 29, 72, 0.05)';

    if (ctx) {
      const g1 = ctx.createLinearGradient(0, 0, 0, 300);
      g1.addColorStop(0, 'rgba(79, 70, 229, 0.25)');
      g1.addColorStop(1, 'rgba(79, 70, 229, 0.01)');
      gradientSales = g1;

      const g2 = ctx.createLinearGradient(0, 0, 0, 300);
      g2.addColorStop(0, 'rgba(225, 29, 72, 0.25)');
      g2.addColorStop(1, 'rgba(225, 29, 72, 0.01)');
      gradientDonations = g2;
    }

    this.revenueChart = new Chart(canvas, {
      type: 'line',
      data: {
        labels: stats.revenueByDay.map(d => this.formatShortDate(d.date)),
        datasets: [
          {
            label: 'Ventas (Tienda)',
            data: stats.revenueByDay.map(d => d.total),
            borderColor: '#4f46e5',
            backgroundColor: gradientSales,
            fill: true,
            tension: 0.35,
            borderWidth: 3,
            pointBackgroundColor: '#4f46e5',
            pointHoverRadius: 6,
          },
          {
            label: 'Donaciones',
            data: stats.donationsByDay.map(d => d.total),
            borderColor: '#e11d48',
            backgroundColor: gradientDonations,
            fill: true,
            tension: 0.35,
            borderWidth: 3,
            pointBackgroundColor: '#e11d48',
            pointHoverRadius: 6,
          }
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'top',
            labels: {
              boxWidth: 10,
              usePointStyle: true,
              pointStyle: 'circle',
              font: { size: 11, weight: 'bold' as const },
              padding: 14
            }
          },
          tooltip: {
            padding: 10,
            backgroundColor: 'rgba(15, 23, 42, 0.9)',
            titleFont: { size: 12 },
            bodyFont: { size: 12 },
            callbacks: {
              label: (context) => {
                let label = context.dataset.label || '';
                if (label) label += ': ';
                if (context.parsed.y !== null) {
                  label += new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(context.parsed.y);
                }
                return label;
              }
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { maxTicksLimit: 10, font: { size: 10 } },
          },
          y: {
            grid: { color: '#f1f5f9' },
            ticks: {
              font: { size: 10 },
              callback: (v) => '$' + Number(v).toLocaleString('es-CO'),
            },
          },
        },
      },
    });
  }

  formatShortDate(dateStr: string): string {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
      const monthIdx = parseInt(parts[1], 10) - 1;
      return `${parts[2]} ${monthNames[monthIdx]}`;
    }
    return dateStr;
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

  private initCategoryChart(canvas: HTMLCanvasElement, stats: DashboardStats): void {
    this.categoryChart?.destroy();
    this.categoryChart = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: stats.topCategories.map(c => c.category),
        datasets: [{
          data: stats.topCategories.map(c => c.total),
          backgroundColor: [
            'rgba(79, 70, 229, 0.75)',
            'rgba(124, 58, 237, 0.75)',
            'rgba(236, 72, 153, 0.75)',
            'rgba(245, 158, 11, 0.75)',
            'rgba(16, 185, 129, 0.75)'
          ],
          borderRadius: 6,
          borderWidth: 0,
          barThickness: 14
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            padding: 8,
            backgroundColor: 'rgba(15, 23, 42, 0.9)',
          }
        },
        scales: {
          x: {
            grid: { color: '#f1f5f9' },
            ticks: { font: { size: 10 } }
          },
          y: {
            grid: { display: false },
            ticks: { font: { size: 10 } }
          }
        }
      }
    });
  }

  private initGatewayChart(canvas: HTMLCanvasElement, stats: DashboardStats): void {
    this.gatewayChart?.destroy();
    const gatewayColors: Record<string, string> = {
      'Wompi': '#10b981',
      'PayU': '#f59e0b',
      'PayPal': '#3b82f6',
      'Frecuenti': '#ec4899',
    };

    this.gatewayChart = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: stats.donationsByGateway.map(g => g.gateway),
        datasets: [{
          data: stats.donationsByGateway.map(g => g.amount),
          backgroundColor: stats.donationsByGateway.map(g => gatewayColors[g.gateway] || '#94a3b8'),
          borderWidth: 0,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '60%',
        plugins: {
          legend: {
            position: 'right',
            labels: {
              boxWidth: 8,
              usePointStyle: true,
              pointStyle: 'circle',
              font: { size: 10 },
              padding: 10
            }
          },
          tooltip: {
            padding: 10,
            backgroundColor: 'rgba(15, 23, 42, 0.9)',
            callbacks: {
              label: (context) => {
                let label = context.label || '';
                if (label) label += ': ';
                if (context.parsed !== null) {
                  label += new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(context.parsed);
                }
                return label;
              }
            }
          }
        }
      }
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
