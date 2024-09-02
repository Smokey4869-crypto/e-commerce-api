import { Module } from '@nestjs/common';
import { UserCartController } from './user-cart.controller';
import { SupabaseService } from '../../common/supabase.service';
import { UserCartService } from './user-cart.service';

@Module({
  controllers: [UserCartController],
  providers: [UserCartService, SupabaseService],
})
export class UserCartModule {}
