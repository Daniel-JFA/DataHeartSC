import { Component, inject, signal, computed, effect } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';

interface Client {
  id: string;
  name: string;
  docType: string;
  docNumber: string;
  email: string | null;
  phone: string | null;
  city: string | null;
  status: string;
  createdAt: string;
  _count: { orders: number; donations: number };
}

interface CityCount {
  city: string | null;
  count: number;
}

interface SegmentResponse {
  data: Client[];
  total: number;
  page: number;
  totalPages: number;
  kpis: {
    conEmail: number;
    conTelefono: number;
    ciudades: CityCount[];
  };
}

interface Filters {
  city: string;
  status: string;
  hasEmail: boolean | null;
  hasPhone: boolean | null;
  hasDonations: boolean | null;
  hasOrders: boolean | null;
}

@Component({
  selector: 'app-segmentacion',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './segmentacion.component.html',
})
export class SegmentacionComponent {
  private http = inject(HttpClient);

  results    = signal<Client[]>([]);
  total      = signal(0);
  totalPages = signal(0);
  page       = signal(1);
  loading    = signal(false);
  kpiEmail   = signal(0);
  kpiPhone   = signal(0);
  ciudades   = signal<CityCount[]>([]);
  copied     = signal(false);

  filters = signal<Filters>({
    city: '',
    status: '',
    hasEmail: null,
    hasPhone: null,
    hasDonations: null,
    hasOrders: null,
  });

  // Draft filters — bound to form inputs, applied only on button click
  draftCity        = signal('');
  draftStatus      = signal('');
  draftHasEmail    = signal(false);
  draftHasPhone    = signal(false);
  draftHasDonations = signal(false);
  draftHasOrders   = signal(false);

  hasActiveFilters = computed(() => {
    const f = this.filters();
    return !!(f.city || f.status || f.hasEmail || f.hasPhone || f.hasDonations || f.hasOrders);
  });

  constructor() {
    effect(() => {
      this.page();
      this.load();
    }, { allowSignalWrites: true });
  }

  applyFilters() {
    this.filters.set({
      city:         this.draftCity(),
      status:       this.draftStatus(),
      hasEmail:     this.draftHasEmail() || null,
      hasPhone:     this.draftHasPhone() || null,
      hasDonations: this.draftHasDonations() || null,
      hasOrders:    this.draftHasOrders() || null,
    });
    this.page.set(1);
    this.load();
  }

  clearFilters() {
    this.draftCity.set('');
    this.draftStatus.set('');
    this.draftHasEmail.set(false);
    this.draftHasPhone.set(false);
    this.draftHasDonations.set(false);
    this.draftHasOrders.set(false);
    this.filters.set({
      city: '', status: '',
      hasEmail: null, hasPhone: null, hasDonations: null, hasOrders: null,
    });
    this.page.set(1);
    this.load();
  }

  load() {
    this.loading.set(true);
    const f = this.filters();
    let params = new HttpParams()
      .set('page', this.page())
      .set('limit', 20);

    if (f.city)         params = params.set('city', f.city);
    if (f.status)       params = params.set('status', f.status);
    if (f.hasEmail)     params = params.set('hasEmail', 'true');
    if (f.hasPhone)     params = params.set('hasPhone', 'true');
    if (f.hasDonations) params = params.set('hasDonations', 'true');
    if (f.hasOrders)    params = params.set('hasOrders', 'true');

    this.http.get<SegmentResponse>(`${environment.apiUrl}/clients/segment`, { params })
      .subscribe({
        next: res => {
          this.results.set(res.data);
          this.total.set(res.total);
          this.totalPages.set(res.totalPages);
          this.kpiEmail.set(res.kpis.conEmail);
          this.kpiPhone.set(res.kpis.conTelefono);
          this.ciudades.set(res.kpis.ciudades);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }

  copyEmails() {
    const emails = this.results()
      .map(c => c.email)
      .filter((e): e is string => !!e)
      .join(', ');

    if (!emails) return;

    navigator.clipboard.writeText(emails).then(() => {
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2500);
    });
  }

  statusBadge(status: string): string {
    const map: Record<string, string> = {
      'Activo':   'bg-green-100 text-green-800 border border-green-200',
      'Inactivo': 'bg-red-100 text-red-800 border border-red-200',
    };
    return map[status] ?? 'bg-slate-100 text-slate-700';
  }

  pages(): number[] {
    const total = this.totalPages();
    const cur   = this.page();
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    const start = Math.max(1, cur - 2);
    const end   = Math.min(total, cur + 2);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }
}
