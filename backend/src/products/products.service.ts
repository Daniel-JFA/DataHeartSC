import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

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
        select: { id: true, name: true, sku: true, stock: true, minStock: true, price: true, isActive: true, categoryName: true },
      }),
      this.prisma.product.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
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
}
