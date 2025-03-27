import { Injectable, NotFoundException } from "@nestjs/common";
import { FolderSettingsEntity } from "./entities/folder-settings.entity";
import { Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";
import { UpdateFolderSettingsDto } from "./dto/update-folder-settings.dto";

@Injectable()
export class FolderSettingsService {
  constructor(
    @InjectRepository(FolderSettingsEntity)
    private repository: Repository<FolderSettingsEntity>,
  ) {}

  async getAllSettings(folderId: number): Promise<FolderSettingsEntity> {
    return this.repository.findOne({
      where: { folderId },
      relations: ['folder'],
    });
  }

  async createDefaultSettings(folderId: number): Promise<FolderSettingsEntity> {
    const settings = this.repository.create({
      folderId,
      showSelectAllDigital: false,
      showPhotoOne: false,
      showPhotoTwo: false,
      showSize1: false,
      showSize2: false,
      showSize3: false,
    });
    return this.repository.save(settings);
  }

  async updateSettings(folderId: number, updateSettingsDto: UpdateFolderSettingsDto): Promise<FolderSettingsEntity> {
    const settings = await this.repository.findOne({ where: { folderId } });
    if (!settings) {
      throw new NotFoundException('Settings not found');
    }
    
    Object.assign(settings, updateSettingsDto);
    return this.repository.save(settings);
  }
}