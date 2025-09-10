import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FileEntity, FileType } from './entities/file.entity';
import { Repository } from 'typeorm';
import { v2 as cloudinary } from 'cloudinary';
import { unlinkSync, existsSync } from 'fs';

@Injectable()
export class FilesService {
  constructor(
    @InjectRepository(FileEntity)
    private repository: Repository<FileEntity>,
  ) {}

  findAll(fileType: FileType, folderId: number) {
    const qb = this.repository.createQueryBuilder('file');

    qb.where('file.folderId = :folderId', { folderId });
    if (fileType === FileType.PHOTOS) {
      qb.andWhere('file.mimetype LIKE :type', { type: '%image%' });
    }
    if (fileType === FileType.TRASH) {
      qb.withDeleted().andWhere('file.deletedAt IS NOT NULL');
    }
    return qb.getMany();
  }

  async create(
    file: Express.Multer.File,
    folderId: string,
  ): Promise<FileEntity> {
    if (!file) {
          throw new InternalServerErrorException('File not passed');
    }

    try {
      
      const filename = file.filename || `file_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      
      const cleanOriginalName = file.originalname
        .replace(/[^\x00-\x7F]/g, '')
        .replace(/[^a-zA-Z0-9._-]/g, '_')
        .substring(0, 255);
    
      let result;
      if (file.buffer) {
        result = await cloudinary.uploader.upload(`data:${file.mimetype};base64,${file.buffer.toString('base64')}`, {
          folder: folderId.toString(),
          resource_type: 'auto',
          public_id: filename,
        });
      } else if (file.path) {
        result = await cloudinary.uploader.upload(file.path, {
          folder: folderId.toString(),
          resource_type: 'auto',
          public_id: filename,
        });
        
        if (existsSync(file.path)) {
          unlinkSync(file.path);
        }
      } else {
        throw new InternalServerErrorException('No file data to load');
      }

      const savedFile = await this.repository.save({
        filename: result.public_id, 
        originalName: cleanOriginalName, 
        size: file.size,
        mimetype: file.mimetype,
        folderId: folderId.toString(),
        path: result.secure_url,
        url: result.secure_url,
      });

      return savedFile;
    } catch (error) {
      if (file && file.path && existsSync(file.path)) {
        unlinkSync(file.path);
      }

      throw new InternalServerErrorException('Error loading file');
    }
  }

  async remove(ids: string, folderId: number) {
    const idsArray = ids.split(',');
    for (const id of idsArray) {
      const file = await this.repository.findOneOrFail({
        where: { id: Number(id) },
      });
      
      if (file.filename && !file.path.startsWith('uploads/')) {
        try {
          await cloudinary.uploader.destroy(file.filename);
        } catch (error) {
          console.error(`Error deleting file from Cloudinary: ${error.message}`);
        }
      }
      
      if (file.path && file.path.startsWith('uploads/')) {
        if (existsSync(file.path)) {
          unlinkSync(file.path);
        }
      }
    }
    const qb = this.repository
      .createQueryBuilder('file')
      .where('id IN(:...ids) AND folderId = :folderId', {
        ids: idsArray,
        folderId,
      })
      .softDelete()
      .execute();
    return qb;
  }

  async updatePath(fileId: number, newPath: string): Promise<FileEntity> {
    await this.repository.update(fileId, { path: newPath });
    return this.repository.findOneOrFail({ where: { id: fileId } });
  }
}
