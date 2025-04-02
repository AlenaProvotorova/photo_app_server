import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { WatermarkEntity } from './entities/watermark.entity';
import { Repository } from 'typeorm';
import { mkdirSync, renameSync, existsSync, unlinkSync } from 'fs';

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
}
