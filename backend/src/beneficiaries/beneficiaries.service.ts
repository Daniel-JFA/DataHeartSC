import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBeneficiaryDto } from './dto/create-beneficiary.dto';
import { UpdateBeneficiaryDto } from './dto/update-beneficiary.dto';

@Injectable()
export class BeneficiariesService {
  constructor(private prisma: PrismaService) {}

  async findAll(page = 1, limit = 20, search = '', status = '') {
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { firstName:   { contains: search, mode: 'insensitive' } },
        { lastName:    { contains: search, mode: 'insensitive' } },
        { docNumber:   { contains: search, mode: 'insensitive' } },
        { city:        { contains: search, mode: 'insensitive' } },
        { eps:         { contains: search, mode: 'insensitive' } },
        { diagnostico: { contains: search, mode: 'insensitive' } },
        { motherName:  { contains: search, mode: 'insensitive' } },
        { fatherName:  { contains: search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await this.prisma.$transaction([
      this.prisma.beneficiary.findMany({
        where, skip, take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true, firstName: true, lastName: true,
          docType: true, docNumber: true, gender: true,
          birthDate: true, city: true, department: true,
          eps: true, diagnostico: true, status: true,
          deceasedDate: true, createdAt: true,
          _count: { select: { ayudas: true } },
        },
      }),
      this.prisma.beneficiary.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string) {
    const ben = await this.prisma.beneficiary.findUnique({
      where: { id },
      include: {
        ayudas: {
          orderBy: { fecha: 'desc' },
          take: 10,
          select: {
            id: true, fecha: true, tipoSolicitud: true,
            personasBeneficiadas: true, valor: true, estado: true,
          },
        },
      },
    });
    if (!ben) throw new NotFoundException(`Beneficiario ${id} no encontrado`);
    return ben;
  }

  async create(dto: CreateBeneficiaryDto) {
    const exists = await this.prisma.beneficiary.findUnique({
      where: { docNumber: dto.docNumber },
    });
    if (exists) throw new ConflictException(
      `Ya existe un beneficiario con documento ${dto.docNumber}`,
    );
    return this.prisma.beneficiary.create({ data: dto as any });
  }

  async update(id: string, dto: UpdateBeneficiaryDto) {
    await this.findOne(id);
    if (dto.docNumber) {
      const conflict = await this.prisma.beneficiary.findFirst({
        where: { docNumber: dto.docNumber, NOT: { id } },
      });
      if (conflict) throw new ConflictException(
        `El documento ${dto.docNumber} pertenece a otro beneficiario`,
      );
    }
    // Si se setea deceasedDate y no viene status explícito → marcar Fallecido
    const data: any = { ...dto };
    if (dto.deceasedDate && !dto.status) data.status = 'Fallecido';
    return this.prisma.beneficiary.update({ where: { id }, data });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.beneficiary.update({
      where: { id },
      data: { status: 'Inactivo' },
    });
  }

  async getStats() {
    const [total, activos, fallecidos, sinEps, porGenero, topEps, topDiag] =
      await this.prisma.$transaction([
        this.prisma.beneficiary.count(),
        this.prisma.beneficiary.count({ where: { status: 'Activo' } }),
        this.prisma.beneficiary.count({ where: { status: 'Fallecido' } }),
        this.prisma.beneficiary.count({ where: { eps: null } }),
        this.prisma.beneficiary.groupBy({
          by: ['gender'], _count: { id: true },
          orderBy: { _count: { id: 'desc' } },
        }),
        this.prisma.beneficiary.groupBy({
          by: ['eps'], _count: { id: true },
          where: { eps: { not: null } },
          orderBy: { _count: { id: 'desc' } },
          take: 10,
        }),
        this.prisma.beneficiary.groupBy({
          by: ['diagnostico'], _count: { id: true },
          where: { diagnostico: { not: null } },
          orderBy: { _count: { id: 'desc' } },
          take: 10,
        }),
      ]);

    return { total, activos, fallecidos, sinEps, porGenero, topEps, topDiag };
  }
}
