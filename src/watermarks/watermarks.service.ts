import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { WatermarkEntity } from './entities/watermark.entity';
import { Repository } from 'typeorm';
import { v2 as cloudinary } from 'cloudinary';
import { BlendMode, Jimp } from 'jimp';

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
    console.log('statr create watermark:');
    const existingWatermark = await this.repository.findOne({
      where: { user: { id: userId } },
    });
    if (existingWatermark) {
      await this.remove(userId);
    }

    const watermarkToSave = {
      filename: file.filename, // public_id от cloudinary
      originalName: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
      userId,
      path: file.path, // публичный URL от Cloudinary
      isActive: true,
      opacity: 0.5,
      position: 'center',
    };

    console.log('Saving watermark:', watermarkToSave);

    return this.repository.save(watermarkToSave);
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
      const watermark = await Jimp.read(activeWatermark.path);

      watermark.resize({ w: image.width });
      watermark.opacity(1);

      const x = (image.width - watermark.width) / 2;
      const y = (image.height - watermark.height) / 2;

      image.composite(watermark, x, y, {
        mode: BlendMode.SRC_OVER,
      });

      await image.write(`${imagePath.split('.')[0]}.jpg`);

      return imagePath;
    } catch (error) {
      console.error('Error in watermark application:', error);
      throw error;
    }
  }
}
