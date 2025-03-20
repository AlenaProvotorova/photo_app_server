import { Controller, Get, Post, Body,Param, Query, Put } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { OrdersService } from './orders.service';

@Controller('orders')
@ApiTags('orders')
@ApiBearerAuth()
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Put()
  createOrUpdate(@Body() createOrderDto: CreateOrderDto) {
    return this.ordersService.createOrUpdate(createOrderDto);
  }

  @Get('folder/:folderId')
  @ApiQuery({
    name: 'clientId',
    required: false,
    type: Number
  })
  findByFolder(@Param('folderId') folderId: string, @Query('clientId') clientId?: number,) {
    if (clientId) {
      return this.ordersService.findByFolderAndClient(folderId, clientId);
    }
    return this.ordersService.findByFolderId(folderId);
  }
 
}