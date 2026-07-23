import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';

export interface SegmentFilters {
  city?: string;
  hasEmail?: boolean;
  hasPhone?: boolean;
  hasDonations?: boolean;
  hasOrders?: boolean;
  status?: string;
  page?: number;
  limit?: number;
}

@Injectable()
export class ClientsService {
  constructor(private prisma: PrismaService) {}

  async findAll(page = 1, limit = 20, search = '') {
    const skip = (page - 1) * limit;
    const where = search
      ? {
          OR: [
            { name:      { contains: search, mode: 'insensitive' as const } },
            { docNumber: { contains: search, mode: 'insensitive' as const } },
            { email:     { contains: search, mode: 'insensitive' as const } },
            { city:      { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const [data, total] = await this.prisma.$transaction([
      this.prisma.clientDonor.findMany({
        where, skip, take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true, name: true, docType: true, docNumber: true,
          phone: true, email: true, city: true, status: true, createdAt: true,
          _count: { select: { orders: true, donations: true } },
        },
      }),
      this.prisma.clientDonor.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string) {
    const client = await this.prisma.clientDonor.findUnique({
      where: { id },
      include: {
        orders:    { orderBy: { orderDate: 'desc' }, take: 5, select: { id: true, orderDate: true, status: true, totalAmount: true, source: true } },
        donations: { orderBy: { date: 'desc' },      take: 5, select: { id: true, date: true, amount: true, paymentGateway: true, status: true } },
      },
    });
    if (!client) throw new NotFoundException(`Cliente ${id} no encontrado`);
    return client;
  }

  async create(dto: CreateClientDto) {
    const exists = await this.prisma.clientDonor.findUnique({ where: { docNumber: dto.docNumber } });
    if (exists) throw new ConflictException(`Ya existe un cliente con documento ${dto.docNumber}`);
    return this.prisma.clientDonor.create({ data: dto });
  }

  async update(id: string, dto: UpdateClientDto) {
    await this.findOne(id);
    if (dto.docNumber) {
      const conflict = await this.prisma.clientDonor.findFirst({ where: { docNumber: dto.docNumber, NOT: { id } } });
      if (conflict) throw new ConflictException(`El documento ${dto.docNumber} pertenece a otro cliente`);
    }
    return this.prisma.clientDonor.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.clientDonor.update({ where: { id }, data: { status: 'Inactivo' } });
  }

  async segment(filters: SegmentFilters) {
    const {
      city, hasEmail, hasPhone, hasDonations, hasOrders, status,
      page = 1, limit = 20,
    } = filters;

    const where: Record<string, unknown> = {};

    if (city)   where['city']  = { contains: city, mode: 'insensitive' };
    if (status) where['status'] = status;
    if (hasEmail)  where['email'] = { not: null };
    if (hasPhone)  where['phone'] = { not: null };
    if (hasDonations) where['donations'] = { some: {} };
    if (hasOrders)    where['orders']    = { some: {} };

    const skip = (page - 1) * limit;

    const [data, total] = await this.prisma.$transaction([
      this.prisma.clientDonor.findMany({
        where, skip, take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true, name: true, docType: true, docNumber: true,
          phone: true, email: true, city: true, status: true, createdAt: true,
          _count: { select: { orders: true, donations: true } },
        },
      }),
      this.prisma.clientDonor.count({ where }),
    ]);

    // KPI: total con email dentro del segmento
    const conEmail = await this.prisma.clientDonor.count({
      where: { ...where, email: { not: null } },
    });

    // KPI: total con teléfono dentro del segmento
    const conTelefono = await this.prisma.clientDonor.count({
      where: { ...where, phone: { not: null } },
    });

    // Top-10 ciudades dentro del segmento
    const ciudadesRaw = await this.prisma.clientDonor.groupBy({
      by: ['city'],
      where: { ...where, city: { not: null } },
      _count: { city: true },
      orderBy: { _count: { city: 'desc' } },
      take: 10,
    });

    const ciudades = ciudadesRaw.map(c => ({ city: c.city, count: c._count.city }));

    return {
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      kpis: { conEmail, conTelefono, ciudades },
    };
  }
}
