import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { CreateDonationDto } from './dto/create-donation.dto';

@Injectable()
export class DonationsService {
  constructor(private prisma: PrismaService) {}

  async findAll(
    page = 1,
    limit = 20,
    search = '',
    gateway?: string,
    status?: string,
  ) {
    const skip = (page - 1) * limit;

    const where: Prisma.DonationWhereInput = {};

    if (search) {
      where.OR = [
        { transactionId: { contains: search, mode: 'insensitive' } },
        { campaign: { contains: search, mode: 'insensitive' } },
        { concept: { contains: search, mode: 'insensitive' } },
        { client: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    if (gateway) {
      where.paymentGateway = { equals: gateway, mode: 'insensitive' };
    }

    if (status) {
      where.status = { equals: status, mode: 'insensitive' };
    }

    const [data, total] = await this.prisma.$transaction([
      this.prisma.donation.findMany({
        where,
        skip,
        take: limit,
        orderBy: { date: 'desc' },
        include: {
          client: {
            select: { id: true, name: true, docNumber: true },
          },
        },
      }),
      this.prisma.donation.count({ where }),
    ]);

    return { data, total, page, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string) {
    const donation = await this.prisma.donation.findUnique({
      where: { id },
      include: {
        client: {
          select: { id: true, name: true, docNumber: true },
        },
        certificates: true,
      },
    });
    if (!donation) throw new NotFoundException(`Donación ${id} no encontrada`);
    return donation;
  }

  async create(dto: CreateDonationDto) {
    const existing = await this.prisma.donation.findUnique({
      where: { transactionId: dto.transactionId },
    });
    if (existing) {
      throw new ConflictException(
        `Ya existe una donación con transactionId ${dto.transactionId}`,
      );
    }

    const data: Prisma.DonationCreateInput = {
      amount: new Prisma.Decimal(dto.amount),
      paymentGateway: dto.paymentGateway,
      transactionId: dto.transactionId,
      status: dto.status ?? 'Approved',
      campaign: dto.campaign,
      concept: dto.concept,
      client: { connect: { id: dto.clientId } },
    };

    if (dto.date) {
      data.date = new Date(dto.date);
    }

    return this.prisma.donation.create({ data });
  }

  async updateStatus(id: string, status: string) {
    await this.findOne(id);
    return this.prisma.donation.update({
      where: { id },
      data: { status },
    });
  }

  async getStats() {
    const [totalDonations, amountAgg, byGateway, byStatus] = await Promise.all([
      this.prisma.donation.count(),
      this.prisma.donation.aggregate({ _sum: { amount: true } }),
      this.prisma.donation.groupBy({
        by: ['paymentGateway'],
        _count: { id: true },
        _sum: { amount: true },
      }),
      this.prisma.donation.groupBy({
        by: ['status'],
        _count: { id: true },
      }),
    ]);

    const approvedAgg = await this.prisma.donation.aggregate({
      where: { status: 'Approved' },
      _sum: { amount: true },
    });

    const pendingAgg = await this.prisma.donation.aggregate({
      where: { status: 'Pending' },
      _sum: { amount: true },
    });

    return {
      totalDonations,
      totalAmount: amountAgg._sum.amount ?? 0,
      approvedAmount: approvedAgg._sum.amount ?? 0,
      pendingAmount: pendingAgg._sum.amount ?? 0,
      byGateway: byGateway.map((g) => ({
        gateway: g.paymentGateway,
        count: g._count.id,
        amount: g._sum.amount ?? 0,
      })),
      byStatus: byStatus.map((s) => ({
        status: s.status,
        count: s._count.id,
      })),
    };
  }
}
