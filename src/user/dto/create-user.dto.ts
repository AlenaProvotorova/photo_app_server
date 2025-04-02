import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsEmail, MinLength } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ default: 'admin' })
  name: string;
  
  @IsEmail()
  @ApiProperty({ default: 'admin@yandex.ru' })
  email: string;
  
  @MinLength(6, { message: 'Password must be more than 6 symbols' })
  @ApiProperty({ default: '123456' })
  password: string;
}
