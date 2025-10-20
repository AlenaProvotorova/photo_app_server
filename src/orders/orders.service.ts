

import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrderEntity } from './entities/order.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { randomBytes } from 'crypto';
import { FileEntity } from '../files/entities/file.entity';
import { ClientEntity } from '../client/entities/client.entity';
import { FolderEntity } from '../folders/entities/folder.entity';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(OrderEntity)
    private repository: Repository<OrderEntity>,
    @InjectRepository(FileEntity)
    private fileRepository: Repository<FileEntity>,
    @InjectRepository(ClientEntity)
    private clientRepository: Repository<ClientEntity>,
    @InjectRepository(FolderEntity)
    private folderRepository: Repository<FolderEntity>,
  ) {}

  async createOrUpdate(createOrderDto: CreateOrderDto): Promise<OrderEntity | void> {
    // Validate that all referenced entities exist and get folder ID
    const folderId = await this.validateReferences(createOrderDto);

    const existingOrder = await this.repository.findOne({
      where: {
        fileId: createOrderDto.fileId,
        clientId: createOrderDto.clientId,
        folderId: folderId,
        formatName: createOrderDto.formatName,
      }
    });

    if (createOrderDto.count === 0) {
      if (existingOrder) {
        await this.repository.remove(existingOrder);
        return;
      }
      return;
    }

    if (existingOrder) {
      existingOrder.count = createOrderDto.count;
      return await this.repository.save(existingOrder);
    } else {
      const newOrder = this.repository.create({
        ...createOrderDto,
        folderId: folderId,
      });
      return await this.repository.save(newOrder);
    }
  }

  private async validateReferences(dto: CreateOrderDto): Promise<number> {
    // Проверяем, является ли folderId числом (ID) или строкой (URL)
    const isNumericId = !isNaN(Number(dto.folderId));
    
    const [file, client, folder] = await Promise.all([
      this.fileRepository.findOne({ where: { id: dto.fileId } }),
      this.clientRepository.findOne({ where: { id: dto.clientId } }),
      isNumericId 
        ? this.folderRepository.findOne({ where: { id: Number(dto.folderId) } })
        : this.folderRepository.findOne({ where: { url: dto.folderId } }),
    ]);

    if (!file) {
      throw new BadRequestException(`File with id ${dto.fileId} not found`);
    }
    if (!client) {
      throw new BadRequestException(`Client with id ${dto.clientId} not found`);
    }
    if (!folder) {
      throw new BadRequestException(`Folder with ${isNumericId ? 'id' : 'url'} ${dto.folderId} not found`);
    }

    return folder.id;
  }

  async findByFolderId(folderId: string): Promise<OrderEntity[]> {
    // Если folderId - это числовой ID, ищем по ID папки
    const isNumericId = !isNaN(Number(folderId));
    
    if (isNumericId) {
      // Ищем заказы по ID папки
      return await this.repository.find({
        where: { folderId: Number(folderId) },
        relations: ['file', 'client']
      });
    }
    
    // Если folderId - это URL, находим папку по URL и ищем по её ID
    const folder = await this.folderRepository.findOne({ 
      where: { url: folderId } 
    });
    
    if (!folder) {
      return [];
    }
    
    return await this.repository.find({
      where: { folderId: folder.id },
      relations: ['file', 'client']
    });
  }

  async findByFolderAndClient(folderId: string, clientId: number): Promise<OrderEntity[]> {
    // Если folderId - это числовой ID, ищем по ID папки
    const isNumericId = !isNaN(Number(folderId));
    
    if (isNumericId) {
      // Ищем заказы по ID папки и клиенту
      return await this.repository.find({
        where: { folderId: Number(folderId), clientId },
        relations: ['file', 'client']
      });
    }
    
    // Если folderId - это URL, находим папку по URL и ищем по её ID
    const folder = await this.folderRepository.findOne({ 
      where: { url: folderId } 
    });
    
    if (!folder) {
      return [];
    }
    
    return await this.repository.find({
      where: { folderId: folder.id, clientId },
      relations: ['file', 'client']
    });
  }

}