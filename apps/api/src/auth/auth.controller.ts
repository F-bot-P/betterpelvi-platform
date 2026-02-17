// // // import { Body, Controller, Post, BadRequestException } from '@nestjs/common';
// // // import { supabaseAdmin } from '../lib/supabase-admin';

// // // @Controller('auth')
// // // export class AuthController {
// // //   @Post('clinic-signup')
// // //   async clinicSignup(@Body() body: any) {
// // //     const { email, password, clinic_name } = body;

// // //     if (!email || !password || !clinic_name) {
// // //       throw new BadRequestException('Missing fields');
// // //     }

// // //     // 1️⃣ Create auth user
// // //     const { data: userData, error: authErr } =
// // //       await supabaseAdmin.auth.admin.createUser({
// // //         email,
// // //         password,
// // //         email_confirm: true,
// // //       });

// // //     if (authErr || !userData.user) {
// // //       throw new BadRequestException(authErr?.message || 'Auth failed');
// // //     }

// // //     const userId = userData.user.id;

// // //     // 2️⃣ Create clinic
// // //     const { data: clinic, error: clinicErr } = await supabaseAdmin
// // //       .from('clinics')
// // //       .insert({ name: clinic_name })
// // //       .select('id')
// // //       .single();

// // //     if (clinicErr) {
// // //       throw new BadRequestException(clinicErr.message);
// // //     }

// // //     // 3️⃣ Create profile (THIS IS THE MISSING PIECE)
// // //     const { error: profileErr } = await supabaseAdmin.from('profiles').insert({
// // //       id: userId,
// // //       role: 'clinic_admin',
// // //       clinic_id: clinic.id,
// // //     });

// // //     if (profileErr) {
// // //       throw new BadRequestException(profileErr.message);
// // //     }

// // //     return { ok: true };
// // //   }
// // // }
// // import { Body, Controller, Post, BadRequestException } from '@nestjs/common';
// // import { supabaseAdmin } from '../lib/supabase-admin';

// // @Controller('auth')
// // export class AuthController {
// //   @Post('clinic-signup')
// //   async clinicSignup(@Body() body: any) {
// //     const { email, password, clinic_name } = body;

// //     if (!email || !password || !clinic_name) {
// //       throw new BadRequestException('Missing fields');
// //     }

// //     // 1️⃣ Create or fetch auth user
// //     const { data: userData, error: authErr } =
// //       await supabaseAdmin.auth.admin.createUser({
// //         email,
// //         password,
// //         email_confirm: true,
// //       });

// //     if (authErr || !userData?.user) {
// //       throw new BadRequestException(authErr?.message || 'Auth failed');
// //     }

// //     const userId = userData.user.id;

// //     // 2️⃣ Create clinic
// //     const { data: clinic, error: clinicErr } = await supabaseAdmin
// //       .from('clinics')
// //       .insert({ name: clinic_name })
// //       .select('id')
// //       .single();

// //     if (clinicErr || !clinic) {
// //       throw new BadRequestException(
// //         clinicErr?.message || 'Clinic create failed',
// //       );
// //     }

// //     // 3️⃣ UPSERT profile (THIS FIXES YOUR ERROR)
// //     const { error: profileErr } = await supabaseAdmin.from('profiles').upsert(
// //       {
// //         id: userId,
// //         role: 'clinic_admin',
// //         clinic_id: clinic.id,
// //       },
// //       { onConflict: 'id' },
// //     );

// //     if (profileErr) {
// //       throw new BadRequestException(profileErr.message);
// //     }

// //     return { ok: true };
// //   }
// // }

// import { Body, Controller, Post, BadRequestException } from '@nestjs/common';
// import { supabaseAdmin } from '../lib/supabase-admin';

// @Controller('auth')
// export class AuthController {
//   @Post('clinic-signup')
//   async clinicSignup(@Body() body: any) {
//     const { email, password, clinic_name } = body;

//     if (!email || !password || !clinic_name) {
//       throw new BadRequestException('Missing fields');
//     }

//     // 1️⃣ Create auth user
//     const { data: userData, error: authErr } =
//       await supabaseAdmin.auth.admin.createUser({
//         email,
//         password,
//         email_confirm: true,
//       });

//     if (authErr || !userData?.user) {
//       throw new BadRequestException(authErr?.message || 'Auth failed');
//     }

//     const userId = userData.user.id;

//     // 2️⃣ Create clinic
//     const { data: clinic, error: clinicErr } = await supabaseAdmin
//       .from('clinics')
//       .insert({ name: clinic_name })
//       .select('id')
//       .single();

//     if (clinicErr || !clinic) {
//       throw new BadRequestException(
//         clinicErr?.message || 'Clinic create failed',
//       );
//     }

//     // 3️⃣ Upsert profile (idempotent)
//     const { error: profileErr } = await supabaseAdmin.from('profiles').upsert(
//       {
//         id: userId,
//         role: 'clinic_admin',
//         clinic_id: clinic.id,
//       },
//       { onConflict: 'id' },
//     );

//     if (profileErr) {
//       throw new BadRequestException(profileErr.message);
//     }

//     // 4️⃣ 🔥 AUTO-CREATE FIRST CHAIR (CRITICAL)
//     // idempotent: only create if none exists
//     const { data: existingChair, error: chairCheckErr } = await supabaseAdmin
//       .from('chairs')
//       .select('id')
//       .eq('clinic_id', clinic.id)
//       .limit(1)
//       .maybeSingle();

//     if (chairCheckErr) {
//       throw new BadRequestException(chairCheckErr.message);
//     }

//     if (!existingChair) {
//       const { error: chairCreateErr } = await supabaseAdmin
//         .from('chairs')
//         .insert({
//           clinic_id: clinic.id,
//           name: 'Chair 1',
//           is_active: true,
//         });

//       if (chairCreateErr) {
//         throw new BadRequestException(
//           chairCreateErr.message || 'Chair creation failed',
//         );
//       }
//     }

//     return { ok: true };
//   }
// }
import { Body, Controller, Post, BadRequestException } from '@nestjs/common';
import { supabaseAdmin } from '../lib/supabase-admin';

@Controller('auth')
export class AuthController {
  @Post('clinic-signup')
  async clinicSignup(@Body() body: any) {
    const { email, password, clinic_name } = body;

    if (!email || !password || !clinic_name) {
      throw new BadRequestException('Missing fields');
    }

    // 1) Create auth user
    const { data: userData, error: authErr } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });

    if (authErr || !userData?.user) {
      throw new BadRequestException(authErr?.message || 'Auth failed');
    }

    const userId = userData.user.id;

    // 2) Create clinic
    const { data: clinic, error: clinicErr } = await supabaseAdmin
      .from('clinics')
      .insert({ name: clinic_name })
      .select('id')
      .single();

    if (clinicErr || !clinic?.id) {
      throw new BadRequestException(
        clinicErr?.message || 'Clinic create failed',
      );
    }

    // 3) Upsert profile
    const { error: profileErr } = await supabaseAdmin
      .from('profiles')
      .upsert(
        { id: userId, role: 'clinic_admin', clinic_id: clinic.id },
        { onConflict: 'id' },
      );

    if (profileErr) {
      throw new BadRequestException(profileErr.message);
    }

    // 4) Create first chair for this clinic (ONE chair per clinic for now)
    const { error: chairErr } = await supabaseAdmin.from('chairs').insert({
      clinic_id: clinic.id,
      name: 'Chair 1',
      is_active: true,
      // shelly_url: null,
    });

    if (chairErr) {
      throw new BadRequestException(chairErr.message);
    }

    return { ok: true, clinic_id: clinic.id };
  }
}
