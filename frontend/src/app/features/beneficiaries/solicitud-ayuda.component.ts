import { Component, inject, signal, computed } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

type Step = 'form' | 'success' | 'error';

const TIPOS_AYUDA = [
  { value: 'ALOJAMIENTO',        label: 'Alojamiento' },
  { value: 'TRANSPORTE',         label: 'Transporte' },
  { value: 'CITAS_MEDICAS',      label: 'Citas Médicas y/o Ayudas Diagnósticas' },
  { value: 'MEDICAMENTOS_ASEO',  label: 'Medicamentos y/o Artículos de Aseo' },
  { value: 'OTRAS',              label: 'Otras (emprendimiento, alimentación, capacitaciones, copagos, empleo, servicios funerarios)' },
  { value: 'RECREACION',         label: 'Recreación, Ropa y Juguetes' },
];

@Component({
  selector: 'app-solicitud-ayuda',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './solicitud-ayuda.component.html',
})
export class SolicitudAyudaComponent {
  private fb   = inject(FormBuilder);
  private http = inject(HttpClient);

  step      = signal<Step>('form');
  loading   = signal(false);
  errorMsg  = signal('');
  stepError = signal('');

  readonly TIPOS_AYUDA = TIPOS_AYUDA;

  // Tipo de ayuda seleccionado
  tipoAyuda = signal<string>('');

  form = this.fb.group({
    // Datos del solicitante
    nombreSolicitante:        ['', [Validators.required]],
    docNumber:                ['', [Validators.required]],
    celular:                  ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
    correo:                   ['', [Validators.email]],
    tipoAyuda:                ['', [Validators.required]],

    // Campos comunes a varios tipos
    motivoSolicitud:          ['', [Validators.required]],
    solicitudEps:             ['NO'],
    respuestaEps:             [''],
    adjuntoSoporte:           [''],

    // Alojamiento
    numPersonasAlojamiento:   [null as number | null],
    docPersonasAlojamiento:   [''],
    nombresPersonasAlojamiento: [''],
    fechaIngresoAlojamiento:  [''],
    fechaSalidaAlojamiento:   [''],

    // Transporte
    numPersonasTransporte:    [null as number | null],
    docPersonasTransporte:    [''],
    nombresPersonasTransporte: [''],
    fechasNacimientoTransporte: [''],
    celularesTransporte:      [''],
    transportadores:          [''],
    fechaIdaTransporte:       [''],
    ciudadSalidaIda:          [''],
    ciudadLlegadaIda:         [''],
    fechaRegresoTransporte:   [''],
    ciudadSalidaRegreso:      [''],
    ciudadLlegadaRegreso:     [''],

    // Medicamentos
    etapaPanales:             [''],

    // Autorización datos
    aceptaTratamientoDatos:   [false, [Validators.requiredTrue]],
  });

  constructor() {
    this.form.get('tipoAyuda')?.valueChanges.subscribe(v => {
      this.tipoAyuda.set(v ?? '');
      // Reset motivo cuando cambia el tipo
      this.form.patchValue({ motivoSolicitud: '' });
    });
  }

  setSolicitudEps(val: 'SI' | 'NO') {
    this.form.patchValue({ solicitudEps: val });
    if (val === 'NO') {
      this.form.patchValue({ respuestaEps: '' });
    }
  }

  onFile(event: Event) {
    const input = event.target as HTMLInputElement;
    const file  = input.files?.[0];
    if (file) {
      this.form.patchValue({ adjuntoSoporte: file.name });
    }
  }

  private _adjuntoFile: File | null = null;
  onFileChange(event: Event, field: 'soporte') {
    const input = event.target as HTMLInputElement;
    this._adjuntoFile = input.files?.[0] ?? null;
    if (this._adjuntoFile) {
      this.form.patchValue({ adjuntoSoporte: this._adjuntoFile.name });
    }
  }

  private _fotoNino: File | null = null;
  private _cartaNino: File | null = null;
  fotoNinoName  = signal('');
  cartaNinoName = signal('');

  onFotoNino(event: Event) {
    const input = event.target as HTMLInputElement;
    this._fotoNino = input.files?.[0] ?? null;
    this.fotoNinoName.set(this._fotoNino?.name ?? '');
  }

  onCartaNino(event: Event) {
    const input = event.target as HTMLInputElement;
    this._cartaNino = input.files?.[0] ?? null;
    this.cartaNinoName.set(this._cartaNino?.name ?? '');
  }

