import { Component, inject, signal } from '@angular/core';
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

  // Tipos de ayuda seleccionados (checkboxes múltiples)
  tiposSeleccionados = signal<string[]>([]);

  toggleTipo(v: string) {
    this.tiposSeleccionados.update(arr =>
      arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v]
    );
  }

  hasTipo(v: string): boolean {
    return this.tiposSeleccionados().includes(v);
  }

  form = this.fb.group({
    // Datos del solicitante
    nombreSolicitante:           ['', [Validators.required]],
    docNumber:                   ['', [Validators.required]],
    celular:                     ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
    correo:                      ['', [Validators.email]],

    // Alojamiento
    motivoAlojamiento:           [''],
    epsAlojamiento:              ['NO'],
    respEpsAlojamiento:          [''],
    numPersonasAlojamiento:      [null as number | null],
    docPersonasAlojamiento:      [''],
    nombresPersonasAlojamiento:  [''],
    fechaIngresoAlojamiento:     [''],
    fechaSalidaAlojamiento:      [''],

    // Transporte
    motivoTransporte:            [''],
    epsTransporte:               ['NO'],
    respEpsTransporte:           [''],
    numPersonasTransporte:       [null as number | null],
    docPersonasTransporte:       [''],
    nombresPersonasTransporte:   [''],
    fechasNacimientoTransporte:  [''],
    celularesTransporte:         [''],
    transportadores:             [''],
    fechaIdaTransporte:          [''],
    ciudadSalidaIda:             [''],
    ciudadLlegadaIda:            [''],
    fechaRegresoTransporte:      [''],
    ciudadSalidaRegreso:         [''],
    ciudadLlegadaRegreso:        [''],

    // Citas Médicas
    motivoCitasMedicas:          [''],
    epsCitasMedicas:             ['NO'],
    respEpsCitasMedicas:         [''],

    // Medicamentos
    motivoMedicamentos:          [''],
    epsMedicamentos:             ['NO'],
    respEpsMedicamentos:         [''],
    etapaPanales:                [''],

    // Otras
    motivoOtras:                 [''],

    // Recreación
    motivoRecreacion:            [''],

    // Autorización
    aceptaTratamientoDatos:      [false, [Validators.requiredTrue]],
  });

  setEps(tipo: string, val: 'SI' | 'NO') {
    const map: Record<string, string> = {
      ALOJAMIENTO:       'epsAlojamiento',
      TRANSPORTE:        'epsTransporte',
      CITAS_MEDICAS:     'epsCitasMedicas',
      MEDICAMENTOS_ASEO: 'epsMedicamentos',
    };
    const ctrl = map[tipo];
    if (ctrl) this.form.patchValue({ [ctrl]: val });
    if (val === 'NO') {
      const respMap: Record<string, string> = {
        ALOJAMIENTO:       'respEpsAlojamiento',
        TRANSPORTE:        'respEpsTransporte',
        CITAS_MEDICAS:     'respEpsCitasMedicas',
        MEDICAMENTOS_ASEO: 'respEpsMedicamentos',
      };
      const rCtrl = respMap[tipo];
      if (rCtrl) this.form.patchValue({ [rCtrl]: '' });
    }
  }

  getEps(tipo: string): string {
    const map: Record<string, string> = {
      ALOJAMIENTO:       'epsAlojamiento',
      TRANSPORTE:        'epsTransporte',
      CITAS_MEDICAS:     'epsCitasMedicas',
      MEDICAMENTOS_ASEO: 'epsMedicamentos',
    };
    return this.form.get(map[tipo] ?? '')?.value as string ?? 'NO';
  }

  private _adjuntoOrden: File | null = null;
  private _fotoNino:     File | null = null;
  private _cartaNino:    File | null = null;
  adjuntoOrdenName = signal('');
  fotoNinoName     = signal('');
  cartaNinoName    = signal('');

  onAdjuntoOrden(e: Event) {
    const f = (e.target as HTMLInputElement).files?.[0] ?? null;
    this._adjuntoOrden = f;
    this.adjuntoOrdenName.set(f?.name ?? '');
  }
  onFotoNino(e: Event) {
    const f = (e.target as HTMLInputElement).files?.[0] ?? null;
    this._fotoNino = f;
    this.fotoNinoName.set(f?.name ?? '');
  }
  onCartaNino(e: Event) {
    const f = (e.target as HTMLInputElement).files?.[0] ?? null;
    this._cartaNino = f;
    this.cartaNinoName.set(f?.name ?? '');
  }

  submit() {
    this.stepError.set('');
    this.form.markAllAsTouched();

    if (!this.tiposSeleccionados().length) {
      this.stepError.set('Debe seleccionar al menos un tipo de ayuda.');
      return;
    }
    if (this.form.get('celular')?.invalid) {
      this.stepError.set('El celular debe tener exactamente 10 dígitos.');
      return;
    }
    if (this.form.invalid) {
      this.stepError.set('Por favor complete todos los campos obligatorios.');
      return;
    }

    this.loading.set(true);
    const v = this.form.value;

    // Construir objeto de motivaciones por tipo
    const motivaciones: Record<string, string> = {};
    if (this.hasTipo('ALOJAMIENTO'))       motivaciones['ALOJAMIENTO']       = v.motivoAlojamiento ?? '';
    if (this.hasTipo('TRANSPORTE'))        motivaciones['TRANSPORTE']         = v.motivoTransporte ?? '';
    if (this.hasTipo('CITAS_MEDICAS'))     motivaciones['CITAS_MEDICAS']      = v.motivoCitasMedicas ?? '';
    if (this.hasTipo('MEDICAMENTOS_ASEO')) motivaciones['MEDICAMENTOS_ASEO']  = v.motivoMedicamentos ?? '';
    if (this.hasTipo('OTRAS'))             motivaciones['OTRAS']              = v.motivoOtras ?? '';
    if (this.hasTipo('RECREACION'))        motivaciones['RECREACION']         = v.motivoRecreacion ?? '';

    const fd = new FormData();
    fd.append('nombreSolicitante', v.nombreSolicitante ?? '');
    fd.append('docNumber',         v.docNumber ?? '');
    fd.append('celular',           v.celular ?? '');
    fd.append('correo',            v.correo ?? '');
    fd.append('tiposAyuda',        JSON.stringify(this.tiposSeleccionados()));
    fd.append('motivaciones',      JSON.stringify(motivaciones));

    // Alojamiento
    if (this.hasTipo('ALOJAMIENTO')) {
      fd.append('epsAlojamiento',             v.epsAlojamiento ?? 'NO');
      fd.append('respEpsAlojamiento',         v.respEpsAlojamiento ?? '');
      fd.append('numPersonasAlojamiento',     String(v.numPersonasAlojamiento ?? ''));
      fd.append('docPersonasAlojamiento',     v.docPersonasAlojamiento ?? '');
      fd.append('nombresPersonasAlojamiento', v.nombresPersonasAlojamiento ?? '');
      fd.append('fechaIngresoAlojamiento',    v.fechaIngresoAlojamiento ?? '');
      fd.append('fechaSalidaAlojamiento',     v.fechaSalidaAlojamiento ?? '');
    }
    // Transporte
    if (this.hasTipo('TRANSPORTE')) {
      fd.append('epsTransporte',             v.epsTransporte ?? 'NO');
      fd.append('respEpsTransporte',         v.respEpsTransporte ?? '');
      fd.append('numPersonasTransporte',     String(v.numPersonasTransporte ?? ''));
      fd.append('docPersonasTransporte',     v.docPersonasTransporte ?? '');
      fd.append('nombresPersonasTransporte', v.nombresPersonasTransporte ?? '');
      fd.append('fechasNacimientoTransporte',v.fechasNacimientoTransporte ?? '');
      fd.append('celularesTransporte',       v.celularesTransporte ?? '');
      fd.append('transportadores',           v.transportadores ?? '');
      fd.append('fechaIdaTransporte',        v.fechaIdaTransporte ?? '');
      fd.append('ciudadSalidaIda',           v.ciudadSalidaIda ?? '');
      fd.append('ciudadLlegadaIda',          v.ciudadLlegadaIda ?? '');
      fd.append('fechaRegresoTransporte',    v.fechaRegresoTransporte ?? '');
      fd.append('ciudadSalidaRegreso',       v.ciudadSalidaRegreso ?? '');
      fd.append('ciudadLlegadaRegreso',      v.ciudadLlegadaRegreso ?? '');
    }
    // Medicamentos
    if (this.hasTipo('MEDICAMENTOS_ASEO')) {
      fd.append('epsMedicamentos',    v.epsMedicamentos ?? 'NO');
      fd.append('respEpsMedicamentos',v.respEpsMedicamentos ?? '');
      fd.append('etapaPanales',       v.etapaPanales ?? '');
    }
    // Citas médicas
    if (this.hasTipo('CITAS_MEDICAS')) {
      fd.append('epsCitasMedicas',    v.epsCitasMedicas ?? 'NO');
      fd.append('respEpsCitasMedicas',v.respEpsCitasMedicas ?? '');
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
