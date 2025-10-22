import { IsOptional, IsString, IsBoolean, IsNumber } from 'class-validator';

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
}