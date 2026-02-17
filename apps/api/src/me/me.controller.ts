import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { MeService } from './me.service';

@UseGuards(SupabaseAuthGuard)
@Controller('me')
export class MeController {
  constructor(private readonly me: MeService) {}

  @Get()
  getMe(@Req() req: any) {
    return this.me.getMe(req.user);
  }
}
