import { Body, Controller, Get, Post } from '@nestjs/common';
import { Roles } from '../auth/roles.decorator';
import { AdminService } from './admin.service';

@Controller('admin')
@Roles('platform_admin')
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @Get('overview')
  getOverview() {
    return this.admin.getOverview();
  }

  @Post('clinics')
  createClinic(@Body() body: any) {
    return this.admin.createClinic({
      clinicName: body?.clinic_name,
      email: body?.email,
      password: body?.password,
    });
  }
}
