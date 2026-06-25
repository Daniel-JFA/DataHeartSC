import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';

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
}
