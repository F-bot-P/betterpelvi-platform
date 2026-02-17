// import {
//   Body,
//   Controller,
//   Param,
//   Post,
//   Req,
//   UseGuards,
//   BadRequestException,
//   Get,
// } from '@nestjs/common';
// import { SessionsService } from './sessions.service';
// import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
// import { RolesGuard } from '../auth/roles.guard';
// import { Roles } from '../auth/roles.decorator';

// @UseGuards(SupabaseAuthGuard, RolesGuard)
// @Roles('clinic_admin', 'clinic_staff')
// @Controller('sessions')
// export class SessionsController {
//   constructor(private readonly sessions: SessionsService) {}

//   // POST /sessions/start
//   @Post('start')
//   async start(
//     @Req() req: any,
//     @Body() body: { clientId: string; chairId: string },
//   ) {
//     const clinicId = req.user?.clinicId;
//     if (!clinicId) throw new BadRequestException('Missing clinic context');
//     if (!body?.clientId || !body?.chairId)
//       throw new BadRequestException('clientId and chairId are required');

//     return this.sessions.startAsClinic(clinicId, body.clientId, body.chairId);
//   }

//   // POST /sessions/:id/stop
//   @Post(':id/stop')
//   async stop(@Req() req: any, @Param('id') sessionId: string) {
//     const clinicId = req.user?.clinicId;
//     if (!clinicId) throw new BadRequestException('Missing clinic context');
//     return this.sessions.stopAsClinic(clinicId, sessionId);
//   }

//   // GET /sessions/client/:clientId/history
//   @Get('client/:clientId/history')
//   async history(@Req() req: any, @Param('clientId') clientId: string) {
//     const clinicId = req.user?.clinicId;
//     if (!clinicId) throw new BadRequestException('Missing clinic context');
//     return this.sessions.listClientHistory(clinicId, clientId);
//   }
//   // GET /sessions/active/:clientId
//   @Get('active/:clientId')
//   async active(@Req() req: any, @Param('clientId') clientId: string) {
//     const clinicId = req.user?.clinicId;
//     if (!clinicId) throw new BadRequestException('Missing clinic context');
//     return this.sessions.getActiveSessionForClient(clinicId, clientId);
//   }
// }
import {
  Body,
  Controller,
  Param,
  Post,
  Req,
  UseGuards,
  BadRequestException,
  Get,
} from '@nestjs/common';
import { SessionsService } from './sessions.service';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@UseGuards(SupabaseAuthGuard, RolesGuard)
@Roles('clinic_admin', 'clinic_staff')
@Controller('sessions')
export class SessionsController {
  constructor(private readonly sessions: SessionsService) {}

  // ============================================================
  // ▶️ START SESSION
  // ============================================================
  @Post('start')
  async start(
    @Req() req: any,
    @Body() body: { clientId: string; chairId: string },
  ) {
    const clinicId = req.user?.clinicId;
    if (!clinicId) {
      throw new BadRequestException('Missing clinic context');
    }

    if (!body?.clientId || !body?.chairId) {
      throw new BadRequestException('clientId and chairId are required');
    }

    const session = await this.sessions.startAsClinic(
      clinicId,
      body.clientId,
      body.chairId,
    );

    return { ok: true, session };
  }

  // ============================================================
  // ⏹ STOP SESSION
  // ============================================================
  @Post(':id/stop')
  async stop(@Req() req: any, @Param('id') sessionId: string) {
    const clinicId = req.user?.clinicId;
    if (!clinicId) {
      throw new BadRequestException('Missing clinic context');
    }

    await this.sessions.stopAsClinic(clinicId, sessionId);

    return { ok: true };
  }

  // ============================================================
  // 📜 CLIENT HISTORY
  // ============================================================
  @Get('client/:clientId/history')
  async history(@Req() req: any, @Param('clientId') clientId: string) {
    const clinicId = req.user?.clinicId;
    if (!clinicId) {
      throw new BadRequestException('Missing clinic context');
    }

    const rows = await this.sessions.listClientHistory(clinicId, clientId);
    return Array.isArray(rows) ? rows : [];
  }

  // ============================================================
  // 🔎 ACTIVE SESSION
  // ============================================================
  @Get('active/:clientId')
  async active(@Req() req: any, @Param('clientId') clientId: string) {
    const clinicId = req.user?.clinicId;
    if (!clinicId) {
      throw new BadRequestException('Missing clinic context');
    }

    const session = await this.sessions.getActiveSessionForClient(
      clinicId,
      clientId,
    );

    return { active: session ?? null };
  }
}
   