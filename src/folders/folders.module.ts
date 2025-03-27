import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FolderEntity } from './entities/folder.entity';
import { FolderController } from './folders.controller';
import { FolderService } from './folders.service';
import { FolderSettingsModule } from 'src/folder-settings/folder-settings.module';

@Module({
  imports: [TypeOrmModule.forFeature([FolderEntity]), FolderSettingsModule],
  controllers: [FolderController],
  providers: [FolderService],
  exports: [TypeOrmModule, FolderService, FolderSettingsModule],
})
export class FolderModule {}