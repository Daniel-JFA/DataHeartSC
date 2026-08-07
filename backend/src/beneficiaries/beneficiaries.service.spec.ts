/**
 * Tests unitarios del BeneficiariesService.
 * PrismaService mockeado — no requiere base de datos.
 *
 * Cubre:
 *   - solicitudAyuda: docNumber inexistente → NotFoundException
 *   - solicitudAyuda: datos válidos → { ok: true }
 *   - create: docNumber duplicado → ConflictException
 *   - update: beneficiario inexistente → NotFoundException
 *   - update: deceasedDate sin status → fuerza status='Fallecido'
 *   - remove: beneficiario inexistente → NotFoundException
 */
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { BeneficiariesService } from './beneficiaries.service';
import { PrismaService } from '../prisma/prisma.service';

// ─── Mock de PrismaService ────────────────────────────────────────────────────
const mockPrisma = {
  beneficiary: {
    findMany:   jest.fn(),
    findUnique: jest.fn(),
    findFirst:  jest.fn(),
    create:     jest.fn(),
    update:     jest.fn(),
    count:      jest.fn(),
    groupBy:    jest.fn(),
  },
  ayuda: {
    create: jest.fn(),
  },
  $transaction: jest.fn(),
};

// Beneficiario de ejemplo reutilizable
const SAMPLE_BEN = {
  id:         'uuid-001',
  firstName:  'Valentina',
  lastName:   '',
  docType:    'Registro Civil',
  docNumber:  '12345678',
  status:     'Activo',
  createdAt:  new Date(),
  updatedAt:  new Date(),
  ayudas:     [],
};

