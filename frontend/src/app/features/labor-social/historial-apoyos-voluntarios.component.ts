import { Component, inject, signal, computed, effect, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VolunteersService, VolunteerSupport } from '../../core/services/volunteers.service';

const TIPOS = ['Administrativos', 'Comunicaciones', 'Eventos', 'Productos'];

@Component({
  selector: 'app-historial-apoyos-voluntarios',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './historial-apoyos-voluntarios.component.html',
})
export class HistorialApoyosVoluntariosComponent implements OnInit {
  private svc = inject(VolunteersService);

  supports   = signal<VolunteerSupport[]>([]);
  total      = signal(0);
  page       = signal(1);
  totalPages = signal(1);
  loading    = signal(false);

  search     = signal('');
  typeFilter = signal('');

  kpis = signal({ totalApoyos: 0, totalHoras: 0, totalAlimentacion: 0 });

  readonly tipos = TIPOS;

  pages = computed(() =>
    Array.from({ length: this.totalPages() }, (_, i) => i + 1)
  );

  private searchTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    effect(() => {
      void this.page();
      void this.typeFilter();
      this.load();
    }, { allowSignalWrites: true });
  }

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.svc.getSupports(this.page(), 20, this.search() || undefined, this.typeFilter() || undefined)
      .subscribe({
        next: res => {
          this.supports.set(res.data);
          this.total.set(res.total);
          this.totalPages.set(res.totalPages);
          this.kpis.set(res.kpis);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }

  onSearch(value: string) {
    this.search.set(value);
    if (this.searchTimeout) clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => { this.page.set(1); this.load(); }, 350);
  }

  onTypeFilter(value: string) {
    this.typeFilter.set(value);
    this.page.set(1);
  }

  typeBadge(type: string | null): string {
    const map: Record<string, string> = {
      'Eventos':         'bg-purple-100 text-purple-700',
      'Productos':       'bg-blue-100 text-blue-700',
      'Administrativos': 'bg-amber-100 text-amber-700',
      'Comunicaciones':  'bg-teal-100 text-teal-700',
    };
    return type ? (map[type] ?? 'bg-slate-100 text-slate-600') : 'bg-slate-100 text-slate-400';
  }
}
