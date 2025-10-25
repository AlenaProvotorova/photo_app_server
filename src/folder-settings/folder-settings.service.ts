import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { FolderSettingsEntity } from "./entities/folder-settings.entity";
import { Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";
import { UpdateFolderSettingsDto } from "./dto/update-folder-settings.dto";
import { isBoolean } from "class-validator";
import { SettingField } from "./interfaces/setting-field.interface";
import { FolderEntity } from "../folders/entities/folder.entity";

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
    @InjectRepository(FolderEntity)
    private folderRepository: Repository<FolderEntity>,
  ) {}

  async getAllSettings(folderId: number): Promise<FolderSettingsEntity> {
    return this.repository.findOne({
      where: { folderId },
      relations: ['folder'],
    });
  }

  async createDefaultSettings(folderId: number): Promise<FolderSettingsEntity> {
    // Получаем информацию о папке для установки даты
    const folder = await this.folderRepository.findOne({ where: { id: folderId } });
    if (!folder) {
      throw new NotFoundException('Folder not found');
    }

    // Устанавливаем дату как дата создания папки + 2 недели
    const dateSelectTo = new Date(folder.createdAt);
    dateSelectTo.setDate(dateSelectTo.getDate() + 14);

    const settings = this.repository.create({
      folderId,
      showSelectAllDigital: {
        show: false,
        ruName: defaultRuNameSelectAllDigital,
        price: 0,
      },
      photoOne: {
        show: false,
        ruName: defaultRuNamePhotoOne,
        price: 0,
      },
      photoTwo: {
        show: false,
        ruName: defaultRuNamePhotoTwo,
        price: 0,
      },
      photoThree: {
        show: false,
        ruName: defaultRuNamePhotoThree,
        price: 0,
      },
      sizeOne: {
        show: false,
        ruName: defaultRuNameSizeOne,
        price: 0,
      },
      sizeTwo: {
        show: false,
        ruName: defaultRuNameSizeTwo,
        price: 0,
      },
      sizeThree: {
        show: false,
        ruName: defaultRuNameSizeThree,
        price: 0,
      },
      dateSelectTo,
    });
    return this.repository.save(settings);
  }

  async updateSettings(folderId: number, updateSettingsDto: UpdateFolderSettingsDto): Promise<FolderSettingsEntity> {
    const settings = await this.repository.findOne({ where: { folderId } });
    if (!settings) {
      throw new NotFoundException('Settings not found');
    }
    
    const { settingName, newName, show, price, dateSelectTo, ...otherUpdates } = updateSettingsDto;

    // Валидация поля price
    if (price !== undefined) {
      if (typeof price !== 'number' || isNaN(price)) {
        throw new BadRequestException('Price must be a valid number');
      }
      if (price < 0) {
        throw new BadRequestException('Price cannot be negative');
      }
    }

    // Валидация поля dateSelectTo
    if (dateSelectTo !== undefined) {
      // Если дата пришла в формате "YYYY-MM-DDTHH:mm:ss.sss" без часового пояса,
      // интерпретируем её как UTC время, чтобы избежать сдвига часовых поясов
      let date: Date;
      
      if (dateSelectTo.includes('T') && !dateSelectTo.includes('Z') && !dateSelectTo.includes('+') && !dateSelectTo.includes('-', 10)) {
        // Добавляем Z чтобы интерпретировать как UTC
        date = new Date(dateSelectTo + 'Z');
      } else {
        date = new Date(dateSelectTo);
      }
      
      if (isNaN(date.getTime())) {
        throw new BadRequestException('Invalid date format for dateSelectTo');
      }
      
      settings.dateSelectTo = date;
    }

    if (settingName) {
      if (!settings[settingName]) {
        throw new NotFoundException(`Setting ${settingName} not found`);
      }

      if (newName !== undefined) {
        settings[settingName].ruName = newName;
      }

      if (isBoolean(show)) {
        settings[settingName].show = show;
      }

      if (price !== undefined) {
        settings[settingName].price = price;
      }
    } else {
      Object.assign(settings, otherUpdates);
    }

    return this.repository.save(settings);
  }
}