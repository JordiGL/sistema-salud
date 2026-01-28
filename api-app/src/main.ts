import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ValidationPipe({ transform: true }));

  // 1. CORS: Acceptar tothom (*) o posar la URL del teu frontend a Vercel
  app.enableCors({
    origin:
      process.env.NODE_ENV === 'production'
        ? ['https://sistema-salud.vercel.app', /\.vercel\.app$/] // Posa la teva URL de producció
        : ['http://localhost:3000', 'http://localhost:3001'], // Localhost per desenvolupament
    credentials: true,
  });

  // 2. PORT: Vercel assigna un port via variable d'entorn, no sempre és el 3000
  await app.listen(process.env.PORT || 3000);
}
bootstrap();
