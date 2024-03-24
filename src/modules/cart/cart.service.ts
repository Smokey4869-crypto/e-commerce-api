import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../../common/supabase.service';

@Injectable()
export class CartService {
    constructor(private supabaseService: SupabaseService) {}

    
}
