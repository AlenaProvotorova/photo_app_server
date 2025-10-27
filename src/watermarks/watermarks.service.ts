import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { WatermarkEntity } from './entities/watermark.entity';
import { Repository } from 'typeorm';
import { v2 as cloudinary } from 'cloudinary';
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
  ) {}

  async find(userId: number) {
    return this.repository.find({ where: { user: { id: userId } } });
  }

  async create(file: Express.Multer.File, userId: number) {
    const existingWatermark = await this.repository.findOne({
      where: { user: { id: userId } },
    });

    let newCloudinaryResult;
    let oldFilename: string | null = null;

    try { 
      newCloudinaryResult = await cloudinary.uploader.upload(file.path, {
        folder: 'watermarks',
        resource_type: 'image',
      });

      if (existingWatermark) {
        oldFilename = existingWatermark.filename;
        try {
          await cloudinary.uploader.destroy(existingWatermark.filename, {
            resource_type: 'image',
          });
        } catch (error) {
          console.error(`Error deleting old watermark from Cloudinary: ${error?.message}`);
        }

        await this.repository.delete({ userId });
      }

      const watermarkToSave = {
        filename: newCloudinaryResult.public_id, 
        originalName: file.originalname,
        fileSize: file.size,
        mimetype: file.mimetype,
        userId,
        path: newCloudinaryResult.secure_url, 
        url: newCloudinaryResult.secure_url,
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
      
      if (newCloudinaryResult && newCloudinaryResult.public_id) {
        try {
          await cloudinary.uploader.destroy(newCloudinaryResult.public_id, {
            resource_type: 'image',
          });
        } catch (rollbackError) {
          console.error(`Error rolling back new watermark: ${rollbackError?.message}`);
        }
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

    await cloudinary.uploader.destroy(watermark.filename, {
      resource_type: 'image',
    });
    
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
