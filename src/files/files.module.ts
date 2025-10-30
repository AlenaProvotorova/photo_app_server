import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FilesController } from './files.controller';
import { FilesService } from './files.service';
import { FileEntity } from './entities/file.entity';
import { FolderModule } from 'src/folders/folders.module';
import { WatermarksModule } from 'src/watermarks/watermarks.module';
import { S3StorageService } from './s3.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([FileEntity]),
    FolderModule,
    WatermarksModule,
  ],
  controllers: [FilesController],
  providers: [FilesService, S3StorageService],
})
export class FilesModule {}
