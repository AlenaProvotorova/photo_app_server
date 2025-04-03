import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { WatermarkEntity } from './entities/watermark.entity';
import { Repository } from 'typeorm';
import { mkdirSync, renameSync, existsSync, unlinkSync } from 'fs';
import { BlendMode, Jimp } from 'jimp';
import * as path from 'path';

@Injectable()
export class WatermarksService {
  constructor(
    @InjectRepository(WatermarkEntity)
    private repository: Repository<WatermarkEntity>,
    ) {}

  async find( userId: number) {
    const watermark = await this.repository.find({
      where: { user: { id: userId } },
    });

    return watermark;
  }

  async create(file: Express.Multer.File, userId: number) {
    const existingWatermark = await this.repository.findOne({
      where: { user: { id: userId } },
    });

    if (existingWatermark) {
      await this.remove(userId);
    }

    const uploadPath = 'watermarks';
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
      path: newPath,
      isActive: true,
      opacity: 0.5,
      position: 'center'
    });
  }

  async remove(userId: number) {
    const watermark = await this.repository.findOne({
      where: { userId: userId }
    });
    if (!watermark) {
      throw new NotFoundException('Watermark not found');
    }

    try {
      const filePath = `watermarks/${watermark.filename}`;
      if (existsSync(filePath)) {
        unlinkSync(filePath);
      }

      return await this.repository.delete({ userId: userId });
    } catch (error) {
      throw new Error(`Failed to delete watermark: ${error.message}`);
    }
  }

  async applyWatermark(imagePath: string, userId: number): Promise<string> {
    const activeWatermark = await this.repository.findOne({
      where: { userId: userId, },
    });
    
    if (!activeWatermark) return;
    
    try {
      const image = await Jimp.read(imagePath);
      const watermark = await Jimp.read(activeWatermark.path);
  
      watermark.resize({ w: image.width  });
      watermark.opacity(1);
  
      const x = (image.width - watermark.width) / 2;
      const y = (image.height - watermark.height) / 2;
  
      image.composite(watermark, x, y, {
        mode: BlendMode.SRC_OVER
      });
    
    await image.write(`${imagePath.split('.')[0]}.jpg`);

    return imagePath;
    } catch (error) {
      console.error('Error in watermark application:', error);
      throw error;
    }
  }
}
