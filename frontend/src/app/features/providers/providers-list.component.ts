import { Component, inject, signal, computed, effect } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SlicePipe } from '@angular/common';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';

interface Provider {
  id: string;
  name: string;
  docType: string;
  docNumber: string;
  email: string | null;
  phone: string | null;
  city: string | null;
  department: string | null;
  naturaleza: string | null;
  tipoSolicitud: string | null;
  contactName: string | null;
  status: string;
  createdAt: string;
  rutPath: string | null;
  camaraComercioPath: string | null;
  certBancariaPath: string | null;
}

interface ProvidersResponse {
  data: Provider[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Component({
  selector: 'app-providers-list',
  standalone: true,
  imports: [RouterLink, FormsModule, SlicePipe],
  templateUrl: './providers-list.component.html',
})
export class ProvidersListComponent {
  private http = inject(HttpClient);

  providers  = signal<Provider[]>([]);
  total      = signal(0);
  totalPages = signal(0);
  page       = signal(1);
  search     = signal('');
  loading    = signal(false);
  updating   = signal<string | null>(null); // id del proveedor que se está actualizando

  pendientes = computed(() => this.providers().filter(p => p.status === 'Pendiente').length);
  aprobados  = computed(() => this.providers().filter(p => p.status === 'Aprobado').length);
  rechazados = computed(() => this.providers().filter(p => p.status === 'Rechazado').length);

  private searchTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    effect(() => {
      this.page();
      this.load();
    }, { allowSignalWrites: true });
  }

  load() {
    this.loading.set(true);
    let params = new HttpParams()
      .set('page', this.page())
      .set('limit', 15);
    if (this.search()) params = params.set('search', this.search());

    this.http.get<ProvidersResponse>(`${environment.apiUrl}/providers`, { params })
      .subscribe({
        next: res => {
          this.providers.set(res.data);
          this.total.set(res.total);
          this.totalPages.set(res.totalPages);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }

  onSearch(q: string) {
    this.search.set(q);
    if (this.searchTimeout) clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.page.set(1);
      this.load();
    }, 350);
  }

  updateStatus(provider: Provider, status: 'Aprobado' | 'Rechazado') {
    this.updating.set(provider.id);
    this.http.patch(`${environment.apiUrl}/providers/${provider.id}/status`, { status })
      .subscribe({
        next: () => {
          this.providers.update(list =>
            list.map(p => p.id === provider.id ? { ...p, status } : p)
          );
          this.updating.set(null);
        },
        error: () => this.updating.set(null),
      });
  }

  statusBadge(status: string): string {
    const map: Record<string, string> = {
      'Pendiente':  'bg-amber-100 text-amber-800 border border-amber-200',
      'Aprobado':   'bg-green-100 text-green-800 border border-green-200',
      'Rechazado':  'bg-red-100 text-red-800 border border-red-200',
    };
    return map[status] ?? 'bg-slate-100 text-slate-700';
  }

  pages(): number[] {
    return Array.from({ length: this.totalPages() }, (_, i) => i + 1);
  }
}
