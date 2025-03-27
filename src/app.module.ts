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

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    UserModule,
    AuthModule,
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST'),
        port: configService.get('DB_PORT'),
        username: configService.get('DB_USERNAME'),
        password: configService.get('DB_PASSWORD'),
        database: configService.get('DB_NAME'),
        synchronize: true,
        entities: [__dirname + '/**/*.entity{.js, .ts}'],
      }),
      inject: [ConfigService],
    }),
    FilesModule,
    FolderModule,
    ClientsModule,
    SizeModule,
    OrdersModule,
    FolderSettingsModule,
  ],
})
export class AppModule {}
