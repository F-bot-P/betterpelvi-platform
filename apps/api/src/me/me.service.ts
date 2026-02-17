// import { Injectable, UnauthorizedException } from '@nestjs/common';
// import { supabaseAdmin } from '../lib/supabase-admin';

// type ClinicInfo = {
//   id: string;
//   name: string | null;
// };

// @Injectable()
// export class MeService {
//   async getMe(userId: string) {
//     const { data: profile, error } = await supabaseAdmin
//       .from('profiles')
//       .select('id, role, clinic_id')
//       .eq('id', userId)
//       .single();

//     if (error || !profile) {
//       throw new UnauthorizedException('Profile not found');
//     }

//     // ✅ FIX: explicit union type
//     let clinic: ClinicInfo | null = null;

//     if (profile.clinic_id) {
//       const { data } = await supabaseAdmin
//         .from('clinics')
//         .select('id, name')
//         .eq('id', profile.clinic_id)
//         .single();

//       clinic = data ?? null;
//     }

//     return {
//       user_id: profile.id,
//       role: profile.role,
//       clinic,
//     };
//   }
// }

import { Injectable, UnauthorizedException } from '@nestjs/common';

@Injectable()
export class MeService {
  async getMe(user: any) {
    if (!user) {
      throw new UnauthorizedException();
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      clinicId: user.clinicId,
    };
  }
}
