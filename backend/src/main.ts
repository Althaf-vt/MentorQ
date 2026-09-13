import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const frontendUrl = process.env.FRONTEND_URL;

  app.enableCors({
    origin: frontendUrl ? [frontendUrl] : false,
    credentials: true,
  });

  await app.listen(process.env.PORT ?? 3133);
}
await bootstrap();
