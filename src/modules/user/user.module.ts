import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { CartModule } from './cart/cart.module';
import { ProductModule } from './product/product.module';
import { CheckoutModule } from './checkout/checkout.module';
import { WebhookModule } from './webhook/webhook.module';
import { OrderModule } from './order/order.module';

@Module({
  imports: [
    AuthModule,
    CartModule,
    ProductModule,
    CheckoutModule,
    WebhookModule,
    // OrderModule,
  ],
})
export class UserModule {}
