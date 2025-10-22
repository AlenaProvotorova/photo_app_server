import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

// Загружаем переменные окружения из .env файла
dotenv.config();

export default new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL || `postgresql://${process.env.DB_USERNAME || 'postgres'}:${process.env.DB_PASSWORD || 'password'}@${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 5432}/${process.env.DB_NAME || 'photoapp'}`,
  synchronize: false, // Отключаем синхронизацию для продакшена
  logging: process.env.NODE_ENV === 'development',
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/../../migrations/*{.ts,.js}'],
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});
