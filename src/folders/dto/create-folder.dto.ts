import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateFolderDto {
  @ApiProperty({ example: 'Vacation Photos' })
  @IsString()
  @IsNotEmpty()
  name: string;
}