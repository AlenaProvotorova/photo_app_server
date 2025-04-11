import { Controller, Post, Body,  UseGuards, Get } from '@nestjs/common';
import { CreateSizeDto } from './dto/create-size.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SizeService } from './sizes.service';
import { Public } from '../auth/decorators/public.decorator';

@Controller('sizes')
@ApiTags('sizes')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SizeController {
  constructor(private readonly sizeService: SizeService) {}

  @Post()
  create(@Body() dto: CreateSizeDto) {
    return this.sizeService.create(dto);
  }

  @Public()
  @Get()
  findAll() {
    return this.sizeService.findAll();
  }
}