  private _adjuntoOrden: File | null = null;
  adjuntoOrdenName = signal('');
  onAdjuntoOrden(event: Event) {
    const input = event.target as HTMLInputElement;
    this._adjuntoOrden = input.files?.[0] ?? null;
    this.adjuntoOrdenName.set(this._adjuntoOrden?.name ?? '');
  }

  submit() {
    this.stepError.set('');
    this.form.markAllAsTouched();

    if (this.form.invalid) {
      if (this.form.get('aceptaTratamientoDatos')?.invalid) {
        // Error inline ya se muestra
      }
      if (this.form.get('celular')?.invalid) {
        this.stepError.set('El celular debe tener exactamente 10 dígitos.');
        return;
      }
      this.stepError.set('Por favor complete todos los campos obligatorios.');
      return;
    }

    this.loading.set(true);
    const v = this.form.value;

    const fd = new FormData();
    fd.append('nombreSolicitante', v.nombreSolicitante ?? '');
    fd.append('docNumber',         v.docNumber         ?? '');
    fd.append('celular',           v.celular           ?? '');
    fd.append('correo',            v.correo            ?? '');
    fd.append('tipoAyuda',         v.tipoAyuda         ?? '');
    fd.append('motivoSolicitud',   v.motivoSolicitud   ?? '');
    fd.append('solicitudEps',      v.solicitudEps      ?? 'NO');
    fd.append('respuestaEps',      v.respuestaEps      ?? '');

    // Campos específicos por tipo
    if (v.tipoAyuda === 'ALOJAMIENTO') {
      fd.append('numPersonasAlojamiento',    String(v.numPersonasAlojamiento ?? ''));
      fd.append('docPersonasAlojamiento',    v.docPersonasAlojamiento ?? '');
      fd.append('nombresPersonasAlojamiento', v.nombresPersonasAlojamiento ?? '');
      fd.append('fechaIngresoAlojamiento',   v.fechaIngresoAlojamiento ?? '');
      fd.append('fechaSalidaAlojamiento',    v.fechaSalidaAlojamiento ?? '');
    }
    if (v.tipoAyuda === 'TRANSPORTE') {
      fd.append('numPersonasTransporte',    String(v.numPersonasTransporte ?? ''));
      fd.append('docPersonasTransporte',    v.docPersonasTransporte ?? '');
      fd.append('nombresPersonasTransporte', v.nombresPersonasTransporte ?? '');
      fd.append('fechasNacimientoTransporte', v.fechasNacimientoTransporte ?? '');
      fd.append('celularesTransporte',      v.celularesTransporte ?? '');
      fd.append('transportadores',          v.transportadores ?? '');
      fd.append('fechaIdaTransporte',       v.fechaIdaTransporte ?? '');
      fd.append('ciudadSalidaIda',          v.ciudadSalidaIda ?? '');
      fd.append('ciudadLlegadaIda',         v.ciudadLlegadaIda ?? '');
      fd.append('fechaRegresoTransporte',   v.fechaRegresoTransporte ?? '');
      fd.append('ciudadSalidaRegreso',      v.ciudadSalidaRegreso ?? '');
      fd.append('ciudadLlegadaRegreso',     v.ciudadLlegadaRegreso ?? '');
    }
    if (v.tipoAyuda === 'MEDICAMENTOS_ASEO') {
      fd.append('etapaPanales', v.etapaPanales ?? '');
    }

    fd.append('aceptaTratamientoDatos', String(v.aceptaTratamientoDatos ?? false));

    if (this._adjuntoOrden) fd.append('adjuntoOrden', this._adjuntoOrden);
    if (this._fotoNino)     fd.append('fotoNino',     this._fotoNino);
    if (this._cartaNino)    fd.append('cartaNino',    this._cartaNino);

    this.http.post(`${environment.apiUrl}/beneficiaries/solicitud-ayuda`, fd).subscribe({
      next:  () => { this.step.set('success'); this.loading.set(false); },
      error: (e) => {
        this.errorMsg.set(e.error?.message ?? 'Ocurrió un error. Intenta de nuevo.');
        this.step.set('error');
        this.loading.set(false);
      },
    });
  }

  retry() {
    this.step.set('form');
    this.errorMsg.set('');
  }
}
