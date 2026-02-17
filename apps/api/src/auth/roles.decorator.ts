import { SetMetadata, applyDecorators, UseGuards } from '@nestjs/common';
import { SupabaseAuthGuard } from './supabase-auth.guard';
import { RolesGuard } from './roles.guard';

export const ROLES_KEY = 'roles';

export function Roles(...roles: string[]) {
  return applyDecorators(
    SetMetadata(ROLES_KEY, roles),
    UseGuards(SupabaseAuthGuard, RolesGuard),
  );
}
