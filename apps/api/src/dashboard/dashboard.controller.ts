import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { Roles } from '../auth/roles.decorator';

@UseGuards(SupabaseAuthGuard)
@UseGuards(SupabaseAuthGuard)
@Roles('clinic_admin', 'clinic_staff')
@Controller('dashboard')
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboard: DashboardService) {}

  /**
   * GET /dashboard/clients
   * List clients with credits
   */
  @Get('clients')
  async getClients(@Req() req: any) {
    const clinicId = req.user.clinicId;
    return this.dashboard.getClients(clinicId);
  }

  /**
   * GET /dashboard/sessions
   * List active sessions
   */
  @Get('sessions')
  async getSessions(@Req() req: any) {
    const clinicId = req.user.clinicId;
    return this.dashboard.getActiveSessions(clinicId);
  }
}
