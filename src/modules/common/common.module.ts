import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SupabaseService } from './supabase.service';
import { TestSupabaseController } from './test-supabase.controller';

@Module({
  imports: [ConfigModule.forRoot({
    isGlobal: true,
  })],
  providers: [SupabaseService],
  controllers: [TestSupabaseController],
  exports: [SupabaseService],
})
export class CommonModule {}
