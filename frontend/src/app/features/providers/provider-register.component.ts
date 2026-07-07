import { Component, inject, signal, effect } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

type Step = 'form' | 'success' | 'error';

const ACTIVIDADES = [
  { value: 'COMERCIAL',     label: 'Comercial' },
  { value: 'INDUSTRIAL',    label: 'Industrial' },
  { value: 'SOCIO',         label: 'Socio' },
  { value: 'MINERIA',       label: 'Minería' },
  { value: 'PENSIONADO',    label: 'Pensionado/Rentista' },
  { value: 'TRANSPORTE',    label: 'Transporte' },
  { value: 'EMPLEADO',      label: 'Empleado' },
  { value: 'CONSTRUCCION',  label: 'Construcción' },
  { value: 'FINANCIERO',    label: 'Financiero' },
  { value: 'OTRO',          label: 'Otro' },
];

const FORMAS_PAGO = [
  { value: 'EFECTIVO',      label: 'Efectivo' },
  { value: 'TRANSFERENCIA', label: 'Transferencia' },
  { value: 'CHEQUE',        label: 'Cheque' },
  { value: 'CONSIGNACION',  label: 'Consignación' },
];

@Component({
  selector: 'app-provider-register',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './provider-register.component.html',
})
export class ProviderRegisterComponent {
  private fb   = inject(FormBuilder);
  private http = inject(HttpClient);

  step     = signal<Step>('form');
  loading  = signal(false);
  errorMsg = signal('');

  naturaleza = signal<'NATURAL' | 'JURIDICA'>('NATURAL');

  // Wizard state
  currentStep  = signal<number>(1);
  readonly totalSteps = 5;
  stepErrors   = signal<string>('');

  // Checkbox state for multi-select fields
  actividadTipoSelected = signal<string[]>([]);
  formaPagoSelected     = signal<string[]>([]);

  readonly ACTIVIDADES = ACTIVIDADES;
  readonly FORMAS_PAGO = FORMAS_PAGO;

  // Archivos seleccionados
  files: Record<string, File | null> = {
    rut:            null,
    camaraComercio: null,
    certBancaria:   null,
  };

  fileNames: Record<string, string> = {
    rut:            '',
    camaraComercio: '',
    certBancaria:   '',
  };

  form = this.fb.group({
    // Sección 1
    tipoSolicitud:              ['REGISTRO_INICIAL'],
    tipoSolicitudOtro:          [''],
    // Sección 2
    naturaleza:                 ['NATURAL'],
    formaPagoTipo:              ['CONTADO'],
    diasCredito:                [''],
    // Sección 3 - Persona Natural
    docTypeNatural:             ['CC'],
    lugarExpedicion:            [''],
    fechaExpedicion:            [''],
    docNumberNatural:           ['', [Validators.minLength(5)]],
    nationality:                ['Colombiana'],
    departamentoResidencia:     [''],
    ciudadResidencia:           [''],
    primerApellido:             [''],
    segundoApellido:            [''],
    primerNombre:               [''],
    segundoNombre:              [''],
    phone:                      ['', [Validators.pattern(/^\d{7,15}$/)]],
    telefonoDomicilio:          [''],
    address:                    [''],
    email:                      ['', [Validators.email]],
    // Sección 4 - Persona Jurídica
    name:                       [''],
    nit:                        [''],
    digitoVerificacion:         [''],
    correoEmpresa:              ['', [Validators.email]],
    department:                 [''],
    city:                       [''],
    telefonoEmpresa:            [''],
    direccionOficina:           [''],
    // Rep Legal
    repDocType:                 ['CC'],
    repDocTypeOtro:             [''],
    repDocNumber:               [''],
    repLugarExpedicion:         [''],
    repFechaExpedicion:         [''],
    repPrimerApellido:          [''],
    repSegundoApellido:         [''],
    repPrimerNombre:            [''],
    repSegundoNombre:           [''],
    repDepartamento:            [''],
    repCiudad:                  [''],
    repDireccion:               [''],
    repNacionalidad:            ['Colombiana'],
    repCelular:                 [''],
    repOtroTel:                 [''],
    repEmail:                   ['', [Validators.email]],
    // Sección 5
    actividadOtro:              [''],
    codigoCIIU:                 [''],
    descripcionActividad:       [''],
    // Sección 6
    tipoCuenta:                 ['AHORROS'],
    numeroCuenta:               [''],
    diasPago:                   [''],
    // Sección 7
    factNombre:                 [''],
    factCargo:                  [''],
    factTelefono:               [''],
    factExt:                    [''],
    factCelular:                [''],
    factEmail:                  ['', [Validators.email]],
    // Sección 8 - Referencias
    ref1Nombre:                 [''],
    ref1Identificacion:         [''],
    ref1Telefono:               [''],
    ref1Email:                  ['', [Validators.email]],
    ref2Nombre:                 [''],
    ref2Identificacion:         [''],
    ref2Telefono:               [''],
    ref2Email:                  ['', [Validators.email]],
    // Sección 9 - Accionistas (textarea)
    accionistasTexto:           [''],
    // Sección 10 - Financiero
    totalActivos:               [''],
    totalPasivos:               [''],
    totalPatrimonio:            [''],
    ingresosMensuales:          [''],
    egresosMensuales:           [''],
    otrosIngresosMensuales:     [''],
    conceptoOtrosIngresos:      [''],
    // Sección 11 - Operaciones internacionales
    opImportaciones:            [false],
    opExportaciones:            [false],
    opInversiones:              [false],
    opTransferencias:           [false],
    opPagoServicios:            [false],
    opPrestamosMonedaExt:       [false],
    // Sección 12 - PPE
    manejaRecursosPublicos:     ['false'],
    tieneReconocimientoPublico: ['false'],
    ejercePoder:                ['false'],
    esFamiliarPPE:              ['false'],
    familiarPPEInfo:            [''],
    // Sección 13 - Declaraciones
    aceptaDeclaracion:          [false, [Validators.requiredTrue]],
    aceptaTratamientoDatos:     [false, [Validators.requiredTrue]],
  });

