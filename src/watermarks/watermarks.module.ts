import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WatermarkEntity } from './entities/watermark.entity';
import { WatermarksController } from './watermarks.controller';
import { WatermarksService } from './watermarks.service';
import { S3StorageService } from '../files/s3.service';

@Module({
  imports: [TypeOrmModule.forFeature([WatermarkEntity])],
  controllers: [WatermarksController],
  providers: [WatermarksService, S3StorageService],
  exports: [WatermarksService],
})
export class WatermarksModule {}
