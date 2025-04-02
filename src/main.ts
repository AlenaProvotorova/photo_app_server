import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as express from 'express';
import * as cors from 'cors';
// import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';


async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { cors: false });
  // app.use('/uploads', express.static(join(__dirname, '..', 'uploads')));
  app.use('/uploads', express.static('uploads', {
    setHeaders: (res) => {
        res.set('Access-Control-Allow-Origin', `http://localhost:${process.env.CLIENT_PORT}`);
    }
}));
  app.use('/watermarks', express.static('watermarks', {
    setHeaders: (res) => {
        res.set('Access-Control-Allow-Origin', `http://localhost:${process.env.CLIENT_PORT}`);
    }
}));
  app.setGlobalPrefix('api');
  app.enableCors({ credentials: true, origin: true });
  // disable cors for local development
  app.use(cors({
    origin: `http://localhost:${process.env.CLIENT_PORT}`, 
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
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
