import { Controller, Get, Put, Param, Body } from '@nestjs/common';
import { ClientsService } from './clients.service';
import { CreateClientDto } from './dto/create-client.dto';

@Controller('clients')
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Get('folder/:folderId')
  getAllClients(@Param('folderId') folderId: string) {
    return this.clientsService.getAllClients(+folderId);
  }

  @Put('folder/:folderId')
  updateClientsList(
    @Param('folderId') folderId: string,
    @Body() clients: CreateClientDto[]
  ) {
    return this.clientsService.updateClientsList(+folderId, clients);
  }
  }