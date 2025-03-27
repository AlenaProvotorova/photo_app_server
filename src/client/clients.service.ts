import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClientEntity } from './entities/client.entity';
import { CreateClientDto } from './dto/create-client.dto';

@Injectable()
export class ClientsService {
  constructor(
    @InjectRepository(ClientEntity)
    private repository: Repository<ClientEntity>,
  ) {}

  async getAllClients(folderId: number): Promise<ClientEntity[]> {
    return this.repository.find({
      where: { folderId },
      relations: ['folder'],
    });
  }

  async updateClientsList(folderId: number, clients: CreateClientDto[]): Promise<ClientEntity[]> {
    if (clients.some(client => !client.name)) {
      throw new Error('Client name is required');
    }

    await this.repository.delete({ folderId });
    
    const newClients = clients.map(client => ({
      ...client,
      folderId,
    }));
    
    return this.repository.save(newClients);
  }


  async updateOrderDigital(clientId: number, orderDigital: boolean) {
    const client = await this.repository.findOne({ where: { id: clientId } });
    if (!client) {
      throw new NotFoundException('Клиент не найден');
    }
    
    client.orderDigital = orderDigital;
    return this.repository.save(client);
  }
}