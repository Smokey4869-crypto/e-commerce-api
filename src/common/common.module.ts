import { Module } from '@nestjs/common';
import { SupabaseService } from './supabase.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  providers: [SupabaseService],
  exports: [SupabaseService],
})
export class CommonModule {}
