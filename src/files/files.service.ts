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
    folderId: number,
  ): Promise<FileEntity> {
    if (!file) {
      throw new InternalServerErrorException('Файл не передан');
    }

    try {
      const result = await cloudinary.uploader.upload(file.path, {
        folder: folderId.toString(),
        resource_type: 'auto',
      });

      if (existsSync(file.path)) {
        unlinkSync(file.path);
      }

      const savedFile = await this.repository.save({
        filename: file.filename,
        originalName: file.originalname,
        size: file.size,
        mimetype: file.mimetype,
        folderId: folderId.toString(),
        path: result.secure_url,
      });

      return savedFile;
    } catch (error) {
      if (file && existsSync(file.path)) {
        unlinkSync(file.path);
      }

      console.error('Ошибка загрузки в Cloudinary:', error);
      throw new InternalServerErrorException('Ошибка загрузки файла');
    }
  }

  async remove(ids: string, folderId: number) {
    const idsArray = ids.split(',');
    for (const id of idsArray) {
      const file = await this.repository.findOneOrFail({
        where: { id: Number(id) },
      });
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
