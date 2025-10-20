import { Module } from '@nestjs/common';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FilesModule } from './files/files.module';
import { FolderModule } from './folders/folders.module';
import { ClientsModule } from './client/clients.module';
import { SizeModule } from './sizes/sizes.module';
import { OrdersModule } from './orders/orders.module';
import { FolderSettingsModule } from './folder-settings/folder-settings.module';
import { WatermarksModule } from './watermarks/watermarks.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    UserModule,
    AuthModule,
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const databaseUrl = configService.get('DATABASE_URL');
        
        if (databaseUrl) {
          // Railway PostgreSQL connection
          return {
            type: 'postgres',
            url: databaseUrl,
            synchronize: true,
            entities: [__dirname + '/**/*.entity{.js, .ts}'],
            ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
          };
        }
        
        // Local development connection
        return {
          type: 'postgres',
          host: configService.get('DB_HOST', 'localhost'),
          port: configService.get('DB_PORT', 5432),
          username: configService.get('DB_USERNAME', 'postgres'),
          password: configService.get('DB_PASSWORD', 'password'),
          database: configService.get('DB_NAME', 'photoapp'),
          synchronize: true,
          entities: [__dirname + '/**/*.entity{.js, .ts}'],
        };
      },
      inject: [ConfigService],
    }),
    FilesModule,
    FolderModule,
    ClientsModule,
    SizeModule,
    OrdersModule,
    FolderSettingsModule,
    WatermarksModule,
  ],
})
export class AppModule {}
