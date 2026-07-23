import { Component, inject, signal, computed, effect } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { CurrencyPipe } from '@angular/common';
import { environment } from '../../../environments/environment';

interface Ayuda {
  id: string;
  fecha: string;
  tipoSolicitud: string;
  personasBeneficiadas: number;
  justificacion: string | null;
  valor: number;
  estado: string;
  beneficiary: { id: string; firstName: string; lastName: string; docNumber: string };
}

interface AyudasResponse {
  data: Ayuda[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface AyudasStats {
  total: number;
  totalValor: number;
  ayudasMes: number;
  resueltas: number;
  pendientes: number;
}

const TIPOS_SOLICITUD = [
  'Ropa y Juguetes',
  'Recreación',
  'Pañales y otros',
  'Transporte',
  'Alimentación',
  'Copagos',
  'Medicamento',
  'Alojamiento',
  'Cita Médica',
  'Ayudas Diagnósticas',
  'Servicio Funerario',
  'Otra',
  'Capacitación',
  'Empleo',
  'Asesorías',
  'Apoyo emprendimientos',
];

const TIPO_COLOR_MAP: Record<string, string> = {
  'Ropa y Juguetes':      'bg-pink-100 text-pink-800 border border-pink-200',
  'Recreación':           'bg-purple-100 text-purple-800 border border-purple-200',
  'Pañales y otros':      'bg-yellow-100 text-yellow-800 border border-yellow-200',
  'Transporte':           'bg-blue-100 text-blue-800 border border-blue-200',
  'Alimentación':         'bg-green-100 text-green-800 border border-green-200',
  'Copagos':              'bg-cyan-100 text-cyan-800 border border-cyan-200',
  'Medicamento':          'bg-red-100 text-red-800 border border-red-200',
  'Alojamiento':          'bg-orange-100 text-orange-800 border border-orange-200',
  'Cita Médica':          'bg-teal-100 text-teal-800 border border-teal-200',
  'Ayudas Diagnósticas':  'bg-indigo-100 text-indigo-800 border border-indigo-200',
  'Servicio Funerario':   'bg-slate-100 text-slate-800 border border-slate-200',
  'Capacitación':         'bg-lime-100 text-lime-800 border border-lime-200',
  'Empleo':               'bg-emerald-100 text-emerald-800 border border-emerald-200',
  'Asesorías':            'bg-violet-100 text-violet-800 border border-violet-200',
  'Apoyo emprendimientos':'bg-fuchsia-100 text-fuchsia-800 border border-fuchsia-200',
};

@Component({
  selector: 'app-historial-ayudas',
  standalone: true,
  imports: [CurrencyPipe],
  templateUrl: './historial-ayudas.component.html',
})
export class HistorialAyudasComponent {
  private http = inject(HttpClient);

  readonly tiposSolicitud = TIPOS_SOLICITUD;

  ayudas      = signal<Ayuda[]>([]);
  total       = signal(0);
  totalPages  = signal(0);
  page        = signal(1);
  loading     = signal(false);
  tipoFilter  = signal('');
  estadoFilter = signal('');
  kpis        = signal<AyudasStats | null>(null);

  valorTotal = computed(() =>
    this.ayudas().reduce((sum, a) => sum + (a.valor ?? 0), 0)
  );

  pages = computed<number[]>(() =>
    Array.from({ length: this.totalPages() }, (_, i) => i + 1)
  );

  constructor() {
    effect(() => {
      this.page();
      this.tipoFilter();
      this.estadoFilter();
      this.load();
    }, { allowSignalWrites: true });

    this.loadStats();
  }

  load() {
    this.loading.set(true);
    let params = new HttpParams()
      .set('page', this.page())
      .set('limit', 20);

    if (this.tipoFilter()) params = params.set('tipoSolicitud', this.tipoFilter());
    if (this.estadoFilter()) params = params.set('estado', this.estadoFilter());

    this.http.get<AyudasResponse>(`${environment.apiUrl}/ayudas`, { params })
      .subscribe({
        next: res => {
          this.ayudas.set(res.data);
          this.total.set(res.total);
          this.totalPages.set(res.totalPages);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }

  private loadStats() {
    this.http.get<AyudasStats>(`${environment.apiUrl}/ayudas/stats`)
      .subscribe({
        next: stats => this.kpis.set(stats),
        error: () => {},
      });
  }

  onTipoFilter(value: string) {
    this.tipoFilter.set(value);
    this.page.set(1);
  }

  onEstadoFilter(value: string) {
    this.estadoFilter.set(value);
    this.page.set(1);
  }

  tipoBadge(tipo: string): string {
    return TIPO_COLOR_MAP[tipo] ?? 'bg-slate-100 text-slate-700 border border-slate-200';
  }

  estadoBadge(estado: string): string {
    const map: Record<string, string> = {
      'Resuelta':  'bg-green-100 text-green-800 border border-green-200',
      'Pendiente': 'bg-amber-100 text-amber-800 border border-amber-200',
    };
    return map[estado] ?? 'bg-slate-100 text-slate-700 border border-slate-200';
  }
}
