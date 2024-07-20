import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CheckoutController } from './checkout.controller';
import { CheckoutService } from './checkout.service';
import { CommonModule } from '../../../common/common.module'; // Adjust the path as necessary

@Module({
  imports: [
    ConfigModule,
    CommonModule,
  ],
  controllers: [CheckoutController],
  providers: [CheckoutService],
})
export class CheckoutModule {}
