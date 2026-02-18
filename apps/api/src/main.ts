// import { NestFactory } from '@nestjs/core';
// import { AppModule } from './app.module';
// import { supabaseAdmin } from './lib/supabase-admin';

// async function bootstrap() {
//   // 🔧 CLEAN UP EXPIRED SESSIONS ON BOOT
//   const now = new Date().toISOString();

//   await supabaseAdmin
//     .from('sessions')
//     .update({
//       status: 'ended',
//       ended_reason: 'timeout',
//       ended_at: now,
//     })
//     .lt('auto_end_at', now)
//     .eq('status', 'active');

//   const app = await NestFactory.create(AppModule);
//   await app.listen(3001);
// }

// bootstrap();

// import { NestFactory } from '@nestjs/core';
// import { AppModule } from './app.module';
// import { supabaseAdmin } from './lib/supabase-admin';

// async function bootstrap() {
//   const app = await NestFactory.create(AppModule);

//   // ✅ CORS (required for the web UI)
//   app.enableCors({
//     origin: [
//       'http://localhost:3000',
//       'http://localhost:3002',
//       'http://127.0.0.1:3000',
//       'http://127.0.0.1:3002',
//     ],
//     methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
//     allowedHeaders: ['Content-Type', 'Authorization'],
//     credentials: true,
//   });

//   // 🔥 CLEAN UP EXPIRED SESSIONS (restart-safe auto-end)
//   try {
//     const now = new Date().toISOString();

//     await supabaseAdmin
//       .from('sessions')
//       .update({
//         status: 'ended',
//         ended_reason: 'timeout',
//         ended_at: now,
//       })
//       .lt('auto_end_at', now)
//       .eq('status', 'active');

//     console.log('[BOOT] Expired sessions cleaned');
//   } catch (err) {
//     console.error('[BOOT] Failed to clean expired sessions', err);
//   }

//   await app.listen(3001);
//   console.log('[API] Listening on http://localhost:3001');
// }

// bootstrap();
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { supabaseAdmin } from './lib/supabase-admin';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ✅ CORS
  app.enableCors({
    origin: [
      'http://localhost:3000',
      'http://localhost:3002',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3002',
      process.env.FRONTEND_URL || '',
    ],
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  // 🔥 CLEAN UP EXPIRED SESSIONS
  try {
    const now = new Date().toISOString();

    await supabaseAdmin
      .from('sessions')
      .update({
        status: 'ended',
        ended_reason: 'timeout',
        ended_at: now,
      })
      .lt('auto_end_at', now)
      .eq('status', 'active');

    console.log('[BOOT] Expired sessions cleaned');
  } catch (err) {
    console.error('[BOOT] Failed to clean expired sessions', err);
  }

  // ✅ VERY IMPORTANT FOR RAILWAY
  const port = process.env.PORT || 3001;

  await app.listen(port);

  console.log(`[API] Listening on port ${port}`);
}

bootstrap();
