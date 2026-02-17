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

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AuthModule,
    MeModule,
    ClientsModule,
    DashboardModule,
    SessionsModule,
    QrModule,
    ChairsModule,
  ],
  providers: [ShellyMqttService],
})
export class AppModule {}
