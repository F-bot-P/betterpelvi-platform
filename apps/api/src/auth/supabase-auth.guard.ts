// // import {
// //   CanActivate,
// //   ExecutionContext,
// //   Injectable,
// //   UnauthorizedException,
// // } from '@nestjs/common';
// // import { createClient } from '@supabase/supabase-js';

// // @Injectable()
// // export class SupabaseAuthGuard implements CanActivate {
// //   private authClient = createClient(
// //     process.env.SUPABASE_URL!,
// //     process.env.SUPABASE_ANON_KEY!,
// //   );

// //   private adminClient = createClient(
// //     process.env.SUPABASE_URL!,
// //     process.env.SUPABASE_SERVICE_ROLE_KEY!,
// //   );

// //   async canActivate(context: ExecutionContext): Promise<boolean> {
// //     const req = context.switchToHttp().getRequest();
// //     const authHeader = req.headers.authorization;

// //     if (!authHeader?.startsWith('Bearer ')) {
// //       throw new UnauthorizedException('Missing Authorization header');
// //     }

// //     const token = authHeader.replace('Bearer ', '');

// //     // 1️⃣ Validate JWT
// //     const { data: authData, error: authError } =
// //       await this.authClient.auth.getUser(token);

// //     if (authError || !authData?.user) {
// //       throw new UnauthorizedException('Invalid token');
// //     }

// //     const user = authData.user;

// //     // 2️⃣ Load profile with SERVICE ROLE (bypass RLS)
// //    const { data: profile } = await this.adminClient
// //   .from('profiles')
// //   .select('role, clinic_id')
// //   .eq('id', user.id)
// //   .single();

// // // 🔑 FALLBACK to Supabase metadata
// // const role =
// //   profile?.role ??
// //   user.user_metadata?.role ??
// //   user.app_metadata?.role;

// // if (!role) {
// //   throw new UnauthorizedException('User role missing');
// // }

// // req.user = {
// //   id: user.id,
// //   email: user.email,
// //   role, // ← works now
// //   clinicId: profile?.clinic_id ?? null,
// // };

// //     // 3️⃣ Attach normalized user
// //     req.user = {
// //       id: user.id,
// //       email: user.email,
// //       role: profile.role, // ✅ REQUIRED
// //       clinicId: profile.clinic_id, // ✅ REQUIRED
// //     };

// //     return true;
// //   }
// // }

// import {
//   CanActivate,
//   ExecutionContext,
//   Injectable,
//   UnauthorizedException,
// } from '@nestjs/common';
// import { createClient } from '@supabase/supabase-js';
// import { Reflector } from '@nestjs/core';
// import { IS_PUBLIC_KEY } from './public.decorator';

// @Injectable()
// export class SupabaseAuthGuard implements CanActivate {
//   private authClient = createClient(
//     process.env.SUPABASE_URL!,
//     process.env.SUPABASE_ANON_KEY!,
//   );

//   private adminClient = createClient(
//     process.env.SUPABASE_URL!,
//     process.env.SUPABASE_SERVICE_ROLE_KEY!,
//   );

//   async canActivate(context: ExecutionContext): Promise<boolean> {
//     const req = context.switchToHttp().getRequest();
//     const authHeader = req.headers.authorization;

//     if (!authHeader?.startsWith('Bearer ')) {
//       throw new UnauthorizedException('Missing Authorization header');
//     }

//     const token = authHeader.replace('Bearer ', '');

//     /* 1️⃣ Validate JWT */
//     const { data: authData, error: authError } =
//       await this.authClient.auth.getUser(token);

//     if (authError || !authData?.user) {
//       throw new UnauthorizedException('Invalid token');
//     }

//     const user = authData.user;

//     /* 2️⃣ Load profile (may or may not exist) */
//     const { data: profile } = await this.adminClient
//       .from('profiles')
//       .select('role, clinic_id')
//       .eq('id', user.id)
//       .single();

//     /* 3️⃣ Resolve role safely */
//     const role =
//       profile?.role ?? user.user_metadata?.role ?? user.app_metadata?.role;

//     if (!role) {
//       throw new UnauthorizedException('User role missing');
//     }

//     /* 4️⃣ Attach normalized user (SAFE) */
//     if (
//       (role === 'clinic_admin' || role === 'clinic_staff') &&
//       !profile?.clinic_id
//     ) {
//       throw new UnauthorizedException('Clinic user has no clinic assigned');
//     }

//     req.user = {
//       id: user.id,
//       email: user.email,
//       role,
//       clinicId: profile?.clinic_id ?? null,
//     };

//     return true;
//   }
// }
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from './public.decorator';

@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  private authClient = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
  );

  private adminClient = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // ✅ 0) Allow routes marked as @Public()
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const req = context.switchToHttp().getRequest();
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing Authorization header');
    }

    const token = authHeader.replace('Bearer ', '').trim();
    if (!token) {
      throw new UnauthorizedException('Missing token');
    }

    /* 1️⃣ Validate JWT */
    const { data: authData, error: authError } =
      await this.authClient.auth.getUser(token);

    if (authError || !authData?.user) {
      throw new UnauthorizedException('Invalid token');
    }

    const user = authData.user;

    /* 2️⃣ Load profile (may or may not exist) */
    const { data: profile } = await this.adminClient
      .from('profiles')
      .select('role, clinic_id')
      .eq('id', user.id)
      .maybeSingle();

    /* 3️⃣ Resolve role safely */
    const role =
      profile?.role ?? user.user_metadata?.role ?? user.app_metadata?.role;

    if (!role) {
      throw new UnauthorizedException('User role missing');
    }

    /* 4️⃣ Attach normalized user (SAFE) */
    if (
      (role === 'clinic_admin' || role === 'clinic_staff') &&
      !profile?.clinic_id
    ) {
      throw new UnauthorizedException('Clinic user has no clinic assigned');
    }

    req.user = {
      id: user.id,
      email: user.email,
      role,
      clinicId: profile?.clinic_id ?? null,
    };

    return true;
  }
}
