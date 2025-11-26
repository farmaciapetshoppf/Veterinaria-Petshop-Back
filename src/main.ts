import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ExcludePasswordInterceptor } from './password-exclude/password-exclude.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // CORS
  app.enableCors({
    origin: ['http://localhost:3000'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  });

  // Interceptor global para remover contraseña
  app.useGlobalInterceptors(new ExcludePasswordInterceptor());

  // Validaciones globales
  app.useGlobalPipes(
    new ValidationPipe({
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Swagger
  const config = new DocumentBuilder()
    .setTitle('Veterinaria & Petshop API')
    .setDescription('Backend para gestión de mascotas, turnos, productos y ventas.')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(process.env.PORT ?? 3000);
   console.log('\x1b[36m%s\x1b[0m', '🐶🐱🐰  Servidor de Veterinaria Petshop iniciado con éxito 💖');
  console.log('\x1b[33m%s\x1b[0m', `🚀 Ejecutándose en: ${await app.getUrl()}`);

}
bootstrap();
