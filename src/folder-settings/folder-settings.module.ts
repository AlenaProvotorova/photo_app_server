import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FolderSettingsController } from './folder-settings.controller';
import { FolderSettingsService } from './folder-settings.service';
import { FolderSettingsEntity } from './entities/folder-settings.entity';

@Module({
  imports: [TypeOrmModule.forFeature([FolderSettingsEntity])],
  controllers: [FolderSettingsController],
  providers: [FolderSettingsService],
  exports: [TypeOrmModule, FolderSettingsService],
})
export class FolderSettingsModule {}