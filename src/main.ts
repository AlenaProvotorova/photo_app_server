import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import { v2 as cloudinary } from 'cloudinary';
import fetch from 'node-fetch';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.setGlobalPrefix('api');
  
  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      
      const allowedOrigins = [
        'http://localhost:3001',
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        'https://stalwart-mooncake-ddf369.netlify.app',
        'https://photoappserver-production.up.railway.app',
        'https://fastselect.ru', 
        process.env.RAILWAY_STATIC_URL,
        process.env.RAILWAY_PUBLIC_DOMAIN,
      ].filter(Boolean); 
      
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      
      if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV !== 'production') {
        if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
          return callback(null, true);
        }
      }
      
      // Allow desktop Flutter apps and local development
      if (origin.match(/^https?:\/\/(localhost|127\.0\.0\.1):(808[0-9]|300[0-9]|517[0-9])$/)) {
        return callback(null, true);
      }
      
      // Allow requests without origin (desktop apps, mobile apps, etc.)
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

  app.use('/api/health', async (req, res) => {
    try {
      // Проверяем подключение к базе данных
      const dataSource = app.get('DataSource');
      let dbStatus = 'unknown';
      
      try {
        await dataSource.query('SELECT 1');
        dbStatus = 'connected';
      } catch (error) {
        dbStatus = 'disconnected';
        console.error('Database health check failed:', error.message);
      }

      const healthData = {
        status: dbStatus === 'connected' ? 'OK' : 'ERROR',
        timestamp: new Date().toISOString(),
        database: dbStatus,
        environment: process.env.NODE_ENV || 'development',
        port: process.env.PORT || 3000,
        cors: {
          origin: req.headers.origin || 'no-origin',
          method: req.method,
        }
      };

      // Если база данных не подключена, возвращаем 503
      if (dbStatus !== 'connected') {
        return res.status(503).json(healthData);
      }

      res.json(healthData);
    } catch (error) {
      console.error('Health check error:', error);
      res.status(500).json({
        status: 'ERROR',
        timestamp: new Date().toISOString(),
        error: error.message
      });
    }
  });

  const port = process.env.PORT ?? 3000;
  const host = '0.0.0.0';

  console.log(`🚀 Starting server on ${host}:${port}`);
  console.log(`📊 Health check available at: http://${host}:${port}/api/health`);
  console.log(`📚 Swagger docs available at: http://${host}:${port}/swagger`);
  
  await app.listen(port, host);
  
  console.log(`✅ Server successfully started on ${host}:${port}`);
}

bootstrap().catch((error) => {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
});
