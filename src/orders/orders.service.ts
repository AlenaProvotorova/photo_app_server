

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrderEntity } from './entities/order.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { randomBytes } from 'crypto';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(OrderEntity)
    private repository: Repository<OrderEntity>,
  ) {}

  async createOrUpdate(createOrderDto: CreateOrderDto): Promise<OrderEntity | void> {
    const existingOrder = await this.repository.findOne({
      where: {
        fileId: createOrderDto.fileId,
        clientId: createOrderDto.clientId,
        folderId: createOrderDto.folderId,
        sizeId: createOrderDto.sizeId
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

  async findByFolderId(folderId: string): Promise<OrderEntity[]> {
    return await this.repository.find({
      where: { folderId },
      relations: ['file', 'size', 'client']
    });
  }

  async findByFolderAndClient(folderId: string, clientId: number): Promise<OrderEntity[]> {
    return await this.repository.find({
      where: { folderId, clientId },
      relations: ['file', 'size', 'client']
    });
  }

}