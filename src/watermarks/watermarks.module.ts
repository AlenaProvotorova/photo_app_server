import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WatermarkEntity } from './entities/watermark.entity';
import { WatermarksController } from './watermarks.controller';
import { WatermarksService } from './watermarks.service';

@Module({
  imports: [TypeOrmModule.forFeature([WatermarkEntity])],
  controllers: [WatermarksController],
  providers: [WatermarksService],
  exports: [WatermarksService],
})
export class WatermarksModule {}
