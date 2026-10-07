import { BadRequestException, Injectable } from '@nestjs/common';
import { supabaseAdmin } from '../lib/supabase-admin';

export type CreateClinicAccountInput = {
  clinicName: string;
  email: string;
  password: string;
};

@Injectable()
export class ClinicProvisioningService {
  async createClinicAccount(input: CreateClinicAccountInput) {
    const clinicName = input.clinicName?.trim();
    const email = input.email?.trim().toLowerCase();
    const password = input.password ?? '';

    if (!clinicName || !email || !password) {
      throw new BadRequestException('Clinic name, administrator email, and password are required.');
    }

    if (!email.includes('@')) {
      throw new BadRequestException('Enter a valid administrator email address.');
    }

    if (password.length < 8) {
      throw new BadRequestException('Temporary password must be at least 8 characters.');
    }

    let userId: string | null = null;
    let clinicId: string | null = null;

    try {
      const { data: userData, error: authError } =
        await supabaseAdmin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
        });

      if (authError || !userData?.user) {
        throw new BadRequestException(authError?.message || 'Unable to create the clinic administrator.');
      }

      userId = userData.user.id;

      const { data: clinic, error: clinicError } = await supabaseAdmin
        .from('clinics')
        .insert({ name: clinicName })
        .select('id, name, created_at')
        .single();

      if (clinicError || !clinic?.id) {
        throw new BadRequestException(clinicError?.message || 'Unable to create the clinic.');
      }

      clinicId = clinic.id;

      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .upsert(
          { id: userId, role: 'clinic_admin', clinic_id: clinicId },
          { onConflict: 'id' },
        );

      if (profileError) {
        throw new BadRequestException(profileError.message);
      }

      const { error: chairError } = await supabaseAdmin.from('chairs').insert({
        clinic_id: clinicId,
        name: 'Chair 1',
        is_active: true,
      });

      if (chairError) {
        throw new BadRequestException(chairError.message);
      }

      return {
        ok: true,
        clinic: {
          id: clinic.id,
          name: clinic.name,
          created_at: clinic.created_at,
        },
      };
    } catch (error) {
      // Never leave a partially provisioned clinic account behind.
      if (clinicId) {
        await supabaseAdmin.from('clinics').delete().eq('id', clinicId);
      }
      if (userId) {
        await supabaseAdmin.auth.admin.deleteUser(userId);
      }
      throw error;
    }
  }
}
