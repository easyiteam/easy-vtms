import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import basicAuth = require('express-basic-auth');

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable CORS
  app.enableCors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
  });

  // Enable validation
  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true,
  }));

  // Basic Auth for Swagger documentation
  const swaggerUser = process.env.SWAGGER_USER || 'admin';
  const swaggerPassword = process.env.SWAGGER_PASSWORD || 'vtms2025';
  
  app.use(
    ['/api/docs', '/api/docs-json'],
    basicAuth({
      challenge: true,
      users: {
        [swaggerUser]: swaggerPassword,
      },
    }),
  );

  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('VTMS API')
    .setDescription('Vessel Traffic Management System - Complete API Documentation')
    .setVersion('1.0.0')
    .addTag('realtime', 'Real-time vessel tracking and AIS data')
    .addTag('trajectory', 'Historical trajectories and replay')
    .addTag('prediction', 'AI predictions and anomaly detection')
    .addTag('weather', 'Weather and maritime conditions')
    .addTag('vts', 'VTS messaging and communication')
    .addTag('port', 'Port management and berth operations')
    .addTag('analytics', 'Analytics and reporting')
    .addTag('security', 'Security and audit logs')
    .addTag('optimization', 'Performance optimization')
    .addTag('enc', 'Electronic Navigational Charts')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);
  
  console.log(`🚀 Backend running on http://localhost:${port}`);
  console.log(`📚 API Documentation: http://localhost:${port}/api/docs`);
  console.log(`🔐 Swagger protected with Basic Auth (user: ${swaggerUser})`);
  console.log(`🔌 WebSocket server ready`);
}

bootstrap();
