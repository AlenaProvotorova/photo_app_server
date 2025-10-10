import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrderEntity } from './entities/order.entity';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { FileEntity } from '../files/entities/file.entity';
import { ClientEntity } from '../client/entities/client.entity';
import { FolderEntity } from '../folders/entities/folder.entity';

@Module({
  imports: [TypeOrmModule.forFeature([OrderEntity, FileEntity, ClientEntity, FolderEntity])],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [TypeOrmModule, OrdersService],
})
export class OrdersModule {}