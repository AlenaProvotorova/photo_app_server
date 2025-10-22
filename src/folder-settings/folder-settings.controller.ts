import { Controller, Post, Body,  UseGuards, Get, Patch, Param } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FolderSettingsService } from './folder-settings.service';
import { UpdateFolderSettingsDto } from './dto/update-folder-settings.dto';
import { FolderSettingsEntity } from './entities/folder-settings.entity';

@Controller('folder-settings')
@ApiTags('folder-settings')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class FolderSettingsController {
  constructor(private readonly settingsService: FolderSettingsService) {}

  @Get(':folderId')
  @ApiOperation({ summary: 'Получить настройки папки' })
  @ApiResponse({ status: 200, description: 'Настройки папки получены успешно', type: FolderSettingsEntity })
  getAllSettings(@Param('folderId') folderId: string) {
    return this.settingsService.getAllSettings(+folderId);
  }

  @Patch(':folderId')
  @ApiOperation({ summary: 'Обновить настройки папки' })
  @ApiResponse({ status: 200, description: 'Настройки папки обновлены успешно', type: FolderSettingsEntity })
  async updateSettings(
    @Param('folderId') folderId: number,
    @Body() updateSettingsDto: UpdateFolderSettingsDto,
  ): Promise<FolderSettingsEntity> {
    return this.settingsService.updateSettings(folderId, updateSettingsDto);
  }
}