import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FileEntity, FileType } from './entities/file.entity';
import { Repository } from 'typeorm';
import { mkdirSync, renameSync, existsSync } from 'fs';

@Injectable()
export class FilesService {
  constructor(
    @InjectRepository(FileEntity)
    private repository: Repository<FileEntity>,
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

  create(file: Express.Multer.File, folderId: string, updatedPath: string) {
    const uploadPath = 'uploads';
    const folderPath = `${uploadPath}`;
    if (!existsSync(folderPath)) {
      mkdirSync(folderPath, { recursive: true });
    }
    let newPath = '';
    if(updatedPath.includes(uploadPath)) {
      newPath = updatedPath;
    } else {
      newPath = `${folderPath}/${updatedPath}`;
    }
    renameSync(file.path, newPath);

      return this.repository.save({
      filename: file.filename,
      originalName: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
      folderId: folderId,
      path: newPath,
    });
  }

   remove( ids: string, folderId: number) {
    const idsArray = ids.split(',')
    const qb =  this.repository
    .createQueryBuilder('file')
    .where('id IN(:...ids) AND folderId = :folderId', { ids: idsArray, folderId })
    .softDelete()
    .execute();
    return qb;
  } 

  async updatePath(fileId: number, newPath: string): Promise<FileEntity> {
    await this.repository.update(fileId, { path: newPath });
    return this.repository.findOneOrFail({ where: { id: fileId } });
  }
}
