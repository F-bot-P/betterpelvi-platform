import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SessionsService } from './sessions/sessions.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3002',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3002',
    ...(process.env.CORS_ORIGINS?.split(',').map((s) => s.trim()) ?? []),
    ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL.trim()] : []),
  ].filter(Boolean);

  app.enableCors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true); // curl/healthchecks
      if (/^https:\/\/.*\.vercel\.app$/.test(origin)) return cb(null, true); // allow previews
      if (allowedOrigins.includes(origin)) return cb(null, true);
      return cb(null, false);
    },
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  // Keep restart behavior safe: expired sessions are auto-ended and chair OFF is attempted.
  try {
    const sessions = app.get(SessionsService);
    await sessions.autoEndExpiredSessions('boot');
    console.log('[BOOT] Expired sessions checked');
  } catch (err) {
    console.error('[BOOT] Failed to check expired sessions', err);
  }

  const port = process.env.PORT || 3001;
  await app.listen(port);

  console.log(`[API] Listening on port ${port}`);
}

bootstrap();
