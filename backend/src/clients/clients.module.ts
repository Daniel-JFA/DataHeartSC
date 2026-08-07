import { Module } from '@nestjs/common';
import { ClientsController } from './clients.controller';
import { ClientsService } from './clients.service';
import { AuthModule } from '../auth/auth.module';
import { MailerModule } from '../mailer/mailer.module';

@Module({
  imports: [AuthModule, MailerModule],
  controllers: [ClientsController],
  providers: [ClientsService],
})
export class ClientsModule {}
