import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FolderEntity } from './entities/folder.entity';
import { CreateFolderDto } from './dto/create-folder.dto';
import { UpdateFolderDto } from './dto/update-folder.dto';

@Injectable()
export class FolderService {
  constructor(
    @InjectRepository(FolderEntity)
    private repository: Repository<FolderEntity>,
  ) {}

  async create(dto: CreateFolderDto, userId: number) {
    const folder = this.repository.create({
      name: dto.name,
      user: { id: userId },
    });

    return this.repository.save(folder);
  }

  async findAll(userId: number) {
    return this.repository.find({
      where: { user: { id: userId } },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number, userId: number) {
    const folder = await this.repository.findOne({
      where: { id, user: { id: userId } },
    });

    if (!folder) {
      throw new NotFoundException('Папка не найдена');
    }

    return folder;
  }

  async update(id: number, dto: UpdateFolderDto, userId: number) {
    const folder = await this.findOne(id, userId);

    return this.repository.save({
      ...folder,
      name: dto.name,
    });
  }

  async remove(id: number, userId: number) {
    const folder = await this.findOne(id, userId);
    
    return this.repository.remove(folder);
  }
}