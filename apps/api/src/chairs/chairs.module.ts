import { Module } from '@nestjs/common';
import { ChairsController } from './chairs.controller';
import { ChairsService } from './chairs.service';

@Module({
  controllers: [ChairsController],
  providers: [ChairsService],
  exports: [ChairsService],
})
export class ChairsModule {}
