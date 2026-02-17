// // import { Injectable, BadRequestException } from '@nestjs/common';
// // import { supabaseAdmin } from '../lib/supabase-admin';

// // @Injectable()
// // export class ChairsService {
// //   async listForClinic(clinicId: string) {
// //     const { data, error } = await supabaseAdmin
// //       .from('chairs')
// //       .select('id, name, is_active')
// //       .eq('clinic_id', clinicId)
// //       .order('created_at', { ascending: true });

// //     if (error) throw new BadRequestException(error.message);
// //     return data ?? [];
// //   }
// // }
// import { BadRequestException, Injectable } from '@nestjs/common';
// import { supabaseAdmin } from '../lib/supabase-admin';

// @Injectable()
// export class ChairsService {
//   async listForClinic(clinicId: string) {
//     const { data, error } = await supabaseAdmin
//       .from('chairs')
//       .select('id, name, clinic_id, is_active')
//       .eq('clinic_id', clinicId)
//       .order('created_at', { ascending: true });

//     if (error) throw new BadRequestException(error.message);

//     return (data ?? []).filter((c) => c.is_active !== false);
//   }

//   async getDefaultForClinic(clinicId: string) {
//     const list = await this.listForClinic(clinicId);
//     return list[0] ?? null;
//   }
// }

import { BadRequestException, Injectable } from '@nestjs/common';
import { supabaseAdmin } from '../lib/supabase-admin';

@Injectable()
export class ChairsService {
  async listForClinic(clinicId: string) {
    const { data, error } = await supabaseAdmin
      .from('chairs')
      .select('id, name, clinic_id, is_active')
      .eq('clinic_id', clinicId)
      .eq('is_active', true)
      .order('created_at', { ascending: true });

    if (error) {
      throw new BadRequestException(error.message);
    }

    return data ?? [];
  }
}
