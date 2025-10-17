import { Logger, ValidationPipe, LogLevel } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import { AppModule } from './app/app.module';

async function bootstrap() {
  const logLevels: LogLevel[] = process.env.LOG_LEVEL 
    ? [process.env.LOG_LEVEL as LogLevel]
    : ['log', 'error', 'warn'];
    
  const app = await NestFactory.create(AppModule, {
    logger: logLevels
  });

  if (process.env.NODE_ENV === 'development') {
    app.enableCors({
      origin: 'http://localhost:4200',
      credentials: true,
    });
  }

  const globalPrefix = 'api';
  app.setGlobalPrefix(globalPrefix);
  app.use(cookieParser());
  app.useGlobalPipes(new ValidationPipe({ 
    transform: true,
    whitelist: true,
  }));

  const port = process.env.PORT || 3000;
  await app.listen(port);
  Logger.log(`🚀 Application is running on: http://localhost:${port}/${globalPrefix}`);
}

bootstrap();
