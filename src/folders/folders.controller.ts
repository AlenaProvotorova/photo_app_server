import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { CreateFolderDto } from './dto/create-folder.dto';
import { UpdateFolderDto } from './dto/update-folder.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FolderService } from './folders.service';
import { UserId } from '../auth/decorators/user-id.decorator';

@Controller('folders')
@ApiTags('folders')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class FolderController {
  constructor(private readonly folderService: FolderService) {}

  @Post()
  create(@Body() dto: CreateFolderDto, @UserId() userId: number) {
    return this.folderService.create(dto, userId);
  }

  @Get()
  findAll(@UserId() userId: number) {
    return this.folderService.findAll(userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @UserId() userId: number) {
    return this.folderService.findOne(+id, userId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateFolderDto,
    @UserId() userId: number,
  ) {
    return this.folderService.update(+id, dto, userId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @UserId() userId: number) {
    return this.folderService.remove(+id, userId);
  }
}