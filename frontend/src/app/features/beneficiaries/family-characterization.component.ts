import { Component, inject, signal, effect } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

type Step = 'form' | 'success' | 'error';

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

  readonly DOC_TYPES = DOC_TYPES;
  readonly GENDERS = GENDERS;
  readonly REGIMENES = REGIMENES;
  readonly SISBEN_GROUPS = SISBEN_GROUPS;
  readonly ESCOLARIDAD = ESCOLARIDAD;
  readonly ZONAS = ZONAS;
  readonly TIPOS_VIVIENDA = TIPOS_VIVIENDA;
  readonly SERVICIOS_PUBLICOS = SERVICIOS_PUBLICOS;

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
        this.stepErrors.set('Por favor ingrese el nombre, contacto y ocupación de la mamá y el papá.');
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

    this.http.post(`${environment.apiUrl}/beneficiaries/public-register`, payload).subscribe({
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
