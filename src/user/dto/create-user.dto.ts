import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, MinLength } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ default: 'John Doe' })
  name: string;
  
  @IsEmail()
  @ApiProperty({ default: 'test@test.com' })
  email: string;
  
  @MinLength(6, { message: 'Password must be more than 6 symbols' })
  @ApiProperty({ default: '123456' })
  password: string;
}
