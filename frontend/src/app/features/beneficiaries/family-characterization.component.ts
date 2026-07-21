import { Component, inject, signal, computed, effect } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

type Step = 'form' | 'success' | 'error';

const COLOMBIA_DEPTOS: { value: string; label: string; ciudades: string[] }[] = [
  { value: 'AMAZONAS', label: 'Amazonas', ciudades: ['Leticia', 'Puerto Nariño'] },
  { value: 'ANTIOQUIA', label: 'Antioquia', ciudades: ['Medellín', 'Bello', 'Itagüí', 'Envigado', 'Sabaneta', 'Rionegro', 'Apartadó', 'Turbo', 'Caucasia', 'La Ceja', 'Caldas', 'Copacabana', 'Girardota', 'Barbosa'] },
  { value: 'ARAUCA', label: 'Arauca', ciudades: ['Arauca', 'Saravena', 'Tame', 'Arauquita'] },
  { value: 'ATLANTICO', label: 'Atlántico', ciudades: ['Barranquilla', 'Soledad', 'Malambo', 'Sabanalarga', 'Baranoa'] },
  { value: 'BOGOTA', label: 'Bogotá D.C.', ciudades: ['Bogotá'] },
  { value: 'BOLIVAR', label: 'Bolívar', ciudades: ['Cartagena', 'Magangué', 'Mompox', 'El Carmen de Bolívar'] },
  { value: 'BOYACA', label: 'Boyacá', ciudades: ['Tunja', 'Duitama', 'Sogamoso', 'Chiquinquirá', 'Paipa'] },
  { value: 'CALDAS', label: 'Caldas', ciudades: ['Manizales', 'Villamaría', 'La Dorada', 'Chinchiná', 'Riosucio'] },
  { value: 'CAQUETA', label: 'Caquetá', ciudades: ['Florencia', 'San Vicente del Caguán', 'Puerto Rico', 'El Paujil'] },
  { value: 'CASANARE', label: 'Casanare', ciudades: ['Yopal', 'Aguazul', 'Villanueva', 'Tauramena', 'Monterrey'] },
  { value: 'CAUCA', label: 'Cauca', ciudades: ['Popayán', 'Santander de Quilichao', 'Puerto Tejada', 'Corinto', 'Miranda'] },
  { value: 'CESAR', label: 'Cesar', ciudades: ['Valledupar', 'Aguachica', 'Agustín Codazzi', 'La Paz'] },
  { value: 'CHOCO', label: 'Chocó', ciudades: ['Quibdó', 'Istmina', 'Condoto', 'Riosucio'] },
  { value: 'CORDOBA', label: 'Córdoba', ciudades: ['Montería', 'Lorica', 'Sahagún', 'Cereté', 'Planeta Rica'] },
  { value: 'CUNDINAMARCA', label: 'Cundinamarca', ciudades: ['Soacha', 'Facatativá', 'Zipaquirá', 'Chía', 'Fusagasugá', 'Girardot', 'Madrid', 'Mosquera', 'Cajicá', 'Tocancipá'] },
  { value: 'GUAINIA', label: 'Guainía', ciudades: ['Inírida'] },
  { value: 'GUAVIARE', label: 'Guaviare', ciudades: ['San José del Guaviare', 'El Retorno', 'Calamar'] },
  { value: 'HUILA', label: 'Huila', ciudades: ['Neiva', 'Pitalito', 'Garzón', 'La Plata', 'Campoalegre'] },
  { value: 'LA_GUAJIRA', label: 'La Guajira', ciudades: ['Riohacha', 'Maicao', 'Uribia', 'Manaure'] },
  { value: 'MAGDALENA', label: 'Magdalena', ciudades: ['Santa Marta', 'Ciénaga', 'Fundación', 'Plato', 'El Banco'] },
  { value: 'META', label: 'Meta', ciudades: ['Villavicencio', 'Acacías', 'Granada', 'La Macarena', 'Puerto López'] },
  { value: 'NARINO', label: 'Nariño', ciudades: ['Pasto', 'Tumaco', 'Ipiales', 'La Unión', 'Samaniego'] },
  { value: 'NORTE_SANTANDER', label: 'Norte de Santander', ciudades: ['Cúcuta', 'Ocaña', 'Pamplona', 'Tibú', 'Villa del Rosario'] },
  { value: 'PUTUMAYO', label: 'Putumayo', ciudades: ['Mocoa', 'Puerto Asís', 'Orito', 'Valle del Guamuez'] },
  { value: 'QUINDIO', label: 'Quindío', ciudades: ['Armenia', 'Calarcá', 'Montenegro', 'Quimbaya', 'La Tebaida'] },
  { value: 'RISARALDA', label: 'Risaralda', ciudades: ['Pereira', 'Dosquebradas', 'Santa Rosa de Cabal', 'La Virginia'] },
  { value: 'SAN_ANDRES', label: 'San Andrés y Providencia', ciudades: ['San Andrés', 'Providencia'] },
  { value: 'SANTANDER', label: 'Santander', ciudades: ['Bucaramanga', 'Floridablanca', 'Girón', 'Piedecuesta', 'Barrancabermeja', 'Socorro'] },
  { value: 'SUCRE', label: 'Sucre', ciudades: ['Sincelejo', 'Corozal', 'Sampués', 'Toluviejo'] },
  { value: 'TOLIMA', label: 'Tolima', ciudades: ['Ibagué', 'Espinal', 'Melgar', 'Honda', 'Chaparral'] },
  { value: 'VALLE_CAUCA', label: 'Valle del Cauca', ciudades: ['Cali', 'Buenaventura', 'Palmira', 'Tuluá', 'Buga', 'Cartago', 'Yumbo', 'Jamundí', 'Florida', 'Candelaria'] },
  { value: 'VAUPES', label: 'Vaupés', ciudades: ['Mitú'] },
  { value: 'VICHADA', label: 'Vichada', ciudades: ['Puerto Carreño', 'La Primavera'] },
];

