import { IsString } from 'class-validator';

export class AdminAuthDto {
  @IsString()
  username: string;

  @IsString()
  password: string;
}
