import { Component, inject, signal, computed, effect, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { VolunteersService, Volunteer } from '../../core/services/volunteers.service';

@Component({
  selector: 'app-voluntarios',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './voluntarios.component.html',
})
export class VoluntariosComponent implements OnInit {
  private svc = inject(VolunteersService);

  volunteers   = signal<Volunteer[]>([]);
  total        = signal(0);
  page         = signal(1);
  totalPages   = signal(1);
  loading      = signal(false);
  updating     = signal<string | null>(null);
  search       = signal('');
  statusFilter = signal('');
  kpis         = signal({ activos: 0, inactivos: 0 });

  pages = computed(() =>
    Array.from({ length: this.totalPages() }, (_, i) => i + 1)
  );

  private searchTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    effect(() => {
      void this.page();
      void this.statusFilter();
      this.load();
    }, { allowSignalWrites: true });
  }

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.svc.getAll(this.page(), 20, this.search() || undefined, this.statusFilter() || undefined)
      .subscribe({
        next: res => {
          this.volunteers.set(res.data);
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

  onStatusFilter(value: string) {
    this.statusFilter.set(value);
    this.page.set(1);
  }

  updateStatus(v: Volunteer, status: string) {
    this.updating.set(v.id);
    this.svc.updateStatus(v.id, status).subscribe({
      next: () => {
        this.volunteers.update(list =>
          list.map(x => x.id === v.id ? { ...x, status } : x)
        );
        const all = this.volunteers();
        this.kpis.set({
          activos:   all.filter(x => x.status === 'Activo').length,
          inactivos: all.filter(x => x.status === 'Inactivo').length,
        });
        this.updating.set(null);
      },
      error: () => this.updating.set(null),
    });
  }

  statusBadge(status: string): string {
    return status === 'Activo'
      ? 'bg-green-100 text-green-700'
      : 'bg-slate-100 text-slate-500';
  }
}