const DOC_TYPES = [
  { value: 'Registro Civil', label: 'Registro Civil' },
  { value: 'Tarjeta de Identidad', label: 'Tarjeta de Identidad' },
  { value: 'Cédula de Ciudadanía', label: 'Cédula de Ciudadanía' },
  { value: 'Permiso Especial Permanencia', label: 'Permiso Especial Permanencia' },
  { value: 'Menor sin Identificación', label: 'Menor sin Identificación' },
  { value: 'NO ADRES', label: 'NO ADRES' },
  { value: 'Sin Identificación', label: 'Sin Identificación' },
];

const GENDERS = [
  { value: 'Masculino', label: 'Masculino' },
  { value: 'Femenino', label: 'Femenino' },
  { value: 'Otro', label: 'Otro' },
];

const REGIMENES = [
  { value: 'Subsidiado', label: 'Subsidiado' },
  { value: 'Contributivo', label: 'Contributivo (EPS)' },
  { value: 'Prepagada', label: 'Medicina Prepagada' },
];

const SISBEN_GROUPS = [
  { value: 'Grupo A', label: 'Grupo A (Pobreza extrema: A1 a A5)' },
  { value: 'Grupo B', label: 'Grupo B (Pobreza moderada: B1 a B7)' },
  { value: 'Grupo C', label: 'Grupo C (Vulnerable: C1 a C18)' },
  { value: 'Grupo D', label: 'Grupo D (No pobre y no vulnerable: D1 a D21)' },
  { value: 'No lo conoce', label: 'No lo conoce' },
];

const ESCOLARIDAD = [
  { value: 'Sin escolaridad', label: 'Sin escolaridad' },
  { value: 'Primaria', label: 'Primaria' },
  { value: 'Bachiller', label: 'Bachiller' },
  { value: 'Técnico', label: 'Técnico' },
  { value: 'Profesional', label: 'Profesional' },
];

const ZONAS = [
  { value: 'Urbano', label: 'Urbana (ciudad, municipio, pueblos principales)' },
  { value: 'Rural', label: 'Rural (vereda, campo)' },
];

const TIPOS_VIVIENDA = [
  { value: 'Arrendada', label: 'Arrendada' },
  { value: 'Propia', label: 'Propia' },
  { value: 'Familiar', label: 'Familiar' },
];

