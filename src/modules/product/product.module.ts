import { Module } from '@nestjs/common';
import { ProductController } from './product.controller';
import { ProductService } from './product.service';
import { SupabaseService } from '../../common/supabase.service';
import { CommonModule } from '../../common/common.module';

@Module({
  imports: [CommonModule],
  controllers: [ProductController],
  providers: [ProductService, SupabaseService]
})
export class ProductModule {}
