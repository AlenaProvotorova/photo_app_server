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

  async getClientById(clientId: number): Promise<ClientEntity> {
    return this.repository.findOne({ where: { id: clientId } });
  }

  async updateClientsList(folderId: number, clients: CreateClientDto[]): Promise<ClientEntity[]> {
    if (clients.some(client => !client.name)) {
      throw new Error('Client name is required');
    }

    // Получаем существующих клиентов
    const existingClients = await this.repository.find({ where: { folderId } });
    
    // Создаем карту существующих клиентов по имени для быстрого поиска
    const existingClientsMap = new Map(
      existingClients.map(client => [client.name, client])
    );
    
    // Фильтруем только тех клиентов, которых еще нет
    const newClients = clients
      .filter(client => !existingClientsMap.has(client.name))
      .map(client => ({
        ...client,
        folderId,
      }));
    
    // Сохраняем только новых клиентов
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

  async updateOrderAlbum(clientId: number, orderAlbum: boolean) {
    const client = await this.repository.findOne({ where: { id: clientId } });
    if (!client) {
      throw new NotFoundException('Клиент не найден');
    }
    
    client.orderAlbum = orderAlbum;
    return this.repository.save(client);
  }

  async deleteClientByName(folderId: number, clientName: string): Promise<void> {
    const client = await this.repository.findOne({ 
      where: { folderId, name: clientName } 
    });
    
    if (!client) {
      throw new NotFoundException('Клиент не найден');
    }
    
    await this.repository.remove(client);
  }
}