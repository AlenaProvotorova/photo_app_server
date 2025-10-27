import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FileEntity, FileType } from './entities/file.entity';
import { Repository } from 'typeorm';
import { v2 as cloudinary } from 'cloudinary';
import { unlinkSync, existsSync, writeFileSync, readFileSync } from 'fs';
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
        const tempPath = `uploads/temp_upload_${Date.now()}_${filename}`;
        try {
          writeFileSync(tempPath, file.buffer);
          
          result = await cloudinary.uploader.upload(tempPath, {
            folder: `uploads/${folderId}`,
            resource_type: 'auto',
            public_id: filename,
          });
          
          if (existsSync(tempPath)) {
            unlinkSync(tempPath);
          }
        } catch (error) {
          if (existsSync(tempPath)) {
            unlinkSync(tempPath);
          }
          throw error;
        }
      } else if (file.path) {
        result = await cloudinary.uploader.upload(file.path, {
          folder: `uploads/${folderId}`,
          resource_type: 'auto',
          public_id: filename,
        });
        
        if (existsSync(file.path)) {
          unlinkSync(file.path);
        }
      } else {
        throw new InternalServerErrorException('No file data to load');
      }

      if (!result || !result.public_id || !result.secure_url) {
        throw new InternalServerErrorException('Cloudinary upload failed: invalid response');
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

      if (!savedFile) {
        throw new InternalServerErrorException('Failed to save file to database');
      }

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
      
      if (file.filename && file.path && !file.path.startsWith('uploads/')) {
        try {
          await cloudinary.uploader.destroy(file.filename);
        } catch (error) {
          console.error(`Error deleting file from Cloudinary for file ${file.id}: ${error?.message || 'unknown error'}`);
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
    const files = await this.repository.find({
      where: { folderId: folderId.toString() },
    });

    if (files.length === 0) {
      return { deletedCount: 0, message: 'No files found in folder' };
    }

    const folderPath = `uploads/${folderId}`;
    try {
      const resources = await cloudinary.search
        .expression(`folder:${folderPath}/*`)
        .max_results(500)
        .execute();
      
      if (resources.resources && resources.resources.length > 0) {
        const publicIds = resources.resources.map(res => res.public_id);
        
        for (let i = 0; i < publicIds.length; i += 100) {
          const batch = publicIds.slice(i, i + 100);
          await cloudinary.api.delete_resources(batch, {
            type: 'upload'
          });
        }
        
        console.log(`Successfully deleted ${publicIds.length} resources from Cloudinary folder: ${folderPath}`);
      }
    } catch (error) {
      console.error(`Error deleting folder from Cloudinary: ${error?.message || 'unknown error'}`, error);
      await this.deleteFilesFromStorageFast(files);
    }

    const qb = await this.repository
      .createQueryBuilder('file')
      .where('folderId = :folderId', { folderId })
      .softDelete()
      .execute();

    const deletedCount = qb.affected || 0;

    return {
      deletedCount,
      totalFiles: files.length,
      message: `Successfully deleted ${deletedCount} files from folder.`,
    };
  }

  async removeAllInFolderSync(folderId: number) {
    const files = await this.repository.find({
      where: { folderId: folderId.toString() },
    });

    if (files.length === 0) {
      return { deletedCount: 0, message: 'No files found in folder' };
    }

    const errors: string[] = [];

    const folderPath = `uploads/${folderId}`;
    try {
      const resources = await cloudinary.search
        .expression(`folder:${folderPath}/*`)
        .max_results(500)
        .execute();
      
      if (resources.resources && resources.resources.length > 0) {
        const publicIds = resources.resources.map(res => res.public_id);
        
        for (let i = 0; i < publicIds.length; i += 100) {
          const batch = publicIds.slice(i, i + 100);
          await cloudinary.api.delete_resources(batch, {
            type: 'upload'
          });
        }
        
        console.log(`Successfully deleted ${publicIds.length} resources from Cloudinary folder: ${folderPath}`);
      }
    } catch (error) {
      console.error(`Error deleting folder from Cloudinary: ${error?.message || 'unknown error'}`, error);
      errors.push(`Cloudinary error: ${error?.message || 'unknown error'}`);
      await this.deleteFilesFromStorageFast(files);
    }

    const qb = await this.repository
      .createQueryBuilder('file')
      .where('folderId = :folderId', { folderId })
      .softDelete()
      .execute();

    const deletedCount = qb.affected || 0;

    return {
      deletedCount,
      totalFiles: files.length,
      errors: errors.length > 0 ? errors : undefined,
      message: `Successfully deleted ${deletedCount} files from folder`,
    };
  }

  private async deleteFilesFromStorage(files: any[]) {
    const batchSize = 10; 
    const errors: string[] = [];

    for (let i = 0; i < files.length; i += batchSize) {
      const batch = files.slice(i, i + batchSize);
      
      const promises = batch.map(async (file) => {
        try {
          if (file.filename && file.path && !file.path.startsWith('uploads/')) {
            try {
              await cloudinary.uploader.destroy(file.filename);
            } catch (error) {
              console.error(`Error deleting file from Cloudinary for file ${file.id}: ${error?.message || 'unknown error'}`);
              errors.push(`Cloudinary error for file ${file.id}: ${error?.message || 'unknown error'}`);
            }
          }
          
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
    
      await Promise.allSettled(promises);
      
      if (i + batchSize < files.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    if (errors.length > 0) {
      console.error('Errors during background file deletion:', errors);
    }
  }

  private async deleteFilesFromStorageFast(files: any[]) {
    const errors: string[] = [];
    
    const publicIds: string[] = [];
    const localPaths: string[] = [];

    files.forEach(file => {
      if (file.filename && file.path && !file.path.startsWith('uploads/')) {
        publicIds.push(file.filename);
      }
      
      if (file.path && file.path.startsWith('uploads/')) {
        localPaths.push(file.path);
      }
    });

    for (let i = 0; i < publicIds.length; i += 100) {
      const batch = publicIds.slice(i, i + 100);
      try {
        await cloudinary.api.delete_resources(batch, {
          type: 'upload'
        });
      } catch (error) {
        console.error(`Error deleting batch from Cloudinary: ${error?.message || 'unknown error'}`);
        errors.push(`Cloudinary batch error: ${error?.message || 'unknown error'}`);
      }
    }
      
    localPaths.forEach(path => {
      try {
        if (existsSync(path)) {
          unlinkSync(path);
        }
      } catch (error) {
        console.error(`Error deleting local file: ${error?.message || 'unknown error'}`);
        errors.push(`Local file error: ${error?.message || 'unknown error'}`);
      }
    });

    if (errors.length > 0) {
      console.error('Errors during fast file deletion:', errors);
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
  
    const batchSize = 4;
    console.log(`Starting batch upload of ${files.length} image files with watermarks (batch size: ${batchSize})`);
    
    for (let i = 0; i < files.length; i += batchSize) {
      const batch = files.slice(i, i + batchSize);
      console.log(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(files.length / batchSize)}`);
      
      const batchPromises = batch.map(async (file) => {
        const safeFileName = file.originalname.replace(/[^a-zA-Z0-9._\s\-()]/g, '_');
        const uniqueId = `${Date.now()}_${i}_${Math.random().toString(36).substring(7)}_${safeFileName}`;
        const tempPath = `uploads/temp_${uniqueId}`;
        tempFiles.push(tempPath);
        
        try {
          writeFileSync(tempPath, file.buffer);
          
          const watermarkedPath = await this.watermarkService.applyWatermark(tempPath, userId);
          
          if (!existsSync(watermarkedPath)) {
            throw new Error(`Watermarked file not found at ${watermarkedPath}`);
          }
          
          const watermarkedBuffer = readFileSync(watermarkedPath);
          
          if (!watermarkedBuffer || watermarkedBuffer.length === 0) {
            throw new Error(`Watermarked file is empty: ${watermarkedPath}`);
          }
          
          const processedFile = {
            ...file,
            path: watermarkedPath,
            buffer: watermarkedBuffer
          };
          
          const savedFile = await this.create(processedFile, folderId);
          
          if (!savedFile) {
            throw new Error(`Failed to save file ${file.originalname}`);
          }
          
          if (existsSync(tempPath)) {
            unlinkSync(tempPath);
          }
          if (existsSync(watermarkedPath) && watermarkedPath !== tempPath) {
            unlinkSync(watermarkedPath);
          }
          
          return savedFile;
        } catch (error) {
          console.error(`Error processing file ${file.originalname}:`, error.message);
          if (existsSync(tempPath)) {
            unlinkSync(tempPath);
          }
          return null;
        }
      });

      const batchResults = await Promise.allSettled(batchPromises);
      
      batchResults.forEach((result, index) => {
        const fileName = batch[index]?.originalname || 'unknown';
        if (result.status === 'fulfilled' && result.value !== null) {
          results.push(result.value);
        } else if (result.status === 'rejected') {
          console.error(`File processing rejected for ${fileName}:`, result.reason);
        } else if (result.value === null) {
          console.error(`File processing returned null for ${fileName}`);
        }
      });
      
      console.log(`Batch ${Math.floor(i / batchSize) + 1} completed: ${results.length} files uploaded`);
    }

    return results;
  }

  private async processOtherFiles(
    files: Express.Multer.File[],
    folderId: string,
  ): Promise<FileEntity[]> {
    const results: FileEntity[] = [];

    const batchSize = 30;
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
      
      console.log(`Processed other files batch ${Math.floor(i / batchSize) + 1}, successful: ${results.length}/${files.length} files`);
    }

    return results;
  }
}
