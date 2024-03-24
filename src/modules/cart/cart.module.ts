import { Module } from '@nestjs/common';
import { CartService } from './cart.service';
import { CommonModule } from '../../common/common.module';
import { CartController } from './cart.controller';

@Module({
  providers: [CartService],
  imports: [CommonModule],
  controllers: [CartController]
})
export class CartModule {}
