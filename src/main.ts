import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3000);

  const config = new DocumentBuilder()
  .setTitle('Banking API')
  .setDescription('API for simple banking operations')
  .setVersion('1.0')
  .addBearerAuth()
  .addTag('Users', 'User management operations')
  .addTag('Authentication', 'Authentication operations')
  .build();    
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(port);
  console.log(`Application running on port ${port}`);
}
bootstrap();