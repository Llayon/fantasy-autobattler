import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

/**
 * Bootstrap the NestJS application.
 * Sets up CORS, Swagger documentation, and starts the server on port 3001.
 */
async function bootstrap(): Promise<void> {
  const logger = new Logger('Bootstrap');
  
  try {
    const app = await NestFactory.create(AppModule);
    
    // Register global exception filter for unified error handling
    app.useGlobalFilters(new HttpExceptionFilter());
    
    // Enable CORS for frontend communication
    app.enableCors({
      origin: 'http://localhost:3000',
      credentials: true,
    });

    // Setup Swagger API documentation
    const config = new DocumentBuilder()
      .setTitle('Fantasy Autobattler API')
      .setDescription('REST API for Fantasy Autobattler - Browser-based asynchronous PvP autobattler game')
      .setVersion('1.0')
      .addTag('auth', 'Guest authentication endpoints')
      .addTag('players', 'Player profile and statistics')
      .addTag('teams', 'Team building and management')
      .addTag('units', 'Unit data and templates')
      .addTag('battles', 'Battle simulation and history')
      .addTag('matchmaking', 'PvP matchmaking system')
      .addTag('rating', 'ELO rating system')
      .addApiKey(
        {
          type: 'apiKey',
          name: 'x-guest-token',
          in: 'header',
          description: 'Guest authentication token',
        },
        'guest-token',
      )
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
        tagsSorter: 'alpha',
        operationsSorter: 'alpha',
      },
    });

    await app.listen(3001);
    logger.log('Backend running on http://localhost:3001');
    logger.log('Swagger documentation available at http://localhost:3001/api/docs');
  } catch (error) {
    logger.error('Failed to start application', error);
    process.exit(1);
  }
}

void bootstrap();