  constructor() {
    // Sync naturaleza signal with form control
    effect(() => {
      const current = this.form.get('naturaleza')?.value as 'NATURAL' | 'JURIDICA';
      if (current && current !== this.naturaleza()) {
        // handled by valueChanges subscription below
      }
    });

    this.form.get('naturaleza')?.valueChanges.subscribe(v => {
      this.naturaleza.set((v as 'NATURAL' | 'JURIDICA') ?? 'NATURAL');
    });
  }

  isInvalid(field: string): boolean {
    const c = this.form.get(field);
    return !!(c?.invalid && c?.touched);
  }

  onFile(event: Event, field: string) {
    const input = event.target as HTMLInputElement;
    const file  = input.files?.[0] ?? null;
    this.files[field]     = file;
    this.fileNames[field] = file?.name ?? '';
  }

  toggleActividad(val: string) {
    const cur = this.actividadTipoSelected();
    this.actividadTipoSelected.set(
      cur.includes(val) ? cur.filter(v => v !== val) : [...cur, val]
    );
  }

  isActividadSelected(val: string): boolean {
    return this.actividadTipoSelected().includes(val);
  }

  toggleFormaPago(val: string) {
    const cur = this.formaPagoSelected();
    this.formaPagoSelected.set(
      cur.includes(val) ? cur.filter(v => v !== val) : [...cur, val]
    );
  }

  isFormaPagoSelected(val: string): boolean {
    return this.formaPagoSelected().includes(val);
  }

