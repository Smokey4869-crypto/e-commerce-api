import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { AuthMiddleware } from './middleware/auth.middleware'; 
import { SelfPingModule } from './modules/self-ping/self-ping.module';
import { UserModule } from './modules/user/user.module'; // Import the new UserModule
import { RawBodyMiddleware } from './middleware/raw-body.middleware';

@Module({
  imports: [
    UserModule,
    SelfPingModule,
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthMiddleware)
      .forRoutes('*')
    consumer
      .apply(RawBodyMiddleware)
      .forRoutes('user/webhook/stripe');  ;  // Apply globally or specify routes as needed
  }
}
