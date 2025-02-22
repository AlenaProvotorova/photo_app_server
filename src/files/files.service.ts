import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FileEntity, FileType } from './entities/file.entity';
import { Repository } from 'typeorm';
import { mkdirSync, renameSync } from 'fs';
import { existsSync } from 'fs';
import { FolderEntity } from '../folders/entities/folder.entity';

@Injectable()
export class FilesService {
  constructor(
    @InjectRepository(FileEntity)
    private repository: Repository<FileEntity>,
    @InjectRepository(FolderEntity)
    private folderRepository: Repository<FolderEntity>,
  ) {}

  findAll(userId: number, fileType: FileType, folderId: number) {
    const qb = this.repository.createQueryBuilder('file');  

     qb.where('file.folderId = :folderId', { folderId })  
     if (fileType === FileType.PHOTOS) {
      qb.andWhere('file.mimetype LIKE :type', { type: '%image%' });
     }
     if (fileType === FileType.TRASH) {
      qb.withDeleted().andWhere('file.deletedAt IS NOT NULL');
     }
     return qb.getMany(); 
  }

  create(file: Express.Multer.File, userId: number, folderId: string) {
    const uploadPath = 'uploads';
    const folderPath = `${uploadPath}`;
    if (!existsSync(folderPath)) {
      mkdirSync(folderPath, { recursive: true });
    }
    
    const newPath = `${folderPath}/${file.filename}`;
    renameSync(file.path, newPath);

      return this.repository.save({
      filename: file.filename,
      originalName: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
      userId: userId,
      folderId: folderId,
    });
  }

  remove(userId: number, ids: string) {
    const idsArray = ids.split(',')
    const gb = this.folderRepository.createQueryBuilder('file');

    gb.where('id IN(:...ids) AND userId = :userId', { ids: idsArray, userId })
    return gb.softDelete().execute();
  } 
}
