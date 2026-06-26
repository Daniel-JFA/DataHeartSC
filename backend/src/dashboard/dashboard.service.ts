import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getStats() {
    // 1. KPIs count
    const totalClients = await this.prisma.clientDonor.count();
    const activeClients = await this.prisma.clientDonor.count({
      where: { status: 'Activo' },
    });
    const totalProducts = await this.prisma.product.count();

    // Raw query for low stock products count
    const lowStockProductsResult = await this.prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*)::bigint FROM products WHERE stock < min_stock
    `;
    const lowStockProducts = Number(lowStockProductsResult[0]?.count || 0);

    const totalOrders = await this.prisma.order.count();

    // Revenue aggregations (exclude canceled orders)
    const revenueSum = await this.prisma.order.aggregate({
      _sum: { totalAmount: true },
      where: {
        NOT: { status: 'Cancelado' },
      },
    });
    const totalRevenue = Number(revenueSum._sum.totalAmount || 0);

    const paidSum = await this.prisma.order.aggregate({
      _sum: { totalAmount: true },
      where: {
        paymentStatus: 'Pagado',
        NOT: { status: 'Cancelado' },
      },
    });
    const paidRevenue = Number(paidSum._sum.totalAmount || 0);

    // 2. Orders by Status
    const statusCounts = await this.prisma.order.groupBy({
      by: ['status'],
      _count: { id: true },
    });
    const ordersByStatus = statusCounts.map((sc) => ({
      status: sc.status,
      count: sc._count.id,
    }));

    // 3. Revenue by day (last 30 days) using generate_series for a continuous timeline
    const revenueByDayRaw = await this.prisma.$queryRaw<Array<{ date: string; total: number }>>`
      SELECT 
        gs.date::date::text as date,
        COALESCE(SUM(o.total_amount), 0)::float as total
      FROM generate_series(
        CURRENT_DATE - INTERVAL '29 days',
        CURRENT_DATE,
        '1 day'::interval
      ) gs(date)
      LEFT JOIN orders o ON 
        TO_CHAR(o.order_date, 'YYYY-MM-DD') = TO_CHAR(gs.date, 'YYYY-MM-DD')
        AND o.status != 'Cancelado'
      GROUP BY gs.date
      ORDER BY gs.date ASC
    `;
    const revenueByDay = revenueByDayRaw.map((r) => ({
      date: r.date,
      total: r.total,
    }));

    // 4. Recent Orders
    const recentOrdersRaw = await this.prisma.order.findMany({
      orderBy: { orderDate: 'desc' },
      take: 5,
      include: {
        client: { select: { name: true } },
        _count: { select: { items: true } },
      },
    });
    const recentOrders = recentOrdersRaw.map((o) => ({
      id: o.id,
      orderDate: o.orderDate.toISOString(),
      clientName: o.client?.name || 'Cliente Desconocido',
      totalAmount: Number(o.totalAmount),
      status: o.status,
      paymentStatus: o.paymentStatus,
      itemCount: o._count.items,
    }));

    // 5. Low Stock Items
    const lowStockItemsRaw = await this.prisma.product.findMany({
      where: {
        stock: {
          lt: this.prisma.product.fields.minStock,
        },
      },
      orderBy: { stock: 'asc' },
      take: 5,
      select: {
        id: true,
        name: true,
        sku: true,
        stock: true,
        minStock: true,
      },
    }).catch(async () => {
      // Fallback to raw query if Prisma field comparison is not fully supported in current config/version
      return this.prisma.$queryRaw<Array<{ id: string; name: string; sku: string; stock: number; minStock: number }>>`
        SELECT id, name, sku, stock, min_stock as "minStock" 
        FROM products 
        WHERE stock < min_stock 
        ORDER BY stock ASC 
        LIMIT 5
      `;
    });

    const lowStockItems = lowStockItemsRaw.map((item) => ({
      id: item.id,
      name: item.name,
      sku: item.sku,
      stock: Number(item.stock),
      minStock: Number(item.minStock),
    }));

    return {
      kpis: {
        totalClients,
        activeClients,
        totalProducts,
        lowStockProducts,
        totalOrders,
        totalRevenue,
        paidRevenue,
      },
      ordersByStatus,
      revenueByDay,
      recentOrders,
      lowStockItems,
    };
  }
}
