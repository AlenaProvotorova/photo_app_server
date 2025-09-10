import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { WatermarkEntity } from './entities/watermark.entity';
import { Repository } from 'typeorm';
import { v2 as cloudinary } from 'cloudinary';
import { Jimp } from 'jimp';
@Injectable()
export class WatermarksService {
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
    if (existingWatermark) {
      await this.remove(userId);
    }


    const result = await cloudinary.uploader.upload(file.path, {
      folder: 'watermarks',
      resource_type: 'image',
    });

    const watermarkToSave = {
      filename: result.public_id, 
      originalName: file.originalname,
      fileSize: file.size,
      mimetype: file.mimetype,
      userId,
      path: result.secure_url, 
      url: result.secure_url,
      isActive: true,
      opacity: 0.5,
      position: 'center',
      size: 0.1, 
    };

    return this.repository.save(watermarkToSave);
  }

  async updateSettings(userId: number, settings: { size?: number; opacity?: number; position?: string }) {
    const watermark = await this.repository.findOne({ where: { userId } });
    if (!watermark) throw new NotFoundException('Watermark not found');

    if (settings.size !== undefined) watermark.size = settings.size;
    if (settings.opacity !== undefined) watermark.opacity = settings.opacity;
    if (settings.position !== undefined) watermark.position = settings.position;

    return this.repository.save(watermark);
  }

  async remove(userId: number) {
    const watermark = await this.repository.findOne({ where: { userId } });
    if (!watermark) throw new NotFoundException('Watermark not found');

    await cloudinary.uploader.destroy(watermark.filename, {
      resource_type: 'image',
    });
    return this.repository.delete({ userId });
  }

  async applyWatermark(imagePath: string, userId: number): Promise<string> {
    const activeWatermark = await this.repository.findOne({
      where: { userId: userId },
    });
    
    if (!activeWatermark) {
      throw new NotFoundException('Active watermark not found');
    }

    try {
      const image = await Jimp.read(imagePath);
      const watermark = await Jimp.read(activeWatermark.url);
      const watermarkOpacity = activeWatermark.opacity || 0.5;
      
      const baseSize = Math.min(image.width, image.height);
      const watermarkSize = Math.floor(baseSize * 1);
      
      watermark.resize({ w: watermarkSize, h: watermarkSize });
      
      watermark.opacity(watermarkOpacity);
      

      const x = (image.width - watermark.width) / 2;
      const y = (image.height - watermark.height) / 2;
      
      image.composite(watermark, x, y);

      const outputPath = imagePath.replace('.', '_watermarked.') as `${string}.${string}`;
      await image.write(outputPath);
      
      
      return outputPath;
    } catch (error) {
      console.error('Error in watermark application:', error);
      throw error;
    }
  }
}
