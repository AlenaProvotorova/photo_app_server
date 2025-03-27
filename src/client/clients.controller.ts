import { Controller, Get, Put, Param, Body } from '@nestjs/common';
import { ClientsService } from './clients.service';
import { CreateClientDto } from './dto/create-client.dto';
import { ApiBody, ApiParam } from '@nestjs/swagger';

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

  @Put(':clientId/order-digital')
  @ApiParam({ name: 'clientId', description: 'ID клиента' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        orderDigital: {
          type: 'boolean',
          description: 'Значение для обновления orderDigital',
        },
      },
    },
  })
  updateOrderDigital(
    @Param('clientId') clientId: string,
    @Body('orderDigital') orderDigital: boolean
  ) {
    return this.clientsService.updateOrderDigital(+clientId, orderDigital);
  }
  }