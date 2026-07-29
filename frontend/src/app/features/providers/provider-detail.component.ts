import { Component, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CurrencyPipe, DatePipe, SlicePipe } from '@angular/common';
import { environment } from '../../../environments/environment';

interface Provider {
  id: string;
  name: string;
  docType: string;
  docNumber: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  department: string | null;
  contactName: string | null;
  status: string;
  createdAt: string;
  // Sección 1
  tipoSolicitud: string | null;
  tipoSolicitudOtro: string | null;
  // Sección 2
  naturaleza: string | null;
  formaPagoTipo: string | null;
  diasCredito: string | null;
  // Sección 3 - Persona Natural
  lugarExpedicion: string | null;
  fechaExpedicion: string | null;
  nationality: string | null;
  departamentoResidencia: string | null;
  ciudadResidencia: string | null;
  telefonoDomicilio: string | null;
  primerApellido: string | null;
  segundoApellido: string | null;
  primerNombre: string | null;
  segundoNombre: string | null;
  // Sección 4 - Persona Jurídica
  nit: string | null;
  digitoVerificacion: string | null;
  correoEmpresa: string | null;
  telefonoEmpresa: string | null;
  direccionOficina: string | null;
  repLegal: Record<string, string> | null;
  // Sección 5
  actividadTipo: string | null;
  actividadOtro: string | null;
  codigoCIIU: string | null;
  descripcionActividad: string | null;
  // Sección 6
  formaPago: string | null;
  tipoCuenta: string | null;
  numeroCuenta: string | null;
  diasPago: string | null;
  // Sección 7
  factNombre: string | null;
  factCargo: string | null;
  factTelefono: string | null;
  factExt: string | null;
  factCelular: string | null;
  factEmail: string | null;
  // Sección 8-9
  referencias: unknown[] | null;
  accionistas: unknown[] | null;
  // Sección 10
  totalActivos: string | null;
  totalPasivos: string | null;
  totalPatrimonio: string | null;
  ingresosMensuales: string | null;
  egresosMensuales: string | null;
  otrosIngresosMensuales: string | null;
  conceptoOtrosIngresos: string | null;
  // Sección 11
  operaciones: unknown[] | null;
  // Sección 12
  manejaRecursosPublicos: string | null;
  tieneReconocimientoPublico: string | null;
  ejercePoder: string | null;
  esFamiliarPPE: string | null;
  familiarPPEInfo: string | null;
  // Documentos
  rutPath: string | null;
  camaraComercioPath: string | null;
  certBancariaPath: string | null;
  formatoProveedorPath: string | null;
  // Aceptaciones
  aceptaDeclaracion: boolean | null;
  aceptaTratamientoDatos: boolean | null;
}

@Component({
  selector: 'app-provider-detail',
  standalone: true,
  imports: [RouterLink, CurrencyPipe, DatePipe, SlicePipe],
  templateUrl: './provider-detail.component.html',
})
export class ProviderDetailComponent implements OnInit {
  private http   = inject(HttpClient);
  private route  = inject(ActivatedRoute);

  provider = signal<Provider | null>(null);
  loading  = signal(true);
  error    = signal('');
  updating = signal(false);
  successMsg = signal('');

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.http.get<Provider>(`${environment.apiUrl}/providers/${id}`).subscribe({
      next: p  => { this.provider.set(p); this.loading.set(false); },
      error: () => { this.error.set('No se pudo cargar el proveedor'); this.loading.set(false); },
    });
  }

  get p(): Provider | null { return this.provider(); }

  statusBadge(status: string): string {
    const map: Record<string, string> = {
      'Pendiente': 'bg-amber-100 text-amber-800 border border-amber-200',
      'Aprobado':  'bg-emerald-100 text-emerald-800 border border-emerald-200',
      'Rechazado': 'bg-red-100 text-red-800 border border-red-200',
    };
    return map[status] ?? 'bg-slate-100 text-slate-700';
  }

  updateStatus(status: 'Aprobado' | 'Rechazado') {
    const p = this.p;
    if (!p) return;
    this.updating.set(true);
    this.http.patch(`${environment.apiUrl}/providers/${p.id}/status`, { status }).subscribe({
      next: () => {
        this.provider.update(cur => cur ? { ...cur, status } : cur);
        this.updating.set(false);
        this.successMsg.set(`Proveedor ${status.toLowerCase()} correctamente`);
        setTimeout(() => this.successMsg.set(''), 3500);
      },
      error: () => this.updating.set(false),
    });
  }

  fileUrl(path: string | null): string | null {
    if (!path) return null;
    return `${environment.apiUrl.replace('/api', '')}/uploads/${path.replace(/.*uploads\//, '')}`;
  }

  val(v: string | null | undefined): string {
    return v ?? '—';
  }
}
