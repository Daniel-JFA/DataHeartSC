import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { CertificatesService } from './certificates.service';
import { CertificatesController } from './certificates.controller';
import { CertificatesProcessor } from './certificates.processor';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { MailerModule } from '../mailer/mailer.module';
import { CERTIFICATES_QUEUE } from './certificates.queue';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    MailerModule,
    BullModule.registerQueue({ name: CERTIFICATES_QUEUE }),
  ],
  providers: [CertificatesService, CertificatesProcessor],
  controllers: [CertificatesController],
  exports: [CertificatesService],
})
export class CertificatesModule {}
