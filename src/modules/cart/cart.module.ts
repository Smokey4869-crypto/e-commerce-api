import { Module } from '@nestjs/common';
// import { AdminCartService } from './service/admin-cart.service';
import { SupabaseService } from '../common/supabase.service';
import { UserCartController } from './user/user-cart.controller';
import { UserCartService } from './user/user-cart.service';
// import { AdminCartController } from './controller/admin-cart.controller';

@Module({
  controllers: [UserCartController],
  providers: [UserCartService, SupabaseService],
})
export class AdminCartModule {}
