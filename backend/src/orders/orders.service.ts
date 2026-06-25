import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { Decimal } from '@prisma/client/runtime/client';
import * as ExcelJS from 'exceljs';

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  async findAll(page = 1, limit = 20, search = '', status = '', source = '') {
    const skip = (page - 1) * limit;
    const where: any = {};
    if (status) where.status = status;
    if (source) where.source = source;
    if (search) {
      where.OR = [
        { client: { name:      { contains: search, mode: 'insensitive' } } },
        { client: { docNumber: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [data, total] = await this.prisma.$transaction([
      this.prisma.order.findMany({
        where, skip, take: limit,
        orderBy: { orderDate: 'desc' },
        include: {
          client: { select: { id: true, name: true, docNumber: true, docType: true, phone: true } },
          items:  { include: { product: { select: { id: true, name: true, sku: true } } } },
        },
      }),
      this.prisma.order.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        client: true,
        items:  { include: { product: true } },
        createdByUser: { select: { firstName: true, lastName: true, email: true } },
      },
    });
    if (!order) throw new NotFoundException(`Pedido ${id} no encontrado`);
    return order;
  }

  async create(dto: CreateOrderDto, userId: string) {
    if (!dto.items?.length) throw new BadRequestException('El pedido debe tener al menos un producto');

    // Validate client
    const client = await this.prisma.clientDonor.findUnique({ where: { id: dto.clientId } });
    if (!client) throw new NotFoundException(`Cliente ${dto.clientId} no encontrado`);

    // Load products and calculate totals server-side
    const productIds = dto.items.map(i => i.productId);
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds }, isActive: true },
    });

    if (products.length !== productIds.length) {
      const missing = productIds.filter(id => !products.find(p => p.id === id));
      throw new BadRequestException(`Productos no encontrados o inactivos: ${missing.join(', ')}`);
    }

    const productMap = new Map(products.map(p => [p.id, p]));
    let totalAmount = new Decimal(0);

    const itemsData = dto.items.map(item => {
      const product = productMap.get(item.productId)!;
      const unitPrice = product.price;
      const subtotal  = unitPrice.mul(item.quantity);
      totalAmount     = totalAmount.add(subtotal);
      return {
        productId: item.productId,
        quantity:  item.quantity,
        unitPrice,
        subtotal,
      };
    });

    return this.prisma.order.create({
      data: {
        clientId:        dto.clientId,
        source:          dto.source ?? 'Manual',
        paymentStatus:   dto.paymentStatus ?? 'Pendiente',
        totalAmount,
        createdByUserId: userId,
        items: { create: itemsData },
      },
      include: {
        client: { select: { name: true, docNumber: true } },
        items:  { include: { product: { select: { name: true, sku: true } } } },
      },
    });
  }

  async updateStatus(id: string, dto: UpdateOrderDto) {
    await this.findOne(id);
    return this.prisma.order.update({
      where: { id },
      data: dto,
      include: { client: { select: { name: true } } },
    });
  }

  // ── WORLD OFFICE EXPORT ──────────────────────────────────
  async exportToExcel(from?: string, to?: string) {
    const where: any = { status: { not: 'Cancelado' } };
    if (from || to) {
      where.orderDate = {};
      if (from) where.orderDate.gte = new Date(from);
      if (to)   where.orderDate.lte = new Date(to + 'T23:59:59');
    }

    const orders = await this.prisma.order.findMany({
      where,
      orderBy: { orderDate: 'asc' },
      include: {
        client: true,
        items:  { include: { product: true } },
      },
    });

    // ExcelJS workbook
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'DataHeartSC';
    workbook.created = new Date();

    // ── Hoja 1: Encabezados de pedidos (World Office compatible) ──
    const ws = workbook.addWorksheet('Pedidos_WorldOffice');
    ws.columns = [
      { header: 'Nro_Comprobante', key: 'nro',          width: 16 },
      { header: 'Fecha',           key: 'fecha',         width: 14 },
      { header: 'Tipo',            key: 'tipo',          width: 10 },
      { header: 'Canal',           key: 'canal',         width: 14 },
      { header: 'Tipo_Doc_Ter',    key: 'tipoDocTer',    width: 12 },
      { header: 'Nro_Doc_Ter',     key: 'nroDocTer',     width: 16 },
      { header: 'Nombre_Tercero',  key: 'nombreTercero', width: 36 },
      { header: 'Telefono',        key: 'telefono',      width: 16 },
      { header: 'Ciudad',          key: 'ciudad',        width: 16 },
      { header: 'Cod_Producto',    key: 'codProducto',   width: 16 },
      { header: 'Descripcion',     key: 'descripcion',   width: 36 },
      { header: 'Cantidad',        key: 'cantidad',      width: 10 },
      { header: 'Vlr_Unitario',    key: 'vlrUnitario',   width: 14 },
      { header: 'Subtotal',        key: 'subtotal',      width: 14 },
      { header: 'Total_Pedido',    key: 'totalPedido',   width: 14 },
      { header: 'Estado_Pedido',   key: 'estadoPedido',  width: 16 },
      { header: 'Estado_Pago',     key: 'estadoPago',    width: 14 },
    ];

    // Style header row
    ws.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    ws.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };

    orders.forEach(order => {
      const fecha = new Date(order.orderDate).toLocaleDateString('es-CO');
      order.items.forEach((item, idx) => {
        ws.addRow({
          nro:           order.id.slice(-8).toUpperCase(),
          fecha,
          tipo:          'VENTA',
          canal:         order.source,
          tipoDocTer:    order.client.docType,
          nroDocTer:     order.client.docNumber,
          nombreTercero: order.client.name,
          telefono:      order.client.phone ?? '',
          ciudad:        order.client.city ?? '',
          codProducto:   item.product.sku,
          descripcion:   item.product.name,
          cantidad:      item.quantity,
          vlrUnitario:   Number(item.unitPrice),
          subtotal:      Number(item.subtotal),
          totalPedido:   idx === 0 ? Number(order.totalAmount) : '',
          estadoPedido:  order.status,
          estadoPago:    order.paymentStatus,
        });
      });
    });

    // Alternate row colors
    ws.eachRow((row, n) => {
      if (n > 1) {
        row.fill = {
          type: 'pattern', pattern: 'solid',
          fgColor: { argb: n % 2 === 0 ? 'FFF8FAFC' : 'FFFFFFFF' },
        };
      }
      row.border = {
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      };
    });

    // ── Hoja 2: Resumen ──
    const ws2 = workbook.addWorksheet('Resumen');
    ws2.getColumn(1).width = 28;
    ws2.getColumn(2).width = 18;
    const totalGeneral = orders.reduce((s, o) => s + Number(o.totalAmount), 0);
    const pagados  = orders.filter(o => o.paymentStatus === 'Pagado').reduce((s, o) => s + Number(o.totalAmount), 0);
    const pending  = orders.filter(o => o.paymentStatus === 'Pendiente').reduce((s, o) => s + Number(o.totalAmount), 0);
    [
      ['Exportado por',     'DataHeartSC'],
      ['Fecha exportación', new Date().toLocaleDateString('es-CO')],
      ['Período',           `${from ?? 'inicio'} — ${to ?? 'hoy'}`],
      ['Total pedidos',     orders.length],
      ['Total ítems',       orders.flatMap(o => o.items).length],
      ['Total general',     `$${totalGeneral.toLocaleString('es-CO')}`],
      ['Total pagado',      `$${pagados.toLocaleString('es-CO')}`],
      ['Total pendiente',   `$${pending.toLocaleString('es-CO')}`],
    ].forEach(([k, v]) => ws2.addRow([k, v]));

    return workbook.xlsx.writeBuffer();
  }
}
