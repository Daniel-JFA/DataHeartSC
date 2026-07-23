import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class VolunteersService {
  constructor(private prisma: PrismaService) {}

  async findAll(page = 1, limit = 20, search?: string, status?: string) {
    const where: any = {};

    if (search) {
      where.OR = [
        { firstName:  { contains: search, mode: 'insensitive' } },
        { lastName:   { contains: search, mode: 'insensitive' } },
        { docNumber:  { contains: search, mode: 'insensitive' } },
        { email:      { contains: search, mode: 'insensitive' } },
        { occupation: { contains: search, mode: 'insensitive' } },
        { city:       { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status) where.status = status;

    const [data, total] = await this.prisma.$transaction([
      this.prisma.volunteer.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { joinDate: 'desc' },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          docType: true,
          docNumber: true,
          email: true,
          phone: true,
          city: true,
          department: true,
          occupation: true,
          segment: true,
          shirtSize: true,
          availability: true,
          status: true,
          joinDate: true,
          _count: { select: { supports: true } },
        },
      }),
      this.prisma.volunteer.count({ where }),
    ]);

    // Conteos por estado para KPIs
    const [activos, inactivos] = await this.prisma.$transaction([
      this.prisma.volunteer.count({ where: { status: 'Activo' } }),
      this.prisma.volunteer.count({ where: { status: 'Inactivo' } }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      kpis: { activos, inactivos },
    };
  }

  async findOne(id: string) {
    return this.prisma.volunteer.findUnique({
      where: { id },
      include: {
        supports: {
          orderBy: { date: 'desc' },
          take: 50,
        },
      },
    });
  }

  async updateStatus(id: string, status: string) {
    return this.prisma.volunteer.update({
      where: { id },
      data: { status },
    });
  }

  async findSupports(page = 1, limit = 20, search?: string, type?: string) {
    const where: any = {};

    if (search) {
      where.volunteer = {
        OR: [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName:  { contains: search, mode: 'insensitive' } },
          { docNumber: { contains: search, mode: 'insensitive' } },
        ],
      };
    }

    if (type) where.type = type;

    const [data, total] = await this.prisma.$transaction([
      this.prisma.volunteerSupport.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { date: 'desc' },
        include: {
          volunteer: {
            select: { id: true, firstName: true, lastName: true, docNumber: true },
          },
        },
      }),
      this.prisma.volunteerSupport.count({ where }),
    ]);

    // KPIs globales (sin filtros)
    const agg = await this.prisma.volunteerSupport.aggregate({
      _sum: { hours: true, mealValue: true },
      _count: { id: true },
    });

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      kpis: {
        totalApoyos:      agg._count.id,
        totalHoras:       agg._sum.hours ?? 0,
        totalAlimentacion: Number(agg._sum.mealValue ?? 0),
      },
    };
  }
}
