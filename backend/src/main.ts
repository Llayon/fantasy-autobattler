import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from './app.module';

/**
 * Bootstrap the NestJS application.
 * Sets up CORS and starts the server on port 3001.
 */
async function bootstrap(): Promise<void> {
  const logger = new Logger('Bootstrap');
  
  try {
    const app = await NestFactory.create(AppModule);
    
    app.enableCors({
      origin: 'http://localhost:3000',
      credentials: true,
    });

    await app.listen(3001);
    logger.log('Backend running on http://localhost:3001');
  } catch (error) {
    logger.error('Failed to start application', error);
    process.exit(1);
  }
}

void bootstrap();
