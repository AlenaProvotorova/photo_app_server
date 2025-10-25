import { IsOptional, IsString, IsBoolean, IsNumber, IsDateString } from 'class-validator';

export class UpdateFolderSettingsDto {
  @IsOptional()
  @IsString()
  settingName?: string; 
  
  @IsOptional()
  @IsString()
  newName?: string;    
  
  @IsOptional()
  @IsBoolean()
  show?: boolean;

  @IsOptional()
  @IsNumber()
  price?: number;

  @IsOptional()
  @IsDateString()
  dateSelectTo?: string; // Формат: "YYYY-MM-DDTHH:mm:ss.sss" или "YYYY-MM-DDTHH:mm:ss.sssZ"
}