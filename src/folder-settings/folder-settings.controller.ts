import { Controller, Post, Body,  UseGuards, Get, Patch, Param } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FolderSettingsService } from './folder-settings.service';
import { UpdateFolderSettingsDto } from './dto/update-folder-settings.dto';
import { FolderSettingsEntity } from './entities/folder-settings.entity';

@Controller('folder-settings')
export class FolderSettingsController {
  constructor(private readonly settingsService: FolderSettingsService) {}

  @Get(':folderId')
  getAllSettings(@Param('folderId') folderId: string) {
    return this.settingsService.getAllSettings(+folderId);
  }

  @Patch(':folderId')
  async updateSettings(
    @Param('folderId') folderId: number,
    @Body() updateSettingsDto: UpdateFolderSettingsDto,
  ): Promise<FolderSettingsEntity> {
    return this.settingsService.updateSettings(folderId, updateSettingsDto);
  }
}