import { Controller, Get } from '@nestjs/common';
import { SupabaseService } from './supabase.service';

@Controller('test-supabase')
export class TestSupabaseController {
  constructor(private readonly supabaseService: SupabaseService) {}

  @Get()
  async testConnection() {
    try {
      const client = this.supabaseService.getClient();
      const { data, error } = await client.from('products').select('*').limit(1);

      if (error) {
        return { success: false, message: `Connection failed: ${error.message}` };
      }

      return { success: true, message: 'Connected successfully', data };
    } catch (error) {
      return { success: false, message: `An error occurred: ${error.message}` };
    }
  }
}
