// main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './errors/global-exception.filter';
import { RawBodyMiddleware } from './middleware/raw-body.middleware';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalFilters(new GlobalExceptionFilter());
  app.use('/webhook/stripe', RawBodyMiddleware);
  await app.listen(3000);
}
bootstrap();
