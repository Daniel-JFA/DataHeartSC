/**
 * Tests de validación de DTOs para Beneficiaries.
 *
 * Cubre los bugs reales ocurridos:
 *   Bug 1: lastName required con MinLength(2) → frontend enviaba lastName: ''
 *   Bug 2: payload frontend usa firstName=nombreCompleto + lastName='' siempre
 *
 * Estos tests NO requieren base de datos ni NestJS levantado.
 * Usan class-validator directamente con plainToInstance.
 */
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CreateBeneficiaryDto } from './dto/create-beneficiary.dto';
import { UpdateBeneficiaryDto } from './dto/update-beneficiary.dto';

/** Helper: devuelve los nombres de las propiedades con errores */
async function getErrorProperties(dto: object): Promise<string[]> {
  const errors = await validate(dto);
  return errors.map((e) => e.property);
}

/** Helper: retorna true si la validación pasa sin errores */
async function isValid(dto: object): Promise<boolean> {
  const errors = await validate(dto);
  return errors.length === 0;
}

// Payload mínimo válido (refleja lo que manda el frontend)
const VALID_MINIMUM_PAYLOAD = {
  firstName: 'María Fernanda Torres',
  lastName: '',          // ← el frontend siempre manda esto vacío (Bug 1)
  docType: 'Registro Civil',
  docNumber: '12345678',
};