  nextStep() {
    const err = this.validateStep(this.currentStep());
    if (err) { this.stepErrors.set(err); return; }
    this.stepErrors.set('');
    this.currentStep.update(s => Math.min(s + 1, this.totalSteps));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  prevStep() {
    this.stepErrors.set('');
    this.currentStep.update(s => Math.max(s - 1, 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  private validateStep(step: number): string {
    const v   = this.form.value;
    const nat = this.naturaleza();

    if (step === 2) {
      if (nat === 'NATURAL') {
        const required = [
          { field: 'primerNombre',     label: 'Primer nombre' },
          { field: 'primerApellido',   label: 'Primer apellido' },
          { field: 'docNumberNatural', label: 'Número de documento' },
          { field: 'phone',            label: 'Celular/teléfono' },
          { field: 'email',            label: 'Correo electrónico' },
        ];
        for (const r of required) {
          this.form.get(r.field)?.markAsTouched();
          if (!(this.form.get(r.field)?.value as string)?.trim()) return `${r.label} es requerido.`;
          if (this.form.get(r.field)?.invalid) return `${r.label} no es válido.`;
        }
      } else {
        const required = [
          { field: 'name',          label: 'Razón social' },
          { field: 'nit',           label: 'NIT' },
          { field: 'correoEmpresa', label: 'Correo electrónico' },
        ];
        for (const r of required) {
          this.form.get(r.field)?.markAsTouched();
          if (!(this.form.get(r.field)?.value as string)?.trim()) return `${r.label} es requerido.`;
          if (this.form.get(r.field)?.invalid) return `${r.label} no es válido.`;
        }
      }
    }

    if (step === 3) {
      this.form.get('descripcionActividad')?.markAsTouched();
      if (!v.descripcionActividad?.trim()) return 'La descripción de la actividad económica es requerida.';
    }

    if (step === 5) {
      if (!v.aceptaDeclaracion) return 'Debes aceptar la declaración de origen de fondos.';
      if (!v.aceptaTratamientoDatos) return 'Debes aceptar el tratamiento de datos personales.';
    }

    return '';
  }

  private parseAccionistas(text: string): unknown[] {
    if (!text.trim()) return [];
    // Each line: "nit|razonSocial|porcentaje" or JSON
    try { return JSON.parse(text); } catch { /* not JSON */ }
    return text.split('\n').filter(l => l.trim()).map(line => {
      const parts = line.split('|').map(p => p.trim());
      return { nit: parts[0] ?? '', razonSocial: parts[1] ?? '', porcentaje: parts[2] ?? '' };
    });
  }

  submit() {
    const stepErr = this.validateStep(5);
    if (stepErr) {
      this.stepErrors.set(stepErr);
      return;
    }

    this.form.markAllAsTouched();

    const nat = this.naturaleza();
    const v   = this.form.value;

    // Dynamic required validation
    let hasError = false;
    if (nat === 'NATURAL') {
      if (!v.primerApellido?.trim()) hasError = true;
      if (!v.primerNombre?.trim())   hasError = true;
      if (!v.docNumberNatural?.trim()) hasError = true;
      if (!v.phone?.trim()) hasError = true;
      if (!v.email?.trim()) hasError = true;
    } else {
      if (!v.name?.trim()) hasError = true;
      if (!v.nit?.trim())  hasError = true;
    }

    if (!v.aceptaDeclaracion || !v.aceptaTratamientoDatos) hasError = true;

    if (hasError || this.form.get('aceptaDeclaracion')?.invalid || this.form.get('aceptaTratamientoDatos')?.invalid) {
      return;
    }

    this.loading.set(true);
    this.errorMsg.set('');

    const fd = new FormData();

    // Determine main identifiers based on naturaleza
    const docNumber = nat === 'NATURAL' ? (v.docNumberNatural ?? '') : (v.nit ?? '');
    const docType   = nat === 'NATURAL' ? (v.docTypeNatural ?? 'CC') : 'NIT';
    const name      = nat === 'NATURAL'
      ? `${v.primerNombre ?? ''} ${v.segundoNombre ?? ''} ${v.primerApellido ?? ''} ${v.segundoApellido ?? ''}`.replace(/\s+/g, ' ').trim()
      : (v.name ?? '');
    const emailVal  = nat === 'NATURAL' ? (v.email ?? '') : (v.correoEmpresa ?? '');
    const phoneVal  = nat === 'NATURAL' ? (v.phone ?? '') : (v.telefonoEmpresa ?? '');
    const addrVal   = nat === 'NATURAL' ? (v.address ?? '') : (v.direccionOficina ?? '');
    const cityVal   = nat === 'NATURAL' ? (v.ciudadResidencia ?? '') : (v.city ?? '');
    const deptVal   = nat === 'NATURAL' ? (v.departamentoResidencia ?? '') : (v.department ?? '');

    fd.append('name',      name);
    fd.append('docType',   docType);
    fd.append('docNumber', docNumber);
    fd.append('phone',     phoneVal);
    fd.append('email',     emailVal);
    fd.append('address',   addrVal);
    fd.append('city',      cityVal);
    fd.append('department', deptVal);

    // Sección 1
    fd.append('tipoSolicitud',     v.tipoSolicitud     ?? '');
    fd.append('tipoSolicitudOtro', v.tipoSolicitudOtro ?? '');
    // Sección 2
    fd.append('naturaleza',    v.naturaleza    ?? '');
    fd.append('formaPagoTipo', v.formaPagoTipo ?? '');
    fd.append('diasCredito',   v.diasCredito   ?? '');
    // Sección 3
    fd.append('lugarExpedicion',         v.lugarExpedicion         ?? '');
    fd.append('fechaExpedicion',         v.fechaExpedicion         ?? '');
    fd.append('nationality',             v.nationality             ?? '');
    fd.append('departamentoResidencia',  v.departamentoResidencia  ?? '');
    fd.append('ciudadResidencia',        v.ciudadResidencia        ?? '');
    fd.append('primerApellido',          v.primerApellido          ?? '');
    fd.append('segundoApellido',         v.segundoApellido         ?? '');
    fd.append('primerNombre',            v.primerNombre            ?? '');
    fd.append('segundoNombre',           v.segundoNombre           ?? '');
    fd.append('telefonoDomicilio',       v.telefonoDomicilio       ?? '');
    // Sección 4
    fd.append('nit',               v.nit               ?? '');
    fd.append('digitoVerificacion', v.digitoVerificacion ?? '');
    fd.append('correoEmpresa',     v.correoEmpresa     ?? '');
    fd.append('telefonoEmpresa',   v.telefonoEmpresa   ?? '');
    fd.append('direccionOficina',  v.direccionOficina  ?? '');
    // Rep Legal as JSON
    const repLegal = {
      docType:        v.repDocType         ?? '',
      docTypeOtro:    v.repDocTypeOtro     ?? '',
      docNumber:      v.repDocNumber       ?? '',
      lugarExpedicion: v.repLugarExpedicion ?? '',
      fechaExpedicion: v.repFechaExpedicion ?? '',
      primerApellido: v.repPrimerApellido  ?? '',
      segundoApellido: v.repSegundoApellido ?? '',
      primerNombre:   v.repPrimerNombre    ?? '',
      segundoNombre:  v.repSegundoNombre   ?? '',
      departamento:   v.repDepartamento    ?? '',
      ciudad:         v.repCiudad          ?? '',
      direccion:      v.repDireccion       ?? '',
      nacionalidad:   v.repNacionalidad    ?? '',
      celular:        v.repCelular         ?? '',
      otroTel:        v.repOtroTel         ?? '',
      email:          v.repEmail           ?? '',
    };
    fd.append('repLegal', JSON.stringify(repLegal));
    // Sección 5
    fd.append('actividadTipo',       JSON.stringify(this.actividadTipoSelected()));
    fd.append('actividadOtro',       v.actividadOtro       ?? '');
    fd.append('codigoCIIU',          v.codigoCIIU          ?? '');
    fd.append('descripcionActividad', v.descripcionActividad ?? '');
    // Sección 6
    fd.append('formaPago',   JSON.stringify(this.formaPagoSelected()));
    fd.append('tipoCuenta',  v.tipoCuenta  ?? '');
    fd.append('numeroCuenta', v.numeroCuenta ?? '');
    fd.append('diasPago',    v.diasPago    ?? '');
    // Sección 7
    fd.append('factNombre',   v.factNombre   ?? '');
    fd.append('factCargo',    v.factCargo    ?? '');
    fd.append('factTelefono', v.factTelefono ?? '');
    fd.append('factExt',      v.factExt      ?? '');
    fd.append('factCelular',  v.factCelular  ?? '');
    fd.append('factEmail',    v.factEmail    ?? '');
    // Sección 8 - Referencias
    const referencias = [
      { nombre: v.ref1Nombre ?? '', identificacion: v.ref1Identificacion ?? '', telefono: v.ref1Telefono ?? '', email: v.ref1Email ?? '' },
      { nombre: v.ref2Nombre ?? '', identificacion: v.ref2Identificacion ?? '', telefono: v.ref2Telefono ?? '', email: v.ref2Email ?? '' },
    ];
    fd.append('referencias', JSON.stringify(referencias));
    // Sección 9
    fd.append('accionistas', JSON.stringify(this.parseAccionistas(v.accionistasTexto ?? '')));
    // Sección 10
    fd.append('totalActivos',           v.totalActivos           ?? '');
    fd.append('totalPasivos',           v.totalPasivos           ?? '');
    fd.append('totalPatrimonio',        v.totalPatrimonio        ?? '');
    fd.append('ingresosMensuales',      v.ingresosMensuales      ?? '');
    fd.append('egresosMensuales',       v.egresosMensuales       ?? '');
    fd.append('otrosIngresosMensuales', v.otrosIngresosMensuales ?? '');
    fd.append('conceptoOtrosIngresos',  v.conceptoOtrosIngresos  ?? '');
    // Sección 11 - Operaciones internacionales
    const operaciones = {
      importaciones:     v.opImportaciones     ?? false,
      exportaciones:     v.opExportaciones     ?? false,
      inversiones:       v.opInversiones       ?? false,
      transferencias:    v.opTransferencias    ?? false,
      pagoServicios:     v.opPagoServicios     ?? false,
      prestamosMonedaExt: v.opPrestamosMonedaExt ?? false,
    };
    fd.append('operaciones', JSON.stringify(operaciones));
    // Sección 12 - PPE
    fd.append('manejaRecursosPublicos',     v.manejaRecursosPublicos     ?? 'false');
    fd.append('tieneReconocimientoPublico', v.tieneReconocimientoPublico ?? 'false');
    fd.append('ejercePoder',               v.ejercePoder                ?? 'false');
    fd.append('esFamiliarPPE',             v.esFamiliarPPE              ?? 'false');
    fd.append('familiarPPEInfo',           v.familiarPPEInfo            ?? '');
    // Sección 13
    fd.append('aceptaDeclaracion',     String(v.aceptaDeclaracion     ?? false));
    fd.append('aceptaTratamientoDatos', String(v.aceptaTratamientoDatos ?? false));

    // Files
    if (this.files['rut'])            fd.append('rut',            this.files['rut']!);
    if (this.files['camaraComercio']) fd.append('camaraComercio', this.files['camaraComercio']!);
    if (this.files['certBancaria'])   fd.append('certBancaria',   this.files['certBancaria']!);

    this.http.post(`${environment.apiUrl}/providers/register`, fd).subscribe({
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
