import { Module } from '@nestjs/common';
import { CommonModule } from '../common/common.module';
import { UserAuthService } from './services/user-auth.service';
// import { AdminAuthService } from './services/admin-auth.service';
import { UserTokenService } from './services/user-token.service';
// import { AdminTokenService } from './services/admin-token.service';
import { UserAuthController } from './controllers/user-auth.controller';
// import { AdminAuthController } from './controllers/admin-auth.controller';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule, JwtService } from '@nestjs/jwt';

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
    // AdminAuthService,
    UserTokenService,
    // AdminTokenService,
  ],
  controllers: [
    UserAuthController,
    // AdminAuthController
  ],
  exports: [
    UserAuthService,
    // AdminAuthService,
    UserTokenService,
    // AdminTokenService,
  ],
})
export class AuthModule {}
