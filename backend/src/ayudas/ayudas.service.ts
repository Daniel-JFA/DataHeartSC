import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAyudaDto } from './dto/create-ayuda.dto';
import { UpdateAyudaDto } from './dto/update-ayuda.dto';

@Injectable()
export class AyudasService {
  constructor(private prisma: PrismaService) {}

  async findAll(
    page = 1, limit = 20,
    beneficiaryId = '',
    tipoSolicitud = '',
    estado = '',
  ) {
    const skip = (page - 1) * limit;
    const where: any = {};
    if (beneficiaryId) where.beneficiaryId = beneficiaryId;
    if (tipoSolicitud) where.tipoSolicitud = tipoSolicitud;
    if (estado)        where.estado        = estado;

    const [data, total] = await this.prisma.$transaction([
      this.prisma.ayuda.findMany({
        where, skip, take: limit,
        orderBy: { fecha: 'desc' },
        include: {
          beneficiary: {
            select: { id: true, firstName: true, lastName: true, docNumber: true },
          },
        },
      }),
      this.prisma.ayuda.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string) {
    const ayuda = await this.prisma.ayuda.findUnique({
      where: { id },
      include: {
        beneficiary: {
          select: {
            id: true, firstName: true, lastName: true,
            docNumber: true, city: true, eps: true, diagnostico: true,
          },
        },
      },
    });
    if (!ayuda) throw new NotFoundException(`Ayuda ${id} no encontrada`);
    return ayuda;
  }

  async findByBeneficiary(beneficiaryId: string) {
    const ben = await this.prisma.beneficiary.findUnique({
      where: { id: beneficiaryId },
      select: { id: true },
    });
    if (!ben) throw new NotFoundException(`Beneficiario ${beneficiaryId} no encontrado`);

    const [data, total, totalValor] = await Promise.all([
      this.prisma.ayuda.findMany({
        where: { beneficiaryId },
        orderBy: { fecha: 'desc' },
      }),
      this.prisma.ayuda.count({ where: { beneficiaryId } }),
      this.prisma.ayuda.aggregate({
        where: { beneficiaryId },
        _sum: { valor: true },
      }),
    ]);

    return { data, total, totalValor: totalValor._sum.valor ?? 0 };
  }

  async create(dto: CreateAyudaDto) {
    const ben = await this.prisma.beneficiary.findUnique({
      where: { id: dto.beneficiaryId },
    });
    if (!ben) throw new NotFoundException(
      `Beneficiario ${dto.beneficiaryId} no encontrado`,
    );
    return this.prisma.ayuda.create({ data: dto as any });
  }

  async update(id: string, dto: UpdateAyudaDto) {
    await this.findOne(id);
    return this.prisma.ayuda.update({ where: { id }, data: dto as any });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.ayuda.delete({ where: { id } });
  }

  async getStats() {
    const now   = new Date();
    const mesInicio = new Date(now.getFullYear(), now.getMonth(), 1);

    const [total, resueltas, pendientes, ayudasMes, porTipo, agg, valorPorTipo] =
      await this.prisma.$transaction([
        this.prisma.ayuda.count(),
        this.prisma.ayuda.count({ where: { estado: 'Resuelta' } }),
        this.prisma.ayuda.count({ where: { estado: 'Pendiente' } }),
        this.prisma.ayuda.count({ where: { fecha: { gte: mesInicio } } }),
        this.prisma.ayuda.groupBy({
          by: ['tipoSolicitud'], _count: { id: true },
          orderBy: { _count: { id: 'desc' } },
        }),
        this.prisma.ayuda.aggregate({ _sum: { valor: true } }),
        this.prisma.ayuda.groupBy({
          by: ['tipoSolicitud'], _sum: { valor: true },
          orderBy: { _sum: { valor: 'desc' } },
          take: 10,
        }),
      ]);

    return {
      total, resueltas, pendientes, ayudasMes,
      porTipo,
      totalValor: agg._sum.valor ?? 0,
      valorPorTipo,
    };
  }
}
