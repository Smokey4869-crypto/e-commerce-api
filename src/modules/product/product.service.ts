// product.service.ts
import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../../common/supabase.service';
import { PlantRow } from '../../models/product';
import { ErrorOr } from '../../errors/error-or';
import { Errors } from '../../errors/predefined-errors';

@Injectable()
export class ProductService {
  constructor(private supabaseService: SupabaseService) {}

  async fetchAllPlants(): Promise<ErrorOr<PlantRow[]>> {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('products')
      .select();

    if (error) {
      return {
        error: Errors.FetchFailed(error.message),
      };
    }

    return { data };
  }

  async fetchPlant(productId: number): Promise<ErrorOr<PlantRow>> {
    const { data, error } = await this.supabaseService
        .getClient()
        .from('products')
        .select()
        .eq('productid', productId);

    if (error) {
        return {
            error: Errors.FetchFailed(error.message)
        };
    }

    return { data: data[0] as PlantRow };
  }
}
