import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSizeDto {
  @ApiProperty({ example: 'Size' })
  @IsString()
  @IsNotEmpty()
  name: string;
}