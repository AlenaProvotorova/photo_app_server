import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FolderEntity } from './entities/folder.entity';
import { CreateFolderDto } from './dto/create-folder.dto';
import { UpdateFolderDto } from './dto/update-folder.dto';
import { randomBytes } from 'crypto';
import { FolderSettingsService } from 'src/folder-settings/folder-settings.service';
import { v2 as cloudinary } from 'cloudinary';

@Injectable()
export class FolderService {
  constructor(
    @InjectRepository(FolderEntity)
    private repository: Repository<FolderEntity>,
    private settingsService: FolderSettingsService,
  ) {}

  private generateUrl(id: number, name: string): string {
    const transliteratedName = name
      .toLowerCase()
      .replace(/[а-я]/g, char => {
        const transliterationMap: { [key: string]: string } = {
          'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'e',
          'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm',
          'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
          'ф': 'f', 'х': 'h', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'sch',
          'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya'
        };
        return transliterationMap[char] || char;
      })
      .replace(/[^a-zA-Z0-9]/g, '');

    const randomCode = randomBytes(4).toString('hex').slice(0, 8);

    return `${id}_${transliteratedName}_${randomCode}`;
  }

  async create(dto: CreateFolderDto, userId: number) {
    const tempId = Date.now();
    const folder = this.repository.create({
      name: dto.name,
      user: { id: userId },
      url: this.generateUrl(tempId, dto.name),
    });

    const savedFolder = await this.repository.save(folder);
    
    savedFolder.url = this.generateUrl(savedFolder.id, savedFolder.name);
    await this.settingsService.createDefaultSettings(savedFolder.id);
    return this.repository.save(savedFolder);
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
    
    try {
      const resources = await cloudinary.api.resources({
        type: 'upload',
        prefix: folder.id.toString(),
        max_results: 500
      });
      
      if (resources.resources && resources.resources.length > 0) {
        const publicIds = resources.resources.map(resource => resource.public_id);
        await cloudinary.api.delete_resources(publicIds);
      }
      
      try {
        await cloudinary.api.delete_folder(folder.id.toString());
      } catch (folderError) {
        console.log(`Folder ${folder.id} already deleted or does not exist`);
      }
    } catch (error) {
      console.error(`Error deleting folder from Cloudinary:`, error);
    }
    
    return this.repository.softDelete(id);
  }
}