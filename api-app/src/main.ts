import { NestFactory } from '@nestjs/core';
import { HealthModule } from './health/health.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(HealthModule);

  // 1. Habilitar validación global (para que funcionen los DTOs)
  app.useGlobalPipes(new ValidationPipe({ transform: true }));

  // 2. Habilitar CORS (Crucial para que el Frontend pueda conectarse)
  app.enableCors();

  await app.listen(3000);
}
bootstrap();
