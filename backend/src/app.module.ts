import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ClientsModule } from './clients/clients.module';
import { ProductsModule } from './products/products.module';
import { OrdersModule } from './orders/orders.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { DonationsModule } from './donations/donations.module';
import { ProvidersModule } from './providers/providers.module';
import { BeneficiariesModule } from './beneficiaries/beneficiaries.module';
import { AyudasModule } from './ayudas/ayudas.module';
import { WebhooksModule } from './webhooks/webhooks.module';
import { CertificatesModule } from './certificates/certificates.module';
import { MailerModule } from './mailer/mailer.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    ClientsModule,
    ProductsModule,
    OrdersModule,
    DashboardModule,
    DonationsModule,
    ProvidersModule,
    BeneficiariesModule,
    AyudasModule,
    WebhooksModule,
    CertificatesModule,
    MailerModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
