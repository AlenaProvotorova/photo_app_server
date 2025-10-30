import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { WatermarkEntity } from './entities/watermark.entity';
import { Repository } from 'typeorm';
import { S3StorageService } from '../files/s3.service';
import { Jimp } from 'jimp';
import { existsSync, unlinkSync } from 'fs';

interface WatermarkCache {
  [userId: number]: {
    watermark: any;
    url: string;
    opacity: number;
    lastAccess: number;
  };
}

@Injectable()
export class WatermarksService {
  private watermarkCache: WatermarkCache = {};
  
  constructor(
    @InjectRepository(WatermarkEntity)
    private repository: Repository<WatermarkEntity>,
    private readonly s3: S3StorageService,
  ) {}

  async find(userId: number) {
    return this.repository.find({ where: { user: { id: userId } } });
  }

  async create(file: Express.Multer.File, userId: number) {
    const existingWatermark = await this.repository.findOne({
      where: { user: { id: userId } },
    });

    let uploadResult: { key: string; url: string } | null = null;
    let oldFilename: string | null = null;

    try { 
      const fs = await import('fs');
      const buffer = file.path && fs.existsSync(file.path) ? fs.readFileSync(file.path) : file.buffer;
      const safeName = file.originalname.replace(/[^a-zA-Z0-9._\s\-()]/g, '_');
      const objectKey = `watermarks/${userId}/${Date.now()}_${safeName}`;
      uploadResult = await this.s3.upload({
        key: objectKey,
        contentType: file.mimetype,
        body: buffer,
      });

      if (existingWatermark) {
        oldFilename = existingWatermark.filename;
        try { await this.s3.delete(existingWatermark.filename); } catch (error) {}

        await this.repository.delete({ userId });
      }

      const watermarkToSave = {
        filename: uploadResult!.key, 
        originalName: file.originalname,
        fileSize: file.size,
        mimetype: file.mimetype,
        userId,
        path: uploadResult!.url, 
        url: uploadResult!.url,
        isActive: true,
        opacity: 0.5,
        position: 'center',
        size: 0.1, 
      };

      if (userId in this.watermarkCache) {
        delete this.watermarkCache[userId];
      }

      const savedWatermark = await this.repository.save(watermarkToSave);
      
      if (file.path && existsSync(file.path)) {
        try {
          unlinkSync(file.path);
        } catch (error) {
          console.error(`Error deleting temporary file: ${error?.message}`);
        }
      }
      
      return savedWatermark;
    } catch (error) {
      console.error('Error creating watermark:', error);
      
      if (uploadResult && uploadResult.key) {
        try { await this.s3.delete(uploadResult.key); } catch (rollbackError) {}
      }

      if (file.path && existsSync(file.path)) {
        try {
          unlinkSync(file.path);
        } catch (error) {
          console.error(`Error deleting temporary file: ${error?.message}`);
        }
      }

      throw error;
    }
  }

  async updateSettings(userId: number, settings: { size?: number; opacity?: number; position?: string }) {
    const watermark = await this.repository.findOne({ where: { userId } });
    if (!watermark) throw new NotFoundException('Watermark not found');

    if (settings.size !== undefined) watermark.size = settings.size;
    if (settings.opacity !== undefined) watermark.opacity = settings.opacity;
    if (settings.position !== undefined) watermark.position = settings.position;

    if (userId in this.watermarkCache) {
      delete this.watermarkCache[userId];
    }

    return this.repository.save(watermark);
  }

  async remove(userId: number) {
    const watermark = await this.repository.findOne({ where: { userId } });
    if (!watermark) throw new NotFoundException('Watermark not found');

    try { await this.s3.delete(watermark.filename); } catch (e) {}
    
    if (userId in this.watermarkCache) {
      delete this.watermarkCache[userId];
    }
    
    return this.repository.delete({ userId });
  }

  async applyWatermark(imagePath: string, userId: number): Promise<string> {
    const activeWatermark = await this.repository.findOne({
      where: { userId: userId },
    });
    
    if (!activeWatermark) {
      return imagePath;
    }

    try {
      const image = await Jimp.read(imagePath);
      
      let watermarkImage;
      const cached = this.watermarkCache[userId];
      
      if (cached && cached.url === activeWatermark.url) {
        watermarkImage = cached.watermark.clone();
        cached.lastAccess = Date.now();
      } else {
        try {
          watermarkImage = await Jimp.read(activeWatermark.url);
          
          this.watermarkCache[userId] = {
            watermark: watermarkImage.clone(),
            url: activeWatermark.url,
            opacity: activeWatermark.opacity || 0.5,
            lastAccess: Date.now(),
          };
          
          this.cleanCache();
        } catch (watermarkError) {
          return imagePath;
        }
      }
      
      const watermarkOpacity = activeWatermark.opacity || 0.5;
      
      const baseSize = Math.min(image.width, image.height);
      const watermarkSize = Math.floor(baseSize * 1);
      
      watermarkImage.resize({ w: watermarkSize, h: watermarkSize });
      
      watermarkImage.opacity(watermarkOpacity);
      

      const x = (image.width - watermarkImage.width) / 2;
      const y = (image.height - watermarkImage.height) / 2;
      
      image.composite(watermarkImage, x, y);

      const outputPath = imagePath.replace('.', '_watermarked.') as `${string}.${string}`;
      await image.write(outputPath);
      
      
      return outputPath;
    } catch (error) {
      console.error('Error in watermark application:', error);
      return imagePath;
    }
  }

  private cleanCache() {
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    for (const userId in this.watermarkCache) {
      if (this.watermarkCache[userId].lastAccess < oneHourAgo) {
        delete this.watermarkCache[userId];
      }
    }
  }
}
