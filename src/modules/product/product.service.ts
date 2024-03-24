import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../../common/supabase.service';

@Injectable()
export class ProductService {
    constructor(private supabaseService: SupabaseService) {}

    async fetchAllPlants() {
        const { data, error } = await this.supabaseService.getClient()
            .from('products')
            .select();
    }
}
