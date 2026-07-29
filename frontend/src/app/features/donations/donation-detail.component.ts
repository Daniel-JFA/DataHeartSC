import { Component, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { DonationsService, Donation } from '../../core/services/donations.service';

@Component({
  selector: 'app-donation-detail',
  standalone: true,
  imports: [RouterLink, DecimalPipe],
  templateUrl: './donation-detail.component.html',
})
export class DonationDetailComponent implements OnInit {
  private svc   = inject(DonationsService);
  private route = inject(ActivatedRoute);

  donation = signal<Donation | null>(null);
  loading  = signal(true);
  error    = signal('');

  statusOptions = ['Approved', 'Pending', 'Declined'];

  statusColors: Record<string, string> = {
    Approved: 'bg-emerald-100 text-emerald-700',
    Pending:  'bg-amber-100 text-amber-700',
    Declined: 'bg-red-100 text-red-700',
  };
  statusDots: Record<string, string> = {
    Approved: 'bg-emerald-500',
    Pending:  'bg-amber-500',
    Declined: 'bg-red-500',
  };
  gatewayColors: Record<string, string> = {
    Wompi:    'bg-violet-100 text-violet-700',
    PayU:     'bg-blue-100 text-blue-700',
    PayPal:   'bg-sky-100 text-sky-700',
    Frecuenti:'bg-purple-100 text-purple-700',
  };

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.svc.getOne(id).subscribe({
      next: d  => { this.donation.set(d); this.loading.set(false); },
      error: () => { this.error.set('No se pudo cargar la donación'); this.loading.set(false); },
    });
  }

  updateStatus(status: string) {
    const d = this.donation();
    if (!d) return;
    this.svc.updateStatus(d.id, status).subscribe({
      next: updated => this.donation.set({ ...d, ...updated }),
    });
  }

  downloadCert(certId: string, certNumber: number) {
    this.svc.downloadCertificate(certId).subscribe({
      next: blob => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `certificado_SC-${new Date().getFullYear()}-${String(certNumber).padStart(4, '0')}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
      },
    });
  }

  formatCOP(value: string | number | null | undefined): string {
    if (value == null) return '$ 0';
    const n = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(n)) return '$ 0';
    return '$ ' + n.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  }

  formatDate(d: string) {
    return new Date(d).toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }
}
