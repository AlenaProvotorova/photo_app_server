import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as cors from 'cors';
import { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.setGlobalPrefix('api');

  // app.use(
  //   cors({
  //     origin: [
  //       `http://localhost:3001`,
  //       `https://stalwart-mooncake-ddf369.netlify.app`,
  //     ],
  //     credentials: true,
  //     methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  //     allowedHeaders: ['Content-Type', 'Authorization'],
  //   }),
  // );

  app.use(cors({ origin: '*' }));

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

  const port = process.env.PORT ?? 3000;
  console.log(`[SERVER] Стартуем на порту ${port}`);
  await app.listen(port);
}

bootstrap();