const SERVICIOS_PUBLICOS = [
  { value: 'Energía eléctrica', label: 'Energía eléctrica' },
  { value: 'Energía Prepagada', label: 'Energía Prepagada' },
  { value: 'Agua potable', label: 'Agua potable' },
  { value: 'Gas natural', label: 'Gas natural' },
  { value: 'Gas Cilindro', label: 'Gas Cilindro' },
  { value: 'Internet', label: 'Internet' },
  { value: 'Televisión (Cable o satelital)', label: 'Televisión (Cable o satelital)' },
  { value: 'Alcantarillado', label: 'Alcantarillado' },
];

@Component({
  selector: 'app-family-characterization',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './family-characterization.component.html',
})
export class FamilyCharacterizationComponent {
  private fb   = inject(FormBuilder);
  private http = inject(HttpClient);

  step     = signal<Step>('form');
  loading  = signal(false);
  errorMsg = signal('');

  // Wizard state
  currentStep  = signal<number>(1);
  readonly totalSteps = 5;
  stepErrors   = signal<string>('');

  // Checkbox state for public services
  serviciosSelected = signal<string[]>([]);

  // Local state for siblings
  siblingsList = signal<Array<{ age: number; livesWith: boolean }>>([]);

  readonly DOC_TYPES        = DOC_TYPES;
  readonly GENDERS           = GENDERS;
  readonly REGIMENES         = REGIMENES;
  readonly SISBEN_GROUPS     = SISBEN_GROUPS;
  readonly ESCOLARIDAD       = ESCOLARIDAD;
  readonly ZONAS             = ZONAS;
  readonly TIPOS_VIVIENDA    = TIPOS_VIVIENDA;
  readonly SERVICIOS_PUBLICOS = SERVICIOS_PUBLICOS;
  readonly COLOMBIA_DEPTOS   = COLOMBIA_DEPTOS;

  // Cascading departamento → ciudades
  deptoResidencia  = signal('');
  ciudadesResidencia = computed(() =>
    COLOMBIA_DEPTOS.find(d => d.value === this.deptoResidencia())?.ciudades ?? []
  );

  // Lookup de beneficiario existente
  lookupLoading       = signal(false);
  existingBeneficiary = signal<any>(null);
  isUpdateMode        = signal(false);

  // EPS check conditional signals
  hasEpsOption = signal<'SI' | 'NO'>('SI');
  hasSiblingsOption = signal<'SI' | 'NO'>('NO');
  receivesGovSubsidyOption = signal<'SI' | 'NO'>('NO');

  form = this.fb.group({
    // PASO 1: Información básica del niño
    firstName:                  ['', [Validators.required, Validators.minLength(2)]],
    lastName:                   ['', [Validators.required, Validators.minLength(2)]],
    docType:                    ['Registro Civil', [Validators.required]],
    docNumber:                  ['', [Validators.required, Validators.minLength(5)]],
    birthDate:                  ['', [Validators.required]],
    nationality:                ['Colombiana', [Validators.required]],
    gender:                     ['Femenino', [Validators.required]],
    address:                    ['', [Validators.required]],
    neighborhood:               ['', [Validators.required]],
    city:                       ['', [Validators.required]],
    department:                 ['', [Validators.required]],
    isDisplaced:                ['NO', [Validators.required]],

    // PASO 2: Salud
    eps:                        [''],
    regimen:                    [''],
    epsNoReason:                [''], // Justificación si no tiene EPS (¿Por qué?)
    sisbenGroup:                ['No lo conoce'],
    diagnostico:                ['', [Validators.required]], // Cardiopatía del niño
    otherDiagnosis:             [''], // Otro diagnóstico o limitación
    hasOtherDiagnosis:          ['NO'],
    tratadoEn:                  ['', [Validators.required]],
    clinicaHospital:            [''],

    // PASO 3: Información familiar
    motherName:                 ['', [Validators.required]],
    motherDocNumber:            [''],
    motherPhone:                ['', [Validators.required]],
    motherEducation:            ['Bachiller'],
    motherProfession:           [''],
    motherOccupation:           ['', [Validators.required]], // En qué se desempeña
    motherLivesWithChild:       ['SI', [Validators.required]],
    motherRespondsEcon:         ['SI', [Validators.required]],

    fatherName:                 ['', [Validators.required]],
    fatherDocNumber:            [''],
    fatherPhone:                [''],
    fatherEducation:            ['Bachiller'],
    fatherProfession:           [''],
    fatherOccupation:           ['', [Validators.required]], // En qué se desempeña
    fatherLivesWithChild:       ['SI', [Validators.required]],
    fatherRespondsEcon:         ['SI', [Validators.required]],

    // PASO 4: Hermanos, Cuidador y Vivienda
    numSiblings:                [0],
    caregiverName:              ['', [Validators.required]],
    caregiverRelationship:      ['', [Validators.required]],
    caregiverPhone:             ['', [Validators.required]],
    zone:                       ['Urbano', [Validators.required]],
    housingType:                ['Familiar', [Validators.required]],
    housingStrata:              [1, [Validators.required, Validators.min(1), Validators.max(6)]],
    publicTransportNearby:      ['SI', [Validators.required]],
    numPeopleInHome:            [2, [Validators.required, Validators.min(1)]],

    // PASO 5: Economía y finalización
    incomeSource:               ['', [Validators.required]],
    govSubsidyType:             [''],
    comoSeEntero:               ['', [Validators.required]],
    aceptaTratamientoDatos:     [false, [Validators.requiredTrue]],
  });

