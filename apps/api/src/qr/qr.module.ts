import { Module } from '@nestjs/common';
import { QrController } from './qr.controller';
import { QrService } from './qr.service';
import { SessionsModule } from '../sessions/sessions.module';

@Module({
  controllers: [QrController],
  imports: [SessionsModule],
  providers: [QrService],
})
export class QrModule {}
