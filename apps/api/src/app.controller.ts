import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { SupabaseAuthGuard } from './auth/supabase.guard';

@Controller()
export class AppController {
  @Get('me')
  @UseGuards(SupabaseAuthGuard)
  getMe(@Req() req) {
    return {
      userId: req.user.id,
      email: req.user.email,
    };
  }
}
