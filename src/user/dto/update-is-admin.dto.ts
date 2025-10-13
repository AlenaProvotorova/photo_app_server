import { IsBoolean } from "class-validator";

export class UpdateIsAdminDto {
  @IsBoolean()
  isAdmin: boolean; 
}