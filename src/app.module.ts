import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { CartModule } from './modules/cart/cart.module';
import { ConfigModule } from '@nestjs/config';
import { AuthMiddleware } from './middleware/auth.middleware'; 
import { ProductModule } from './modules/product/product.module';
import { SelfPingModule } from './modules/self-ping/self-ping.module';
import { CheckoutModule } from './modules/checkout/checkout.module';
import { WebhookModule } from './modules/webhook/webhook.module';

@Module({
  imports: [
    ProductModule,
    AuthModule,
    CartModule,
    SelfPingModule,
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    CheckoutModule,
    WebhookModule,
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
