import { Module } from '@nestjs/common';
import { ProductController } from './controller/product.controller';
import { ProductService } from './service/product.service';
import { CommonModule } from '../common/common.module';

@Module({
  controllers: [ProductController],
  imports: [CommonModule],
  providers: [ProductService],
  exports: [ProductService]
})
export class ProductModule {}
