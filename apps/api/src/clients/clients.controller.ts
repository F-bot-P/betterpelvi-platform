import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';
import { ClientsService } from './clients.service';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@UseGuards(SupabaseAuthGuard, RolesGuard)
@Roles('clinic_admin', 'clinic_staff')
@Controller('clients')
export class ClientsController {
  constructor(private readonly clients: ClientsService) {}

  // GET /clients?q=...
  @Get()
  async list(@Req() req: any, @Query('q') q?: string) {
    const clinicId = req.user.clinicId;
    return this.clients.listClients(clinicId, q);
  }

  // GET /clients/:id
  @Get(':id')
  async get(@Req() req: any, @Param('id') id: string) {
    const clinicId = req.user.clinicId;
    return this.clients.getClient(clinicId, id);
  }

  // POST /clients
  @Post()
  async create(@Req() req: any, @Body() body: any) {
    const clinicId = req.user.clinicId;

    if (!body?.full_name || !body.full_name.trim()) {
      throw new BadRequestException('full_name is required');
    }

    return this.clients.createClient(clinicId, body);
  }

  // PATCH /clients/:id
  @Patch(':id')
  async update(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    const clinicId = req.user.clinicId;
    return this.clients.updateClient(clinicId, id, body);
  }

  // DELETE /clients/:id
  @Delete(':id')
  async delete(@Req() req: any, @Param('id') id: string) {
    const clinicId = req.user.clinicId;
    return this.clients.deleteClient(clinicId, id);
  }

  // POST /clients/:id/credits
  @Post(':id/credits')
  async adjustCredits(
    @Req() req: any,
    @Param('id') id: string,
    @Body('amount') amount: number,
  ) {
    const clinicId = req.user.clinicId;

    if (![10, -10, 1, -1].includes(amount)) {
      throw new BadRequestException('amount must be one of: -10, -1, 1, 10');
    }

    return this.clients.adjustCredits(clinicId, id, amount as any);
  }
}
