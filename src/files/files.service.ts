import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FileEntity, FileType } from './entities/file.entity';
import { Repository } from 'typeorm';
import { v2 as cloudinary } from 'cloudinary';
import { unlinkSync, existsSync, writeFileSync } from 'fs';
import * as path from 'path';
import { WatermarksService } from '../watermarks/watermarks.service';

@Injectable()
export class FilesService {
  constructor(
    @InjectRepository(FileEntity)
    private repository: Repository<FileEntity>,
    private readonly watermarkService: WatermarksService,
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
        .replace(/[^a-zA-Z0-9._\s\-()]/g, '_')
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

  async removeAllInFolder(folderId: number) {
    // Сначала выполняем мягкое удаление всех файлов из базы данных
    const qb = await this.repository
      .createQueryBuilder('file')
      .where('folderId = :folderId', { folderId })
      .softDelete()
      .execute();

    const deletedCount = qb.affected || 0;

    if (deletedCount === 0) {
      return { deletedCount: 0, message: 'No files found in folder' };
    }

    // Получаем файлы для физического удаления (только не удаленные)
    const files = await this.repository.find({
      where: { folderId: folderId.toString() },
      withDeleted: true,
    });

    // Асинхронно удаляем файлы из хранилища без ожидания
    this.deleteFilesFromStorage(files).catch(error => {
      console.error('Error in background file deletion:', error);
    });

    return {
      deletedCount,
      totalFiles: files.length,
      message: `Successfully marked ${deletedCount} files for deletion. Physical deletion is in progress.`,
    };
  }

  async removeAllInFolderSync(folderId: number) {
    const files = await this.repository.find({
      where: { folderId: folderId.toString() },
    });

    if (files.length === 0) {
      return { deletedCount: 0, message: 'No files found in folder' };
    }

    let deletedCount = 0;
    const errors: string[] = [];

    // Обрабатываем файлы пакетами для оптимизации
    const batchSize = 5; // Меньший размер пакета для синхронной обработки
    for (let i = 0; i < files.length; i += batchSize) {
      const batch = files.slice(i, i + batchSize);
      
      // Обрабатываем пакет файлов параллельно
      const promises = batch.map(async (file) => {
        try {
          // Удаляем из Cloudinary если файл там хранится
          if (file.filename && !file.path.startsWith('uploads/')) {
            try {
              await cloudinary.uploader.destroy(file.filename);
            } catch (error) {
              console.error(`Error deleting file from Cloudinary: ${error.message}`);
              errors.push(`Cloudinary error for file ${file.id}: ${error.message}`);
            }
          }
          
          // Удаляем локальный файл если он существует
          if (file.path && file.path.startsWith('uploads/')) {
            if (existsSync(file.path)) {
              unlinkSync(file.path);
            }
          }
          
          deletedCount++;
        } catch (error) {
          console.error(`Error processing file ${file.id}:`, error);
          errors.push(`Error processing file ${file.id}: ${error.message}`);
        }
      });

      // Ждем завершения текущего пакета
      await Promise.allSettled(promises);
      
      // Небольшая пауза между пакетами
      if (i + batchSize < files.length) {
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }

    // Мягкое удаление всех файлов в папке из базы данных
    const qb = await this.repository
      .createQueryBuilder('file')
      .where('folderId = :folderId', { folderId })
      .softDelete()
      .execute();

    return {
      deletedCount,
      totalFiles: files.length,
      errors: errors.length > 0 ? errors : undefined,
      message: `Successfully deleted ${deletedCount} files from folder`,
    };
  }

  private async deleteFilesFromStorage(files: any[]) {
    const batchSize = 10; // Обрабатываем файлы пакетами
    const errors: string[] = [];

    for (let i = 0; i < files.length; i += batchSize) {
      const batch = files.slice(i, i + batchSize);
      
      // Обрабатываем пакет файлов параллельно
      const promises = batch.map(async (file) => {
        try {
          // Удаляем из Cloudinary если файл там хранится
          if (file.filename && !file.path.startsWith('uploads/')) {
            try {
              await cloudinary.uploader.destroy(file.filename);
            } catch (error) {
              console.error(`Error deleting file from Cloudinary: ${error.message}`);
              errors.push(`Cloudinary error for file ${file.id}: ${error.message}`);
            }
          }
          
          // Удаляем локальный файл если он существует
          if (file.path && file.path.startsWith('uploads/')) {
            if (existsSync(file.path)) {
              unlinkSync(file.path);
            }
          }
        } catch (error) {
          console.error(`Error processing file ${file.id}:`, error);
          errors.push(`Error processing file ${file.id}: ${error.message}`);
        }
      });

      // Ждем завершения текущего пакета
      await Promise.allSettled(promises);
      
      // Небольшая пауза между пакетами для снижения нагрузки
      if (i + batchSize < files.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    if (errors.length > 0) {
      console.error('Errors during background file deletion:', errors);
    }
  }

  async updatePath(fileId: number, newPath: string): Promise<FileEntity> {
    await this.repository.update(fileId, { path: newPath });
    return this.repository.findOneOrFail({ where: { id: fileId } });
  }

  async createBatch(
    files: Express.Multer.File[],
    folderId: string,
    userId: number,
  ): Promise<FileEntity[]> {
    if (!files || files.length === 0) {
      throw new InternalServerErrorException('No files provided');
    }

    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const results: FileEntity[] = [];
    const tempFiles: string[] = [];

    try {
      const imageFiles: Express.Multer.File[] = [];
      const otherFiles: Express.Multer.File[] = [];

      files.forEach(file => {
        const fileExtension = path.extname(file.originalname).toLowerCase();
        if (imageExtensions.includes(fileExtension)) {
          imageFiles.push(file);
        } else {
          otherFiles.push(file);
        }
      });

      if (imageFiles.length > 0) {
        const imageResults = await this.processImageFiles(imageFiles, folderId, userId);
        results.push(...imageResults);
      }

      if (otherFiles.length > 0) {
        const otherResults = await this.processOtherFiles(otherFiles, folderId);
        results.push(...otherResults);
      }

      return results;
    } catch (error) {
      tempFiles.forEach(tempFile => {
        if (existsSync(tempFile)) {
          unlinkSync(tempFile);
        }
      });
      throw new InternalServerErrorException(`Error processing batch upload: ${error.message}`);
    }
  }

  private async processImageFiles(
    files: Express.Multer.File[],
    folderId: string,
    userId: number,
  ): Promise<FileEntity[]> {
    const results: FileEntity[] = [];
    const tempFiles: string[] = [];

    const batchSize = 10;
    for (let i = 0; i < files.length; i += batchSize) {
      const batch = files.slice(i, i + batchSize);
      const batchPromises = batch.map(async (file) => {
        const safeFileName = file.originalname.replace(/[^a-zA-Z0-9._\s\-()]/g, '_');
        const tempPath = `uploads/temp_${Date.now()}_${Math.random().toString(36).substring(7)}_${safeFileName}`;
        tempFiles.push(tempPath);
        
        try {
          writeFileSync(tempPath, file.buffer);
          
          const watermarkedPath = await this.watermarkService.applyWatermark(tempPath, userId);
          
          const processedFile = {
            ...file,
            path: watermarkedPath,
            buffer: file.buffer
          };
          
          const savedFile = await this.create(processedFile, folderId);
          
          if (existsSync(tempPath)) {
            unlinkSync(tempPath);
          }
          
          return savedFile;
        } catch (error) {
          if (existsSync(tempPath)) {
            unlinkSync(tempPath);
          }
          throw error;
        }
      });

      const batchResults = await Promise.allSettled(batchPromises);
      
      batchResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          console.error(`Error processing file ${batch[index].originalname}:`, result.reason);
        }
      });
    }

    return results;
  }

  private async processOtherFiles(
    files: Express.Multer.File[],
    folderId: string,
  ): Promise<FileEntity[]> {
    const results: FileEntity[] = [];

    const batchSize = 20;
    for (let i = 0; i < files.length; i += batchSize) {
      const batch = files.slice(i, i + batchSize);
      const batchPromises = batch.map(file => this.create(file, folderId));

      const batchResults = await Promise.allSettled(batchPromises);
      
      batchResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          console.error(`Error processing file ${batch[index].originalname}:`, result.reason);
        }
      });
    }

    return results;
  }
}
