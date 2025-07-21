import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as express from 'express';
import * as cors from 'cors';
// import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';


async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  // app.use('/uploads', express.static(join(__dirname, '..', 'uploads')));
  app.use('/uploads', express.static('uploads', {
    setHeaders: (res) => {
        res.set('Access-Control-Allow-Origin', '*');
    }
}));

  app.use('/watermarks', express.static('watermarks', {
    setHeaders: (res) => {
        res.set('Access-Control-Allow-Origin', '*');
    }
}));

  app.setGlobalPrefix('api');
  app.enableCors({ credentials: true, origin: true });
  // disable cors for local development
  app.use(cors({
    origin: `http://localhost:3001`, 
    credentials: true, 
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
  const config = new DocumentBuilder()
  .setTitle('Облачное хранилище')
  .setVersion('1.0')
  .addBearerAuth()
  .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('swagger', app, documentFactory, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });
  console.log('[SERVER] Стартуем на порту', process.env.PORT ?? 3000);
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
