import { Module } from '@nestjs/common';
import { SupabaseAuthGuard } from './supabase-auth.guard';
import { AuthController } from './auth.controller';

@Module({
  providers: [SupabaseAuthGuard],
  exports: [SupabaseAuthGuard],
  controllers: [AuthController],
})
export class AuthModule {}
