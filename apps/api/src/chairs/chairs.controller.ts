// // // import { Controller, Get, Req, UseGuards } from '@nestjs/common';
// // // import { ChairsService } from './chairs.service';

// // // import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
// // // import { Roles } from '../auth/roles.decorator';

// // // @UseGuards(SupabaseAuthGuard)
// // // @Roles('clinic_admin', 'clinic_staff')
// // // @Controller('chairs')
// // // export class ChairsController {
// // //   constructor(private readonly chairsService: ChairsService) {}

// // //   @Get()
// // //   list(@Req() req: any) {
// // //     return this.chairsService.listForClinic(req.user.clinicId);
// // //   }
// // // }
// // import { Controller, Get, Req, UseGuards } from '@nestjs/common';
// // import { ChairsService } from './chairs.service';
// // import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
// // import { RolesGuard } from '../auth/roles.guard';
// // import { Roles } from '../auth/roles.decorator';

// // @UseGuards(SupabaseAuthGuard, RolesGuard)
// // @Roles('clinic_admin', 'clinic_staff')
// // @Controller('chairs')
// // export class ChairsController {
// //   constructor(private readonly chairs: ChairsService) {}

// //   @Get()
// //   list(@Req() req: any) {
// //     return this.chairs.listForClinic(req.user.clinicId);
// //   }

// //   @Get('default')
// //   default(@Req() req: any) {
// //     return this.chairs.getDefaultForClinic(req.user.clinicId);
// //   }
// // }
// import { Controller, Get, Req, UseGuards } from '@nestjs/common';
// import { ChairsService } from './chairs.service';
// import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
// import { RolesGuard } from '../auth/roles.guard';
// import { Roles } from '../auth/roles.decorator';

// @UseGuards(SupabaseAuthGuard, RolesGuard)
// @Roles('clinic_admin', 'clinic_staff')
// @Controller('chairs')
// export class ChairsController {
//   constructor(private readonly chairs: ChairsService) {}

//   @Get()
//   async list(@Req() req: any) {
//     const data = await this.chairs.listForClinic(req.user.clinicId);
//     return Array.isArray(data) ? data : [];
//   }

//   @Get('default')
//   async default(@Req() req: any) {
//     const chair = await this.chairs.getDefaultForClinic(req.user.clinicId);

//     // 🔒 GUARANTEE JSON
//     return chair ? chair : { id: null };
//   }
// }
import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ChairsService } from './chairs.service';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@UseGuards(SupabaseAuthGuard, RolesGuard)
@Roles('clinic_admin', 'clinic_staff')
@Controller('chairs')
export class ChairsController {
  constructor(private readonly chairs: ChairsService) {}

  /**
   * GET /chairs
   * Returns all active chairs for this clinic
   */
  @Get()
  async list(@Req() req: any) {
    return this.chairs.listForClinic(req.user.clinicId);
  }

  /**
   * GET /chairs/default
   * TEMPORARY compatibility endpoint
   * Returns first chair or null
   */
  @Get('default')
  async default(@Req() req: any) {
    const chairs = await this.chairs.listForClinic(req.user.clinicId);
    return chairs[0] ?? null;
  }

  @Get(':id')
  async getOne(@Req() req: any, @Param('id') id: string) {
    return this.chairs.getForClinic(req.user.clinicId, id);
  }

  /**
   * PATCH /chairs/:id/pair
   * Save Shelly/MQTT device configuration for a chair
   */
  @Patch(':id/pair')
  async pair(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    return this.chairs.pairForClinic(req.user.clinicId, id, body);
  }
}
