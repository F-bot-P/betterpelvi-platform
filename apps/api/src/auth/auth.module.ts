import { Module } from '@nestjs/common';
import { SupabaseAuthGuard } from './supabase-auth.guard';
import { AuthController } from './auth.controller';
import { ClinicProvisioningService } from './clinic-provisioning.service';
import { RolesGuard } from './roles.guard';

@Module({
  providers: [SupabaseAuthGuard, RolesGuard, ClinicProvisioningService],
  exports: [SupabaseAuthGuard, RolesGuard, ClinicProvisioningService],
  controllers: [AuthController],
})
export class AuthModule {}
