import { Module } from '@nestjs/common';
import { SessionsService } from './sessions.service';
import { SessionsController } from './sessions.controller';
import { ShellyMqttService } from '../lib/shelly-mqtt.service';

@Module({
  controllers: [SessionsController],
  providers: [SessionsService, ShellyMqttService],
  exports: [SessionsService], //
})
export class SessionsModule {}
