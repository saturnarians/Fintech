import { NestFactory } from '@nestjs/core';
import { AppModule } from './modules/app.module';
import { Logger } from '@nestjs/common';

/**
 * ============================================================================
 * LEARNING NOTE: NESTJS APPLICATION ENTRY POINT
 * ============================================================================
 * Bootstraps the application, registers global routing prefixes, enables CORS,
 * and starts the HTTP server.
 */

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // Enable CORS for frontend integration (Next.js)
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // Global routing prefix
  app.setGlobalPrefix('api');

  const port = process.env.PORT || 3001;
  await app.listen(port);

  logger.log(`=======================================================`);
  logger.log(`🏦 PHC Digital Banking Core API is running!`);
  logger.log(`🚀 Base URL: http://localhost:${port}/api`);
  logger.log(`🔐 RBAC & JWT Authentication: Active`);
  logger.log(`💳 NIBSS by Phoenix Integration Gateway: Active`);
  logger.log(`=======================================================`);
}

bootstrap();
