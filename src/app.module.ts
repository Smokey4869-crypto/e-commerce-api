import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { AuthMiddleware } from './middleware/auth.middleware'; 
import { SelfPingModule } from './modules/self-ping/self-ping.module';
import { UserModule } from './modules/user/user.module'; // Import the new UserModule

@Module({
  imports: [
    UserModule, // Import UserModule instead of individual user modules
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
      .forRoutes('*');  // Apply globally or specify routes as needed
  }
}
