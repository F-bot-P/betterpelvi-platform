import { Controller, Get, Param, Post } from '@nestjs/common';
import { QrService } from './qr.service';
import { Public } from '../auth/public.decorator';

@Controller('qr')
export class QrController {
  constructor(private readonly qr: QrService) {}

  @Public()
  @Get(':token')
  get(@Param('token') token: string) {
    return this.qr.getByToken(token);
  }

  @Public()
  @Post(':token/start')
  start(@Param('token') token: string) {
    return this.qr.startByQr(token);
  }

  @Public()
  @Post(':token/stop')
  stop(@Param('token') token: string) {
    return this.qr.stopByQr(token);
  }
  @Post('client/:clientId')
  createClientQr(@Param('clientId') clientId: string) {
    return this.qr.createQrForClient(clientId);
  }
}
