import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { CreateStockMovementDto } from './dto/create-stock-movement.dto';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async findAll(page = 1, limit = 20, search = '', onlyActive = false, categoryName = '') {
    const skip = (page - 1) * limit;
    const where: Record<string, unknown> = {};
    if (onlyActive) where['isActive'] = true;
    if (categoryName) where['categoryName'] = categoryName;
    if (search) {
      where['OR'] = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku:  { contains: search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        where, skip, take: limit,
        orderBy: { name: 'asc' },
        select: { id: true, name: true, sku: true, stock: true, minStock: true, price: true, isActive: true, categoryName: true, subcategoryName: true },
      }),
      this.prisma.product.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getCategoryStats(onlyActive = true) {
    const rows = await this.prisma.product.groupBy({
      by: ['categoryName'],
      where: onlyActive ? { isActive: true } : undefined,
      _count: { id: true },
      orderBy: { categoryName: 'asc' },
    });
    return rows.map(r => ({
      name: r.categoryName ?? 'Sin categoría',
      total: r._count.id,
    }));
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: { inputs: { include: { input: true } } },
    });
    if (!product) throw new NotFoundException(`Producto ${id} no encontrado`);
    return product;
  }

  async create(dto: CreateProductDto) {
    const exists = await this.prisma.product.findUnique({ where: { sku: dto.sku } });
    if (exists) throw new ConflictException(`Ya existe un producto con SKU ${dto.sku}`);
    return this.prisma.product.create({ data: { ...dto, price: dto.price } });
  }

  async update(id: string, dto: UpdateProductDto) {
    await this.findOne(id);
    if (dto.sku) {
      const conflict = await this.prisma.product.findFirst({ where: { sku: dto.sku, NOT: { id } } });
      if (conflict) throw new ConflictException(`El SKU ${dto.sku} pertenece a otro producto`);
    }
    return this.prisma.product.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.product.update({ where: { id }, data: { isActive: false } });
  }

  async toggleActive(id: string) {
    const product = await this.findOne(id);
    return this.prisma.product.update({
      where: { id },
      data: { isActive: !product.isActive },
      select: { id: true, isActive: true },
    });
  }

  async stockMovement(id: string, dto: CreateStockMovementDto, userId: string) {
    const product = await this.findOne(id);

    const delta = dto.movementType === 'Entrada' ? dto.quantity : -dto.quantity;
    const newStock = product.stock + delta;

    if (dto.movementType === 'Salida' && newStock < 0) {
      throw new BadRequestException(
        `Stock insuficiente. Stock actual: ${product.stock}, solicitado: ${dto.quantity}`,
      );
    }

    const [updated] = await this.prisma.$transaction([
      this.prisma.product.update({
        where: { id },
        data: { stock: newStock },
        select: { id: true, name: true, sku: true, stock: true, minStock: true, price: true, isActive: true, categoryName: true, subcategoryName: true },
      }),
      this.prisma.inventoryMovement.create({
        data: {
          itemType: 'Producto',
          productId: id,
          movementType: dto.movementType,
          quantity: dto.quantity,
          userId,
          description: dto.description ?? null,
        },
      }),
    ]);

    return updated;
  }
}
