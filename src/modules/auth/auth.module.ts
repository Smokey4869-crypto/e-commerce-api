import { Module } from '@nestjs/common';
import { CommonModule } from '../common/common.module';
import { UserAuthService } from './services/user-auth.service';
import { AdminAuthService } from './services/admin-auth.service';
import { UserTokenService } from './services/user-token.service';
import { UserAuthController } from './controller/user-auth.controller';
import { AdminAuthController } from './controller/admin-auth.controller';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    CommonModule,
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_ACCESS_SECRET_KEY'),
        signOptions: { expiresIn: '15m' },
      }),
    }),
  ],
  providers: [
    UserAuthService,
    AdminAuthService,
    UserTokenService,
  ],
  controllers: [
    UserAuthController,
    AdminAuthController
  ],
  exports: [
    UserAuthService,
    AdminAuthService
  ],
})
export class AuthModule {}
