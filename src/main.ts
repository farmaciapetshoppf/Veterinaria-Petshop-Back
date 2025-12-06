import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ExcludePasswordInterceptor } from './password-exclude/password-exclude.interceptor';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(cookieParser());

  app.setGlobalPrefix('api');

  // CORS - Configuración para permitir cookies entre dominios
  app.enableCors({
    origin: [
      process.env.API_URL,
      process.env.FRONTEND_URL,
      'http://localhost:3002',
      'http://localhost:3000',
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    credentials: true, // ✅ Crucial para que las cookies funcionen
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Cookie'],
    exposedHeaders: ['Set-Cookie'],
  });

  // Interceptor global para remover contraseña
  app.useGlobalInterceptors(new ExcludePasswordInterceptor());

  // Validaciones globales
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Swagger
  const config = new DocumentBuilder()
    .setTitle('Veterinaria & Petshop API')
    .setDescription(
      'Backend para gestión de mascotas, turnos, productos y ventas.',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(process.env.PORT ?? 3000);
  console.log(
    '\x1b[36m%s\x1b[0m',
    '🐶🐱🐰  Servidor de Veterinaria Petshop iniciado con éxito 💖',
  );
  console.log('\x1b[33m%s\x1b[0m', `🚀 Ejecutándose en: ${await app.getUrl()}`);
}
bootstrap();
