import { Test, TestingModule } from '@nestjs/testing';
import { DashboardService } from './dashboard.service';
import { PrismaModule } from '../prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';

describe('DashboardService', () => {
  let service: DashboardService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        PrismaModule,
      ],
      providers: [DashboardService],
    }).compile();

    service = module.get<DashboardService>(DashboardService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should fetch stats without throwing errors', async () => {
    const stats = await service.getStats();
    expect(stats).toBeDefined();
    expect(stats.kpis).toBeDefined();
    expect(typeof stats.kpis.totalClients).toBe('number');
    expect(Array.isArray(stats.ordersByStatus)).toBe(true);
    expect(Array.isArray(stats.revenueByDay)).toBe(true);
    expect(Array.isArray(stats.recentOrders)).toBe(true);
    expect(Array.isArray(stats.lowStockItems)).toBe(true);
    
    console.log('Tested Dashboard Stats Output:', JSON.stringify(stats, null, 2));
  });
});
