import { Component, inject, signal, DestroyRef } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DecimalPipe, CurrencyPipe } from '@angular/common';
import { Subject, EMPTY } from 'rxjs';
import { debounceTime, switchMap, catchError } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BeneficiariesService, Beneficiary, BeneficiaryStats } from '../../core/services/beneficiaries.service';
import { PaginationComponent } from '../../shared/components/pagination/pagination.component';

@Component({
  selector: 'app-beneficiaries-list',
  standalone: true,
  imports: [RouterLink, DecimalPipe, CurrencyPipe, PaginationComponent],
  templateUrl: './beneficiaries-list.component.html',
})
export class BeneficiariesListComponent {
  private svc       = inject(BeneficiariesService);
  private destroyRef = inject(DestroyRef);
  private trigger$  = new Subject<void>();

  beneficiaries = signal<Beneficiary[]>([]);
  total         = signal(0);
  totalPages    = signal(1);
  page          = signal(1);
  limit         = signal(20);
  search        = signal('');
  statusFilter  = signal('');
  loading       = signal(false);
  stats         = signal<BeneficiaryStats | null>(null);

  constructor() {
    this.trigger$.pipe(
      debounceTime(300),
      switchMap(() => {
        this.loading.set(true);
        return this.svc.getAll(this.page(), this.limit(), this.search(), this.statusFilter()).pipe(
          catchError(() => { this.loading.set(false); return EMPTY; }),
        );
      }),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(res => {
      this.beneficiaries.set(res.data);
      this.total.set(res.total);
      this.totalPages.set(res.totalPages);
      this.loading.set(false);
    });

    this.trigger$.next(); // carga inicial
    this.loadStats();
  }

  load() { this.trigger$.next(); }

  loadStats() {
    this.svc.getStats().subscribe({ next: s => this.stats.set(s) });
  }

  onSearch(e: Event) {
    this.search.set((e.target as HTMLInputElement).value);
    this.page.set(1);
    this.load();
  }

  onStatus(e: Event) {
    this.statusFilter.set((e.target as HTMLSelectElement).value);
    this.page.set(1);
    this.load();
  }

  onPageChange(p: number) { this.page.set(p); this.load(); }

  statusBadge(status: string): string {
    if (status === 'Activo')    return 'bg-emerald-100 text-emerald-700';
    if (status === 'Fallecido') return 'bg-slate-100 text-slate-500';
    return 'bg-red-100 text-red-700';
  }

  statusLabel(status: string): string {
    if (status === 'Fallecido') return 'Fallecido(a)';
    return status;
  }

  age(birthDate?: string): string {
    if (!birthDate) return '—';
    const diff = Date.now() - new Date(birthDate).getTime();
    const years = Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
    return years >= 0 ? `${years} años` : '—';
  }
}
