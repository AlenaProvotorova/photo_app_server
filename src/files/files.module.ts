import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FilesController } from './files.controller';
import { FilesService } from './files.service';
import { FileEntity } from './entities/file.entity';
import { FolderModule } from 'src/folders/folders.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([FileEntity]),
    FolderModule,
  ],
  controllers: [FilesController],
  providers: [FilesService],
})
export class FilesModule {}