  constructor() {
    // Cascading departamento → ciudades
    this.form.get('department')?.valueChanges.subscribe(v => {
      this.deptoResidencia.set(v ?? '');
      this.form.get('city')?.setValue('');
    });

    // Escucha de condicionales
    effect(() => {
      // Si cambia la opción de EPS, podemos resetear campos
      const hasEps = this.hasEpsOption();
      if (hasEps === 'NO') {
        this.form.patchValue({ eps: '', regimen: '' });
      } else {
        this.form.patchValue({ epsNoReason: '' });
      }
    });

    effect(() => {
      const hasSib = this.hasSiblingsOption();
      if (hasSib === 'NO') {
        this.siblingsList.set([]);
        this.form.patchValue({ numSiblings: 0 });
      }
    });

    effect(() => {
      const receivesSub = this.receivesGovSubsidyOption();
      if (receivesSub === 'NO') {
        this.form.patchValue({ govSubsidyType: '' });
      }
    });
  }

  setEpsOption(val: 'SI' | 'NO') {
    this.hasEpsOption.set(val);
  }

  setSiblingsOption(val: 'SI' | 'NO') {
    this.hasSiblingsOption.set(val);
  }

  setGovSubsidyOption(val: 'SI' | 'NO') {
    this.receivesGovSubsidyOption.set(val);
  }

  // Métodos para agregar/quitar hermanos dinámicamente
  addSibling() {
    this.siblingsList.update(list => [...list, { age: 1, livesWith: true }]);
    this.form.patchValue({ numSiblings: this.siblingsList().length });
  }

  removeSibling(index: number) {
    this.siblingsList.update(list => list.filter((_, i) => i !== index));
    this.form.patchValue({ numSiblings: this.siblingsList().length });
  }

  updateSiblingAge(index: number, event: Event) {
    const age = Number((event.target as HTMLInputElement).value);
    this.siblingsList.update(list => {
      const copy = [...list];
      copy[index] = { ...copy[index], age };
      return copy;
    });
  }

  updateSiblingLivesWith(index: number, event: Event) {
    const livesWith = (event.target as HTMLSelectElement).value === 'SI';
    this.siblingsList.update(list => {
      const copy = [...list];
      copy[index] = { ...copy[index], livesWith };
      return copy;
    });
  }

  // Manejo de servicios públicos (checkboxes)
  toggleServicio(val: string, event: Event) {
    const checked = (event.target as HTMLInputElement).checked;
    this.serviciosSelected.update(list => {
      if (checked) {
        return [...list, val];
      } else {
        return list.filter(item => item !== val);
      }
    });
  }

  isServicioChecked(val: string): boolean {
    return this.serviciosSelected().includes(val);
  }

