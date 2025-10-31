import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import fetch from 'node-fetch';
import { existsSync, mkdirSync } from 'fs';

async function bootstrap() {
  
  try {
    const app = await NestFactory.create<NestExpressApplication>(AppModule);
    
    const directories = ['uploads', 'watermarks'];
    directories.forEach(dir => {
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }
    });
    
    app.use((req, res, next) => {
      req.setTimeout(300000); 
      res.setTimeout(300000);
      next();
    });
    
    app.setGlobalPrefix('api');
  
    const isProduction = process.env.NODE_ENV === 'production';

    app.enableCors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      
      const allowedOrigins = [
        'http://localhost:3001',
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        'https://stalwart-mooncake-ddf369.netlify.app',
        'https://fastselect.ru', 
        'https://www.fastselect.ru',
        'https://api.fastselect.ru',
      ].filter(Boolean); 
      
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      
      if (!isProduction && (origin.includes('localhost') || origin.includes('127.0.0.1'))) {
        return callback(null, true);
      }
      
      if (origin.match(/^https?:\/\/(localhost|127\.0\.0\.1):([0-9]{2,5})$/)) {
        return callback(null, true);
      }
      
      if (!origin || origin === 'null') {
        return callback(null, true);
      }
      
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH', 'HEAD'],
    allowedHeaders: [
      'Content-Type', 
      'Authorization', 
      'Accept',
      'Origin',
      'X-Requested-With',
      'Access-Control-Request-Method',
      'Access-Control-Request-Headers',
      'X-API-Key',
      'X-Client-Version',
      'User-Agent'
    ],
    exposedHeaders: [
      'Authorization',
      'X-Total-Count',
      'X-Page-Count'
    ],
    optionsSuccessStatus: 200,
    preflightContinue: false,
  });

  if (!globalThis.fetch) {
    globalThis.fetch = fetch;
  }

    app.use((req, res, next) => {
      const origin = req.headers.origin;
      const method = req.method;
      const url = req.url;
      
      
      res.header('Access-Control-Allow-Origin', origin || '*');
      res.header('Access-Control-Allow-Credentials', 'true');
      
      next();
    });



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

    app.use('/api/health', (req, res) => {
      res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        port: process.env.PORT || 3000,
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        database: process.env.DATABASE_URL ? 'configured' : 'not configured',
        version: '1.0.0',
      });
    });

    const port = process.env.PORT ?? 3000;
    const host = '0.0.0.0';

    await app.listen(port, host);
    
    
  } catch (error) {
    throw error;
  }
}

bootstrap().catch((error) => {
  process.exit(1);
});
