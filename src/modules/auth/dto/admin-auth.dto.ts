import { IsEmail, IsString } from 'class-validator';

export class AdminAuthDto {
  @IsEmail()
  username: string;

  @IsString()
  password: string;
}