  calcularEdad(): string {
    const val = this.form.get('birthDate')?.value;
    if (!val) return '';
    const hoy = new Date();
    const nac = new Date(val);
    if (isNaN(nac.getTime())) return '';
    let años = hoy.getFullYear() - nac.getFullYear();
    const meses = hoy.getMonth() - nac.getMonth();
    if (meses < 0 || (meses === 0 && hoy.getDate() < nac.getDate())) años--;
    if (años < 0) return '';
    if (años < 1) {
      const diffMs = hoy.getTime() - nac.getTime();
      const mesesTotal = Math.floor(diffMs / (1000 * 60 * 60 * 24 * 30.44));
      return `${mesesTotal} ${mesesTotal === 1 ? 'mes' : 'meses'}`;
    }
    return `${años} ${años === 1 ? 'año' : 'años'}`;
  }

  onDocNumberBlur() {
    const docNumber = this.form.get('docNumber')?.value?.trim();
    if (!docNumber || docNumber.length < 4) return;

    this.lookupLoading.set(true);
    this.http.get<any>(`${environment.apiUrl}/beneficiaries/public-lookup?docNumber=${encodeURIComponent(docNumber)}`).subscribe({
      next: (data) => {
        this.lookupLoading.set(false);
        if (data) {
          this.existingBeneficiary.set(data);
          this.isUpdateMode.set(true);
          this.prefillForm(data);
        } else {
          this.existingBeneficiary.set(null);
          this.isUpdateMode.set(false);
        }
      },
      error: () => this.lookupLoading.set(false),
    });
  }

  private prefillForm(d: any) {
    this.form.patchValue({
      firstName:            d.firstName            ?? '',
      lastName:             d.lastName             ?? '',
      docType:              d.docType              ?? 'Registro Civil',
      birthDate:            d.birthDate ? d.birthDate.split('T')[0] : '',
      nationality:          d.nationality          ?? 'Colombiana',
      gender:               d.gender               ?? 'Femenino',
      address:              d.address              ?? '',
      neighborhood:         d.neighborhood         ?? '',
      city:                 d.city                 ?? '',
      department:           d.department           ?? '',
      isDisplaced:          d.isDisplaced          ? 'SI' : 'NO',
      sisbenGroup:          d.sisbenGroup          ?? 'No lo conoce',
      diagnostico:          d.diagnostico          ?? '',
      otherDiagnosis:       d.otherDiagnosis       ?? '',
      hasOtherDiagnosis:    d.otherDiagnosis       ? 'SI' : 'NO',
      tratadoEn:            d.tratadoEn            ?? '',
      clinicaHospital:      d.clinicaHospital      ?? '',
      motherName:           d.motherName           ?? '',
      motherDocNumber:      d.motherDocNumber      ?? '',
      motherPhone:          d.motherPhone          ?? '',
      motherEducation:      d.motherEducation      ?? 'Bachiller',
      motherProfession:     d.motherProfession     ?? '',
      motherOccupation:     d.motherOccupation     ?? '',
      motherLivesWithChild: d.motherLivesWithChild ? 'SI' : 'NO',
      motherRespondsEcon:   d.motherRespondsEcon   ? 'SI' : 'NO',
      fatherName:           d.fatherName           ?? '',
      fatherDocNumber:      d.fatherDocNumber      ?? '',
      fatherPhone:          d.fatherPhone          ?? '',
      fatherEducation:      d.fatherEducation      ?? 'Bachiller',
      fatherProfession:     d.fatherProfession     ?? '',
      fatherOccupation:     d.fatherOccupation     ?? '',
      fatherLivesWithChild: d.fatherLivesWithChild ? 'SI' : 'NO',
      fatherRespondsEcon:   d.fatherRespondsEcon   ? 'SI' : 'NO',
      numSiblings:          d.numSiblings          ?? 0,
      caregiverName:        d.caregiverName        ?? '',
      caregiverRelationship: d.caregiverRelationship ?? '',
      caregiverPhone:       d.caregiverPhone       ?? '',
      zone:                 d.zone                 ?? 'Urbano',
      housingType:          d.housingType          ?? 'Familiar',
      housingStrata:        d.housingStrata        ?? 1,
      publicTransportNearby: d.publicTransportNearby ? 'SI' : 'NO',
      numPeopleInHome:      d.numPeopleInHome      ?? 2,
      incomeSource:         d.incomeSource         ?? '',
      govSubsidyType:       d.govSubsidyType       ?? '',
      comoSeEntero:         d.comoSeEntero         ?? '',
    });

    // EPS
    const epsVal: string = d.eps ?? '';
    if (epsVal && !epsVal.startsWith('NO EPS')) {
      this.hasEpsOption.set('SI');
      this.form.patchValue({ eps: epsVal, regimen: d.regimen ?? '' });
    } else {
      this.hasEpsOption.set('NO');
      const reason = epsVal.replace('NO EPS - ', '');
      this.form.patchValue({ epsNoReason: reason });
    }

    // Hermanos
    if (d.hasSiblings && Array.isArray(d.siblingsData) && d.siblingsData.length > 0) {
      this.hasSiblingsOption.set('SI');
      this.siblingsList.set(d.siblingsData as Array<{ age: number; livesWith: boolean }>);
    }

    // Subsidio
    if (d.receivesGovSubsidy) {
      this.receivesGovSubsidyOption.set('SI');
    }

    // Servicios públicos
    if (Array.isArray(d.publicServices)) {
      this.serviciosSelected.set(d.publicServices as string[]);
    }
  }

