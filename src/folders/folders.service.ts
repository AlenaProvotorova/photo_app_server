import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FolderEntity } from './entities/folder.entity';
import { CreateFolderDto } from './dto/create-folder.dto';
import { UpdateFolderDto } from './dto/update-folder.dto';
import { randomBytes } from 'crypto';

@Injectable()
export class FolderService {
  constructor(
    @InjectRepository(FolderEntity)
    private repository: Repository<FolderEntity>,
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
    
    return this.repository.remove(folder);
  }
}