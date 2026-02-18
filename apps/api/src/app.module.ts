import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AuthModule } from './auth/auth.module';
import { MeModule } from './me/me.module';
import { ClientsModule } from './clients/clients.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { SessionsModule } from './sessions/sessions.module';
import { QrModule } from './qr/qr.module';
import { ChairsModule } from './chairs/chairs.module';
import { ShellyMqttService } from './lib/shelly-mqtt.service';
import { HealthController } from './health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: 'apps/api/.env' }),
    AuthModule,
    MeModule,
    ClientsModule,
    DashboardModule,
    SessionsModule,
    QrModule,
    ChairsModule,
  ],
  controllers: [HealthController],

  providers: [ShellyMqttService],
})
export class AppModule {}