  validateStep(stepNum: number): boolean {
    this.stepErrors.set('');
    const v = this.form.value;

    if (stepNum === 1) {
      if (this.form.controls.firstName.invalid ||
          this.form.controls.lastName.invalid ||
          this.form.controls.docType.invalid ||
          this.form.controls.docNumber.invalid ||
          this.form.controls.birthDate.invalid ||
          this.form.controls.nationality.invalid ||
          this.form.controls.gender.invalid ||
          this.form.controls.address.invalid ||
          this.form.controls.neighborhood.invalid ||
          this.form.controls.city.invalid ||
          this.form.controls.department.invalid) {
        this.stepErrors.set('Por favor diligencie todos los campos obligatorios del niño y su dirección.');
        return false;
      }
    }

    if (stepNum === 2) {
      if (this.hasEpsOption() === 'SI' && (!v.eps || !v.regimen)) {
        this.stepErrors.set('Por favor especifique la EPS y el tipo de afiliación.');
        return false;
      }
      if (this.hasEpsOption() === 'NO' && !v.epsNoReason) {
        this.stepErrors.set('Por favor explique brevemente por qué no está afiliado a una EPS.');
        return false;
      }
      if (this.form.controls.diagnostico.invalid || this.form.controls.tratadoEn.invalid) {
        this.stepErrors.set('Por favor especifique la cardiopatía del niño y el lugar de tratamiento.');
        return false;
      }
      if (v.hasOtherDiagnosis === 'SI' && !v.otherDiagnosis) {
        this.stepErrors.set('Por favor especifique el otro diagnóstico o discapacidad del niño.');
        return false;
      }
    }

    if (stepNum === 3) {
      if (this.form.controls.motherName.invalid ||
          this.form.controls.motherPhone.invalid ||
          this.form.controls.motherOccupation.invalid ||
          this.form.controls.fatherName.invalid ||
          this.form.controls.fatherOccupation.invalid) {
        this.stepErrors.set('Por favor ingrese el nombre, celular de contacto y ocupación de la mamá y el papá.');
        return false;
      }
    }

    if (stepNum === 4) {
      if (this.form.controls.caregiverName.invalid ||
          this.form.controls.caregiverRelationship.invalid ||
          this.form.controls.caregiverPhone.invalid ||
          this.form.controls.zone.invalid ||
          this.form.controls.housingType.invalid ||
          this.form.controls.housingStrata.invalid ||
          this.form.controls.numPeopleInHome.invalid) {
        this.stepErrors.set('Por favor complete los datos del cuidador, estrato, personas en el hogar y ubicación.');
        return false;
      }
      if (this.hasSiblingsOption() === 'SI' && this.siblingsList().length === 0) {
        this.stepErrors.set('Indicó que tiene hermanos, por favor agregue al menos uno.');
        return false;
      }
    }

    return true;
  }

  next() {
    if (this.validateStep(this.currentStep())) {
      this.currentStep.update(s => s + 1);
      window.scrollTo(0, 0);
    }
  }

  prev() {
    this.stepErrors.set('');
    this.currentStep.update(s => Math.max(1, s - 1));
    window.scrollTo(0, 0);
  }

