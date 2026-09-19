import { NestFactory } from '@nestjs/core';
import { type NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const frontendUrl = process.env.FRONTEND_URL;

  app.enableCors({
    origin: frontendUrl ? [frontendUrl] : false,
    credentials: true,
  });

  // Serve uploaded files (avatars, etc.) as static assets
  app.useStaticAssets(join(process.cwd(), 'uploads'), { prefix: '/uploads' });

  await app.listen(process.env.PORT ?? 3133);
}
await bootstrap();
