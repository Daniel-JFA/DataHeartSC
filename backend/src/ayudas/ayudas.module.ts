import { Module } from '@nestjs/common';
import { AyudasController } from './ayudas.controller';
import { AyudasService } from './ayudas.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [AyudasController],
  providers: [AyudasService],
})
export class AyudasModule {}