  submit() {
    if (!this.validateStep(5)) return;

    if (this.form.controls.aceptaTratamientoDatos.invalid) {
      this.stepErrors.set('Debe aceptar el tratamiento de datos personales para continuar.');
      return;
    }

    this.loading.set(true);
    const v = this.form.value;

    // Estructurar payload para enviar como JSON al backend
    const payload = {
      firstName:                  v.firstName,
      lastName:                   v.lastName,
      docType:                    v.docType,
      docNumber:                  v.docNumber,
      birthDate:                  v.birthDate ? new Date(v.birthDate).toISOString() : null,
      nationality:                v.nationality,
      gender:                     v.gender,
      address:                    v.address,
      neighborhood:               v.neighborhood,
      city:                       v.city,
      department:                 v.department,
      isDisplaced:                v.isDisplaced === 'SI',

      // Salud
      eps:                        this.hasEpsOption() === 'SI' ? v.eps : `NO EPS - ${v.epsNoReason}`,
      regimen:                    this.hasEpsOption() === 'SI' ? v.regimen : '',
      sisbenGroup:                v.sisbenGroup,
      diagnostico:                v.diagnostico,
      otherDiagnosis:             v.hasOtherDiagnosis === 'SI' ? v.otherDiagnosis : null,
      tratadoEn:                  v.tratadoEn,
      clinicaHospital:            v.clinicaHospital,

      // Familia
      motherName:                 v.motherName,
      motherDocNumber:            v.motherDocNumber || null,
      motherPhone:                v.motherPhone,
      motherEducation:            v.motherEducation,
      motherProfession:           v.motherProfession || null,
      motherOccupation:           v.motherOccupation,
      motherLivesWithChild:       v.motherLivesWithChild === 'SI',
      motherRespondsEcon:         v.motherRespondsEcon === 'SI',

      fatherName:                 v.fatherName,
      fatherDocNumber:            v.fatherDocNumber || null,
      fatherPhone:                v.fatherPhone || null,
      fatherEducation:            v.fatherEducation,
      fatherProfession:           v.fatherProfession || null,
      fatherOccupation:           v.fatherOccupation,
      fatherLivesWithChild:       v.fatherLivesWithChild === 'SI',
      fatherRespondsEcon:         v.fatherRespondsEcon === 'SI',

      // Hermanos y Cuidador
      hasSiblings:                this.hasSiblingsOption() === 'SI',
      numSiblings:                Number(v.numSiblings || 0),
      siblingsData:               this.hasSiblingsOption() === 'SI' ? this.siblingsList() : null,
      caregiverName:              v.caregiverName,
      caregiverRelationship:      v.caregiverRelationship,
      caregiverPhone:             v.caregiverPhone,

      // Vivienda
      zone:                       v.zone,
      housingType:                v.housingType,
      housingStrata:              Number(v.housingStrata || 1),
      publicServices:             this.serviciosSelected(),
      publicTransportNearby:      v.publicTransportNearby === 'SI',
      numPeopleInHome:            Number(v.numPeopleInHome || 2),

      // Economía y Meta
      incomeSource:               v.incomeSource,
      receivesGovSubsidy:         this.receivesGovSubsidyOption() === 'SI',
      govSubsidyType:             this.receivesGovSubsidyOption() === 'SI' ? v.govSubsidyType : null,
      comoSeEntero:               v.comoSeEntero,
      status:                     'Activo', // Por defecto entra activo
    };

    const existing = this.existingBeneficiary();
    const request$ = existing && this.isUpdateMode()
      ? this.http.put(`${environment.apiUrl}/beneficiaries/public-update/${existing.id}`, payload)
      : this.http.post(`${environment.apiUrl}/beneficiaries/public-register`, payload);

    request$.subscribe({
      next: () => {
        this.step.set('success');
        this.loading.set(false);
      },
      error: (err) => {
        this.errorMsg.set(err.error?.message ?? 'Ocurrió un error al enviar el formulario. Intenta de nuevo.');
        this.step.set('error');
        this.loading.set(false);
      }
    });
  }

  retry() {
    this.step.set('form');
    this.currentStep.set(1);
    this.errorMsg.set('');
    this.siblingsList.set([]);
    this.serviciosSelected.set([]);
  }
}
