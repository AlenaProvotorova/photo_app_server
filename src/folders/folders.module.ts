import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FolderEntity } from './entities/folder.entity';
import { FolderController } from './folders.controller';
import { FolderService } from './folders.service';

@Module({
  imports: [TypeOrmModule.forFeature([FolderEntity])],
  controllers: [FolderController],
  providers: [FolderService],
  exports: [TypeOrmModule, FolderService],
})
export class FolderModule {}