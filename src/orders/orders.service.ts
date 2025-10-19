

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
    // Validate that all referenced entities exist
    await this.validateReferences(createOrderDto);

    const existingOrder = await this.repository.findOne({
      where: {
        fileId: createOrderDto.fileId,
        clientId: createOrderDto.clientId,
        folderId: createOrderDto.folderId,
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
      const newOrder = this.repository.create(createOrderDto);
      return await this.repository.save(newOrder);
    }
  }

  private async validateReferences(dto: CreateOrderDto): Promise<void> {
    const [file, client, folder] = await Promise.all([
      this.fileRepository.findOne({ where: { id: dto.fileId } }),
      this.clientRepository.findOne({ where: { id: dto.clientId } }),
      this.folderRepository.findOne({ where: { url: dto.folderId } }),
    ]);

    if (!file) {
      throw new BadRequestException(`File with id ${dto.fileId} not found`);
    }
    if (!client) {
      throw new BadRequestException(`Client with id ${dto.clientId} not found`);
    }
    if (!folder) {
      throw new BadRequestException(`Folder with url ${dto.folderId} not found`);
    }
  }

  async findByFolderId(folderId: string): Promise<OrderEntity[]> {
    return await this.repository.find({
      where: { folderId },
      relations: ['file', 'client']
    });
  }

  async findByFolderAndClient(folderId: string, clientId: number): Promise<OrderEntity[]> {
    return await this.repository.find({
      where: { folderId, clientId },
      relations: ['file', 'client']
    });
  }

}