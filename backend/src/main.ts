import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import session from 'express-session';
import { createClient } from 'redis';
import { RedisStore } from 'connect-redis';

import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const EXPIRY_TIME = 1000 * 60 * 60 * 24;
  app.enableCors({
    origin: ['http://localhost:3001', 'https://track-stack-ua81.vercel.app'],
    credentials: true,
  });

  const redisClient = createClient({
    url: process.env.REDIS_URL,
  });
  await redisClient.connect();

  app.use(
    session({
      name: 'sid',
      store: new RedisStore({ client: redisClient }),
      secret: process.env.SESSION_SECRET ?? 'dev-secret',
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: EXPIRY_TIME,
      },
    }),
  );
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap().catch(console.error);
