import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.setGlobalPrefix('api');
  app.use(cookieParser());
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
  // Serve uploaded files: /api/uploads/* → apps/api/storage/uploads/*
  // __dirname = apps/api/src (dev ts-node) or apps/api/dist (prod node)
  // Either way, one level up from __dirname is apps/api
  app.useStaticAssets(join(__dirname, '..', 'storage', 'uploads'), {
    prefix: '/api/uploads',
  });
  await app.listen(process.env.PORT ?? 3001);
}
bootstrap();
