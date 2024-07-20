import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CommonModule } from '../../../common/common.module';
import { AuthController } from './auth.controller';

@Module({
  imports: [CommonModule],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