// ─────────────────────────────────────────────────────────────────────────────
describe('BeneficiariesService', () => {
  let service: BeneficiariesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BeneficiariesService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<BeneficiariesService>(BeneficiariesService);

    // Limpiar todos los mocks antes de cada test
    jest.clearAllMocks();
  });

  // ──────────────────────────────────────────────────────────────────────────
  // solicitudAyuda
  // ──────────────────────────────────────────────────────────────────────────
  describe('solicitudAyuda()', () => {
    it('lanza NotFoundException cuando el docNumber no existe en la BD', async () => {
      mockPrisma.beneficiary.findFirst.mockResolvedValue(null);

      await expect(
        service.solicitudAyuda({
          docNumber:   '99999999',
          tiposAyuda:  JSON.stringify(['Transporte']),
          motivaciones: JSON.stringify({ Transporte: 'Necesito traslados al hospital' }),
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('el mensaje de NotFoundException menciona el docNumber buscado', async () => {
      mockPrisma.beneficiary.findFirst.mockResolvedValue(null);

      await expect(
        service.solicitudAyuda({
          docNumber:   '99999999',
          tiposAyuda:  JSON.stringify(['Transporte']),
          motivaciones: JSON.stringify({}),
        }),
      ).rejects.toThrow(/99999999/);
    });

    it('lanza BadRequestException cuando tiposAyuda está vacío', async () => {
      await expect(
        service.solicitudAyuda({
          docNumber:    '12345678',
          tiposAyuda:   JSON.stringify([]),
          motivaciones: JSON.stringify({}),
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('retorna { ok: true } cuando el beneficiario existe y los datos son válidos', async () => {
      mockPrisma.beneficiary.findFirst.mockResolvedValue(SAMPLE_BEN);
      mockPrisma.ayuda.create.mockResolvedValue({ id: 'ayuda-001' });

      const result = await service.solicitudAyuda({
        docNumber:    '12345678',
        tiposAyuda:   JSON.stringify(['Transporte', 'Medicamento']),
        motivaciones: JSON.stringify({
          Transporte:  'Traslados oncología',
          Medicamento: 'Quimioterapia mensual',
        }),
      });

      expect(result.ok).toBe(true);
      expect(result.count).toBe(2);
    });

    it('crea una Ayuda por cada tipo de ayuda seleccionado', async () => {
      mockPrisma.beneficiary.findFirst.mockResolvedValue(SAMPLE_BEN);
      mockPrisma.ayuda.create.mockResolvedValue({ id: 'ayuda-001' });

      await service.solicitudAyuda({
        docNumber:    '12345678',
        tiposAyuda:   JSON.stringify(['Transporte', 'Alimentación', 'Medicamento']),
        motivaciones: JSON.stringify({}),
      });

      expect(mockPrisma.ayuda.create).toHaveBeenCalledTimes(3);
    });

    it('crea Ayuda con estado Pendiente por defecto', async () => {
      mockPrisma.beneficiary.findFirst.mockResolvedValue(SAMPLE_BEN);
      mockPrisma.ayuda.create.mockResolvedValue({ id: 'ayuda-001' });

      await service.solicitudAyuda({
        docNumber:    '12345678',
        tiposAyuda:   JSON.stringify(['Transporte']),
        motivaciones: JSON.stringify({ Transporte: 'Traslado' }),
      });

      expect(mockPrisma.ayuda.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            beneficiaryId: SAMPLE_BEN.id,
            tipoSolicitud: 'Transporte',
            justificacion: 'Traslado',
            estado: 'Pendiente',
          }),
        }),
      );
    });

    it('usa string vacío como justificacion cuando no se provee motivación para un tipo', async () => {
      mockPrisma.beneficiary.findFirst.mockResolvedValue(SAMPLE_BEN);
      mockPrisma.ayuda.create.mockResolvedValue({ id: 'ayuda-001' });

      await service.solicitudAyuda({
        docNumber:    '12345678',
        tiposAyuda:   JSON.stringify(['Transporte']),
        motivaciones: JSON.stringify({}),  // sin motivación para Transporte
      });

      expect(mockPrisma.ayuda.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ justificacion: '' }),
        }),
      );
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // create
  // ──────────────────────────────────────────────────────────────────────────
  describe('create()', () => {
    const VALID_DTO = {
      firstName: 'Valentina',
      lastName:  '',
      docType:   'Registro Civil',
      docNumber: '12345678',
    } as any;

    it('lanza ConflictException cuando ya existe un beneficiario con el mismo docNumber', async () => {
      mockPrisma.beneficiary.findUnique.mockResolvedValue(SAMPLE_BEN);

      await expect(service.create(VALID_DTO)).rejects.toThrow(ConflictException);
    });

    it('el mensaje de ConflictException incluye el docNumber duplicado', async () => {
      mockPrisma.beneficiary.findUnique.mockResolvedValue(SAMPLE_BEN);

      await expect(service.create(VALID_DTO)).rejects.toThrow(/12345678/);
    });

    it('crea el beneficiario cuando no existe duplicado', async () => {
      mockPrisma.beneficiary.findUnique.mockResolvedValue(null);
      mockPrisma.beneficiary.create.mockResolvedValue({ ...SAMPLE_BEN, id: 'uuid-nuevo' });

      const result = await service.create(VALID_DTO);

      expect(mockPrisma.beneficiary.create).toHaveBeenCalledTimes(1);
      expect(result.id).toBe('uuid-nuevo');
    });

    it('acepta payload con lastName vacío (Bug 1 — garantiza que el service no rechaza)', async () => {
      mockPrisma.beneficiary.findUnique.mockResolvedValue(null);
      mockPrisma.beneficiary.create.mockResolvedValue(SAMPLE_BEN);

      await expect(
        service.create({ ...VALID_DTO, lastName: '' }),
      ).resolves.toBeDefined();
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // update
  // ──────────────────────────────────────────────────────────────────────────
  describe('update()', () => {
    it('lanza NotFoundException cuando el beneficiario no existe', async () => {
      mockPrisma.beneficiary.findUnique.mockResolvedValue(null);

      await expect(
        service.update('uuid-inexistente', { firstName: 'Nuevo' } as any),
      ).rejects.toThrow(NotFoundException);
    });

    it('lanza ConflictException cuando docNumber ya pertenece a otro beneficiario', async () => {
      mockPrisma.beneficiary.findUnique.mockResolvedValue(SAMPLE_BEN);
      mockPrisma.beneficiary.findFirst.mockResolvedValue({
        ...SAMPLE_BEN,
        id: 'uuid-otro',
        docNumber: '99999999',
      });

      await expect(
        service.update('uuid-001', { docNumber: '99999999' } as any),
      ).rejects.toThrow(ConflictException);
    });

    it('actualiza correctamente cuando todos los datos son válidos', async () => {
      mockPrisma.beneficiary.findUnique.mockResolvedValue(SAMPLE_BEN);
      mockPrisma.beneficiary.findFirst.mockResolvedValue(null); // sin conflicto de docNumber
      mockPrisma.beneficiary.update.mockResolvedValue({
        ...SAMPLE_BEN,
        city: 'Bogotá',
      });

      const result = await service.update('uuid-001', { city: 'Bogotá' } as any);
      expect(result.city).toBe('Bogotá');
    });

    it('fuerza status="Fallecido" cuando se setea deceasedDate sin status explícito', async () => {
      mockPrisma.beneficiary.findUnique.mockResolvedValue(SAMPLE_BEN);
      mockPrisma.beneficiary.update.mockResolvedValue({
        ...SAMPLE_BEN,
        status: 'Fallecido',
        deceasedDate: '2026-07-01T00:00:00.000Z',
      });

      await service.update('uuid-001', { deceasedDate: '2026-07-01T00:00:00.000Z' } as any);

      expect(mockPrisma.beneficiary.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'Fallecido' }),
        }),
      );
    });

    it('NO sobrescribe status si viene explícito junto con deceasedDate', async () => {
      mockPrisma.beneficiary.findUnique.mockResolvedValue(SAMPLE_BEN);
      mockPrisma.beneficiary.update.mockResolvedValue({
        ...SAMPLE_BEN,
        status: 'Activo',
        deceasedDate: '2026-07-01T00:00:00.000Z',
      });

      await service.update('uuid-001', {
        deceasedDate: '2026-07-01T00:00:00.000Z',
        status: 'Activo',  // status explícito debe respetarse
      } as any);

      expect(mockPrisma.beneficiary.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'Activo' }),
        }),
      );
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // remove (soft-delete)
  // ──────────────────────────────────────────────────────────────────────────
  describe('remove()', () => {
    it('lanza NotFoundException cuando el beneficiario no existe', async () => {
      mockPrisma.beneficiary.findUnique.mockResolvedValue(null);

      await expect(service.remove('uuid-inexistente')).rejects.toThrow(NotFoundException);
    });

    it('hace soft-delete cambiando status a Inactivo (no elimina fila)', async () => {
      mockPrisma.beneficiary.findUnique.mockResolvedValue(SAMPLE_BEN);
      mockPrisma.beneficiary.update.mockResolvedValue({
        ...SAMPLE_BEN,
        status: 'Inactivo',
      });

      const result = await service.remove('uuid-001');
      expect(result.status).toBe('Inactivo');
      expect(mockPrisma.beneficiary.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { status: 'Inactivo' } }),
      );
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // findOne
  // ──────────────────────────────────────────────────────────────────────────
  describe('findOne()', () => {
    it('lanza NotFoundException cuando el beneficiario no existe', async () => {
      mockPrisma.beneficiary.findUnique.mockResolvedValue(null);

      await expect(service.findOne('uuid-inexistente')).rejects.toThrow(NotFoundException);
    });

    it('retorna el beneficiario cuando existe', async () => {
      mockPrisma.beneficiary.findUnique.mockResolvedValue(SAMPLE_BEN);

      const result = await service.findOne('uuid-001');
      expect(result).toEqual(SAMPLE_BEN);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // findByDocNumber
  // ──────────────────────────────────────────────────────────────────────────
  describe('findByDocNumber()', () => {
    it('retorna null cuando docNumber es string vacío (sin consultar BD)', async () => {
      const result = await service.findByDocNumber('');
      expect(result).toBeNull();
      expect(mockPrisma.beneficiary.findUnique).not.toHaveBeenCalled();
    });

    it('consulta la BD con el docNumber provisto', async () => {
      mockPrisma.beneficiary.findUnique.mockResolvedValue(SAMPLE_BEN);
      const result = await service.findByDocNumber('12345678');
      expect(mockPrisma.beneficiary.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { docNumber: '12345678' } }),
      );
      expect(result).toEqual(SAMPLE_BEN);
    });
  });
});
