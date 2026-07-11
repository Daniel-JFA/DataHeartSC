import { Component, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DecimalPipe, DatePipe, CurrencyPipe } from '@angular/common';
import { BeneficiariesService, BeneficiaryDetail } from '../../core/services/beneficiaries.service';

@Component({
  selector: 'app-beneficiary-detail',
  standalone: true,
  imports: [RouterLink, DecimalPipe, DatePipe, CurrencyPipe],
  templateUrl: './beneficiary-detail.component.html',
})
export class BeneficiaryDetailComponent implements OnInit {
  private svc   = inject(BeneficiariesService);
  private route = inject(ActivatedRoute);

  beneficiary = signal<BeneficiaryDetail | null>(null);
  loading     = signal(true);
  error       = signal('');

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.svc.getOne(id).subscribe({
      next: b => { this.beneficiary.set(b); this.loading.set(false); },
      error: () => { this.error.set('No se pudo cargar el beneficiario'); this.loading.set(false); },
    });
  }

  age(birthDate?: string): string {
    if (!birthDate) return '—';
    const diff = Date.now() - new Date(birthDate).getTime();
    const years = Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
    return years >= 0 ? `${years} años` : '—';
  }

  statusBadge(status: string): string {
    if (status === 'Activo')    return 'bg-emerald-100 text-emerald-700';
    if (status === 'Fallecido') return 'bg-slate-100 text-slate-500';
    return 'bg-red-100 text-red-700';
  }

  estadoBadge(estado: string): string {
    return estado === 'Resuelta'
      ? 'bg-emerald-100 text-emerald-700'
      : 'bg-amber-100 text-amber-700';
  }

  totalAyudas(): number {
    const b = this.beneficiary();
    if (!b?.ayudas) return 0;
    return b.ayudas.reduce((sum, a) => sum + parseFloat(a.valor ?? '0'), 0);
  }

  // Expuesto al template para evitar problemas de scope con alias @if
  get b(): BeneficiaryDetail | null { return this.beneficiary(); }
}
