import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import { v2 as cloudinary } from 'cloudinary';
import fetch from 'node-fetch';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.setGlobalPrefix('api');
  
  // Включаем CORS глобально с поддержкой Flutter и мобильных приложений
  app.enableCors({
    origin: (origin, callback) => {
      // Разрешаем запросы без origin (мобильные приложения, Postman, etc.)
      if (!origin) return callback(null, true);
      
      const allowedOrigins = [
        'http://localhost:3000',
        'http://localhost:3001',
        'http://localhost:5173',
        'http://localhost:8080',
        'http://localhost:8081', // Flutter web default port
        'http://localhost:8082', // Additional Flutter port
        'http://127.0.0.1:3000',
        'http://127.0.0.1:3001',
        'http://127.0.0.1:5173',
        'http://127.0.0.1:8080',
        'http://127.0.0.1:8081', // Flutter web default port
        'http://127.0.0.1:8082', // Additional Flutter port
        'https://stalwart-mooncake-ddf369.netlify.app',
        'https://photoappserver-production.up.railway.app',
        'https://your-frontend-domain.com', // замените на ваш домен
        // Railway URLs
        process.env.RAILWAY_STATIC_URL,
        process.env.RAILWAY_PUBLIC_DOMAIN,
      ].filter(Boolean); // Убираем undefined значения
      
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      
      // Для разработки разрешаем все localhost и 127.0.0.1
      if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV !== 'production') {
        if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
          console.log(`[CORS] Allowing development origin: ${origin}`);
          return callback(null, true);
        }
      }
      
      // Разрешаем Flutter web приложения (обычно работают на портах 8080+)
      if (origin.match(/^https?:\/\/(localhost|127\.0\.0\.1):(808[0-9]|300[0-9]|517[0-9])$/)) {
        console.log(`[CORS] Allowing Flutter web origin: ${origin}`);
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

  // Добавляем middleware для логирования CORS запросов
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    const method = req.method;
    const url = req.url;
    
    console.log(`[CORS] ${method} ${url} from ${origin || 'no-origin'}`);
    
    // Добавляем дополнительные заголовки для Flutter
    res.header('Access-Control-Allow-Origin', origin || '*');
    res.header('Access-Control-Allow-Credentials', 'true');
    
    next();
  });

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
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

  // Добавляем endpoint для проверки CORS
  app.use('/api/health', (req, res) => {
    res.json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      cors: {
        origin: req.headers.origin || 'no-origin',
        method: req.method,
        headers: req.headers
      }
    });
  });

  const port = process.env.PORT ?? 3000;
  const host = process.env.RAILWAY_STATIC_URL ? '0.0.0.0' : 'localhost';
  
  console.log(`[SERVER] Стартуем на ${host}:${port}`);
  console.log(`[SERVER] CORS настроен для Flutter и мобильных приложений`);
  console.log(`[SERVER] Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`[SERVER] Railway URL: ${process.env.RAILWAY_STATIC_URL || 'local'}`);
  console.log(`[SERVER] Health check: http://${host}:${port}/api/health`);
  
  await app.listen(port, host);
}

bootstrap();