// ─────────────────────────────────────────────────────────────────────────────
// CreateBeneficiaryDto
// ─────────────────────────────────────────────────────────────────────────────
describe('CreateBeneficiaryDto', () => {

  // ── Bug 1 fix: lastName ahora es @IsOptional() ──────────────────────────
  describe('Bug 1 regression — lastName opcional', () => {
    it('debe aceptar lastName: "" (string vacío — lo que manda el frontend)', async () => {
      const dto = plainToInstance(CreateBeneficiaryDto, {
        ...VALID_MINIMUM_PAYLOAD,
        lastName: '',
      });
      expect(await isValid(dto)).toBe(true);
    });

    it('debe aceptar payload sin la clave lastName', async () => {
      const { lastName, ...withoutLastName } = VALID_MINIMUM_PAYLOAD;
      const dto = plainToInstance(CreateBeneficiaryDto, withoutLastName);
      expect(await isValid(dto)).toBe(true);
    });

    it('debe aceptar lastName: "X" (1 carácter — antes fallaba con MinLength(2))', async () => {
      const dto = plainToInstance(CreateBeneficiaryDto, {
        ...VALID_MINIMUM_PAYLOAD,
        lastName: 'X',
      });
      expect(await isValid(dto)).toBe(true);
    });

    it('debe aceptar lastName con valor normal', async () => {
      const dto = plainToInstance(CreateBeneficiaryDto, {
        ...VALID_MINIMUM_PAYLOAD,
        lastName: 'García López',
      });
      expect(await isValid(dto)).toBe(true);
    });
  });

  // ── firstName es requerido ───────────────────────────────────────────────
  describe('firstName requerido', () => {
    it('debe fallar si firstName está ausente', async () => {
      const { firstName, ...noFirstName } = VALID_MINIMUM_PAYLOAD;
      const dto = plainToInstance(CreateBeneficiaryDto, noFirstName);
      const props = await getErrorProperties(dto);
      expect(props).toContain('firstName');
    });

    it('debe fallar si firstName es string vacío', async () => {
      const dto = plainToInstance(CreateBeneficiaryDto, {
        ...VALID_MINIMUM_PAYLOAD,
        firstName: '',
      });
      const props = await getErrorProperties(dto);
      expect(props).toContain('firstName');
    });

    it('debe fallar si firstName tiene 1 carácter (MinLength 2)', async () => {
      const dto = plainToInstance(CreateBeneficiaryDto, {
        ...VALID_MINIMUM_PAYLOAD,
        firstName: 'A',
      });
      const props = await getErrorProperties(dto);
      expect(props).toContain('firstName');
    });

    it('debe aceptar firstName con exactamente 2 caracteres', async () => {
      const dto = plainToInstance(CreateBeneficiaryDto, {
        ...VALID_MINIMUM_PAYLOAD,
        firstName: 'Ai',
      });
      expect(await isValid(dto)).toBe(true);
    });
  });

  // ── docType con IsIn ─────────────────────────────────────────────────────
  describe('docType validación IsIn', () => {
    it('debe fallar con docType inválido', async () => {
      const dto = plainToInstance(CreateBeneficiaryDto, {
        ...VALID_MINIMUM_PAYLOAD,
        docType: 'Pasaporte',   // no está en la lista permitida
      });
      const props = await getErrorProperties(dto);
      expect(props).toContain('docType');
    });

    it('debe fallar si docType está ausente', async () => {
      const { docType, ...noDocType } = VALID_MINIMUM_PAYLOAD;
      const dto = plainToInstance(CreateBeneficiaryDto, noDocType);
      const props = await getErrorProperties(dto);
      expect(props).toContain('docType');
    });

    const VALID_DOC_TYPES = [
      'Cédula de Ciudadanía',
      'Registro Civil',
      'Tarjeta de Identidad',
      'Permiso Especial Permanencia',
      'Menor sin Identificación',
      'NO ADRES',
      'Sin Identificación',
    ];

    VALID_DOC_TYPES.forEach((docType) => {
      it(`debe aceptar docType: "${docType}"`, async () => {
        const dto = plainToInstance(CreateBeneficiaryDto, {
          ...VALID_MINIMUM_PAYLOAD,
          docType,
        });
        expect(await isValid(dto)).toBe(true);
      });
    });
  });

  // ── docNumber requerido ──────────────────────────────────────────────────
  describe('docNumber requerido', () => {
    it('debe fallar si docNumber está ausente', async () => {
      const { docNumber, ...noDocNumber } = VALID_MINIMUM_PAYLOAD;
      const dto = plainToInstance(CreateBeneficiaryDto, noDocNumber);
      const props = await getErrorProperties(dto);
      expect(props).toContain('docNumber');
    });

    it('debe fallar si docNumber es string vacío (MinLength 1)', async () => {
      const dto = plainToInstance(CreateBeneficiaryDto, {
        ...VALID_MINIMUM_PAYLOAD,
        docNumber: '',
      });
      const props = await getErrorProperties(dto);
      expect(props).toContain('docNumber');
    });

    it('debe aceptar docNumber de un solo dígito', async () => {
      const dto = plainToInstance(CreateBeneficiaryDto, {
        ...VALID_MINIMUM_PAYLOAD,
        docNumber: '0',
      });
      expect(await isValid(dto)).toBe(true);
    });
  });

  // ── birthDate — edge cases ───────────────────────────────────────────────
  describe('birthDate — campo opcional, debe ser ISO date cuando presente', () => {
    it('debe aceptar birthDate ausente', async () => {
      const dto = plainToInstance(CreateBeneficiaryDto, VALID_MINIMUM_PAYLOAD);
      expect(await isValid(dto)).toBe(true);
    });

    it('debe aceptar birthDate en formato ISO 8601', async () => {
      const dto = plainToInstance(CreateBeneficiaryDto, {
        ...VALID_MINIMUM_PAYLOAD,
        birthDate: '2010-05-15T00:00:00.000Z',
      });
      expect(await isValid(dto)).toBe(true);
    });

    it('debe fallar si birthDate es texto libre no ISO', async () => {
      const dto = plainToInstance(CreateBeneficiaryDto, {
        ...VALID_MINIMUM_PAYLOAD,
        birthDate: 'el 15 de mayo de 2010',
      });
      const props = await getErrorProperties(dto);
      expect(props).toContain('birthDate');
    });
  });

  // ── housingStrata — @Min(1) @Max(6) ─────────────────────────────────────
  describe('housingStrata — rango 1-6', () => {
    it('debe aceptar housingStrata: 1 (mínimo)', async () => {
      const dto = plainToInstance(CreateBeneficiaryDto, {
        ...VALID_MINIMUM_PAYLOAD,
        housingStrata: 1,
      });
      expect(await isValid(dto)).toBe(true);
    });

    it('debe aceptar housingStrata: 6 (máximo)', async () => {
      const dto = plainToInstance(CreateBeneficiaryDto, {
        ...VALID_MINIMUM_PAYLOAD,
        housingStrata: 6,
      });
      expect(await isValid(dto)).toBe(true);
    });

    it('debe fallar con housingStrata: 0 (debajo del mínimo)', async () => {
      const dto = plainToInstance(CreateBeneficiaryDto, {
        ...VALID_MINIMUM_PAYLOAD,
        housingStrata: 0,
      });
      const props = await getErrorProperties(dto);
      expect(props).toContain('housingStrata');
    });

    it('debe fallar con housingStrata: 7 (sobre el máximo)', async () => {
      const dto = plainToInstance(CreateBeneficiaryDto, {
        ...VALID_MINIMUM_PAYLOAD,
        housingStrata: 7,
      });
      const props = await getErrorProperties(dto);
      expect(props).toContain('housingStrata');
    });

    it('debe aceptar housingStrata ausente (es opcional)', async () => {
      const dto = plainToInstance(CreateBeneficiaryDto, VALID_MINIMUM_PAYLOAD);
      expect(await isValid(dto)).toBe(true);
    });
  });

  // ── gender — IsIn opcional ───────────────────────────────────────────────
  describe('gender — IsIn opcional', () => {
    it('debe aceptar gender ausente', async () => {
      const dto = plainToInstance(CreateBeneficiaryDto, VALID_MINIMUM_PAYLOAD);
      expect(await isValid(dto)).toBe(true);
    });

    it('debe fallar con gender inválido', async () => {
      const dto = plainToInstance(CreateBeneficiaryDto, {
        ...VALID_MINIMUM_PAYLOAD,
        gender: 'Indeterminado',
      });
      const props = await getErrorProperties(dto);
      expect(props).toContain('gender');
    });

    ['Masculino', 'Femenino', 'Otro'].forEach((gender) => {
      it(`debe aceptar gender: "${gender}"`, async () => {
        const dto = plainToInstance(CreateBeneficiaryDto, {
          ...VALID_MINIMUM_PAYLOAD,
          gender,
        });
        expect(await isValid(dto)).toBe(true);
      });
    });
  });

  // ── regimen — acepta string vacío (Bug 2 adjacent: frontend envía '' cuando no hay EPS) ──
  describe('regimen — acepta string vacío', () => {
    it('debe aceptar regimen: "" (frontend envía vacío cuando no tiene EPS)', async () => {
      const dto = plainToInstance(CreateBeneficiaryDto, {
        ...VALID_MINIMUM_PAYLOAD,
        regimen: '',
      });
      expect(await isValid(dto)).toBe(true);
    });

    it('debe fallar con regimen inválido', async () => {
      const dto = plainToInstance(CreateBeneficiaryDto, {
        ...VALID_MINIMUM_PAYLOAD,
        regimen: 'SURA',
      });
      const props = await getErrorProperties(dto);
      expect(props).toContain('regimen');
    });
  });

  // ── zone / housingType — acepta string vacío ─────────────────────────────
  describe('zone — acepta string vacío', () => {
    it('debe aceptar zone: "" (frontend puede enviar vacío)', async () => {
      const dto = plainToInstance(CreateBeneficiaryDto, {
        ...VALID_MINIMUM_PAYLOAD,
        zone: '',
      });
      expect(await isValid(dto)).toBe(true);
    });

    it('debe fallar con zone inválida', async () => {
      const dto = plainToInstance(CreateBeneficiaryDto, {
        ...VALID_MINIMUM_PAYLOAD,
        zone: 'Suburbano',
      });
      const props = await getErrorProperties(dto);
      expect(props).toContain('zone');
    });
  });

  // ── numSiblings — @Min(0) ────────────────────────────────────────────────
  describe('numSiblings — Min(0)', () => {
    it('debe aceptar numSiblings: 0', async () => {
      const dto = plainToInstance(CreateBeneficiaryDto, {
        ...VALID_MINIMUM_PAYLOAD,
        numSiblings: 0,
      });
      expect(await isValid(dto)).toBe(true);
    });

    it('debe fallar con numSiblings: -1', async () => {
      const dto = plainToInstance(CreateBeneficiaryDto, {
        ...VALID_MINIMUM_PAYLOAD,
        numSiblings: -1,
      });
      const props = await getErrorProperties(dto);
      expect(props).toContain('numSiblings');
    });
  });

  // ── email — IsEmail opcional ─────────────────────────────────────────────
  describe('email — validación formato', () => {
    it('debe aceptar email válido', async () => {
      const dto = plainToInstance(CreateBeneficiaryDto, {
        ...VALID_MINIMUM_PAYLOAD,
        email: 'test@ejemplo.com',
      });
      expect(await isValid(dto)).toBe(true);
    });

    it('debe fallar con email malformado', async () => {
      const dto = plainToInstance(CreateBeneficiaryDto, {
        ...VALID_MINIMUM_PAYLOAD,
        email: 'no-es-un-email',
      });
      const props = await getErrorProperties(dto);
      expect(props).toContain('email');
    });

    it('debe aceptar email ausente', async () => {
      const dto = plainToInstance(CreateBeneficiaryDto, VALID_MINIMUM_PAYLOAD);
      expect(await isValid(dto)).toBe(true);
    });
  });

  // ── payload completo como lo manda el frontend (Bug 2 — integración) ─────
  describe('Bug 2 regression — payload real del frontend', () => {
    it('debe aceptar el payload exacto que envía el formulario de caracterización', async () => {
      const frontendPayload = {
        firstName:             'Valentina Ruiz Gómez',
        lastName:              '',        // siempre vacío desde el frontend
        docType:               'Registro Civil',
        docNumber:             '98765432',
        birthDate:             '2015-03-20T00:00:00.000Z',
        nationality:           'Colombiana',
        gender:                'Femenino',
        address:               'Calle 45 #12-34',
        city:                  'Medellín',
        department:            'Antioquia',
        isDisplaced:           false,
        eps:                   'Sura',
        regimen:               'Subsidiado',
        sisbenGroup:           'A1',
        diagnostico:           'Leucemia',
        otherDiagnosis:        null,
        tratadoEn:             'Hospital Pablo Tobón',
        clinicaHospital:       'Hospital Pablo Tobón',
        motherName:            'Laura Gómez',
        motherDocNumber:       null,
        motherPhone:           '3001234567',
        motherEducation:       'Secundaria',
        motherProfession:      null,
        motherOccupation:      'Vendedora',
        motherLivesWithChild:  true,
        motherRespondsEcon:    true,
        fatherName:            null,
        fatherDocNumber:       null,
        fatherPhone:           null,
        fatherEducation:       null,
        fatherProfession:      null,
        fatherOccupation:      null,
        fatherLivesWithChild:  false,
        fatherRespondsEcon:    false,
        hasSiblings:           true,
        numSiblings:           2,
        siblingsData:          null,
        caregiverName:         'Laura Gómez',
        caregiverRelationship: 'Madre',
        caregiverPhone:        '3001234567',
        zone:                  'Urbano',
        housingType:           'Arrendada',
        housingStrata:         2,
        publicServices:        ['Agua', 'Luz'],
        publicTransportNearby: true,
        numPeopleInHome:       4,
        incomeSource:          'Trabajo informal',
        receivesGovSubsidy:    false,
        govSubsidyType:        null,
        comoSeEntero:          'Redes sociales',
        status:                'Activo',
      };
      const dto = plainToInstance(CreateBeneficiaryDto, frontendPayload);
      const errors = await validate(dto);
      // Mostrar errores detallados si falla para facilitar debug
      if (errors.length > 0) {
        console.error('Errores de validación inesperados:', JSON.stringify(errors, null, 2));
      }
      expect(errors).toHaveLength(0);
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// UpdateBeneficiaryDto
// ─────────────────────────────────────────────────────────────────────────────
describe('UpdateBeneficiaryDto', () => {
  it('debe aceptar objeto vacío (PartialType — todos opcionales)', async () => {
    const dto = plainToInstance(UpdateBeneficiaryDto, {});
    expect(await isValid(dto)).toBe(true);
  });

  it('debe aceptar status: "Fallecido"', async () => {
    const dto = plainToInstance(UpdateBeneficiaryDto, { status: 'Fallecido' });
    expect(await isValid(dto)).toBe(true);
  });

  it('debe fallar con status inválido', async () => {
    const dto = plainToInstance(UpdateBeneficiaryDto, { status: 'Borrado' });
    const props = await getErrorProperties(dto);
    expect(props).toContain('status');
  });

  it('debe aceptar status: "Activo"', async () => {
    const dto = plainToInstance(UpdateBeneficiaryDto, { status: 'Activo' });
    expect(await isValid(dto)).toBe(true);
  });

  it('debe aceptar status: "Inactivo"', async () => {
    const dto = plainToInstance(UpdateBeneficiaryDto, { status: 'Inactivo' });
    expect(await isValid(dto)).toBe(true);
  });

  it('debe aceptar observacionesPrivadas arbitrarias', async () => {
    const dto = plainToInstance(UpdateBeneficiaryDto, {
      observacionesPrivadas: 'Caso revisado por trabajadora social el 2026-08-07',
    });
    expect(await isValid(dto)).toBe(true);
  });

  it('debe aceptar lastName: "" en actualización (mismo fix que en create)', async () => {
    const dto = plainToInstance(UpdateBeneficiaryDto, { lastName: '' });
    expect(await isValid(dto)).toBe(true);
  });

  it('debe aceptar deceasedDate ISO y dejar que el service deduzca status=Fallecido', async () => {
    const dto = plainToInstance(UpdateBeneficiaryDto, {
      deceasedDate: '2026-07-01T00:00:00.000Z',
    });
    expect(await isValid(dto)).toBe(true);
  });

  it('debe fallar si deceasedDate no es ISO date', async () => {
    const dto = plainToInstance(UpdateBeneficiaryDto, {
      deceasedDate: 'julio 2026',
    });
    const props = await getErrorProperties(dto);
    expect(props).toContain('deceasedDate');
  });
});
