import { Injectable, NotFoundException } from "@nestjs/common";
import { FolderSettingsEntity } from "./entities/folder-settings.entity";
import { Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";
import { UpdateFolderSettingsDto } from "./dto/update-folder-settings.dto";
import { isBoolean } from "class-validator";

const defaultRuNameSelectAllDigital = 'Выбрать все фото в цифровом виде';
const defaultRuNamePhotoOne = 'Фото 1';
const defaultRuNamePhotoTwo = 'Фото 2';
const defaultRuNamePhotoThree = 'Фото 3';
const defaultRuNameSizeOne = '10x15';
const defaultRuNameSizeTwo = '15x20';
const defaultRuNameSizeThree = '20x30';

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
      showSelectAllDigital: {
        show: false,
        ruName: defaultRuNameSelectAllDigital,
      },
      photoOne: {
        show: false,
        ruName: defaultRuNamePhotoOne,
      },
      photoTwo: {
        show: false,
        ruName: defaultRuNamePhotoTwo,
      },
      photoThree: {
        show: false,
        ruName: defaultRuNamePhotoThree,
      },
      sizeOne: {
        show: false,
        ruName: defaultRuNameSizeOne,
      },
      sizeTwo: {
        show: false,
        ruName: defaultRuNameSizeTwo,
      },
      sizeThree: {
        show: false,
        ruName: defaultRuNameSizeThree,
      },
    });
    return this.repository.save(settings);
  }

  async updateSettings(folderId: number, updateSettingsDto: UpdateFolderSettingsDto): Promise<FolderSettingsEntity> {
    const settings = await this.repository.findOne({ where: { folderId } });
    if (!settings) {
      throw new NotFoundException('Settings not found');
    }
    console.log('updateSettingsDto', updateSettingsDto);
    const { settingName, newName, show, ...otherUpdates } = updateSettingsDto;

    if (settingName && newName) {
      if (settings[settingName]) {
        settings[settingName].ruName = newName;
      } else {
        throw new NotFoundException(`Setting ${settingName} not found`);
      }
    } else {
      Object.assign(settings, otherUpdates);
    }
  
    if (settingName && isBoolean(show)) {
      if (settings[settingName]) {
        settings[settingName].show = show;
      } else {
        throw new NotFoundException(`Setting ${settingName} not found`);
      }
    } else {
      Object.assign(settings, otherUpdates);
    }

    return this.repository.save(settings);
  }
}