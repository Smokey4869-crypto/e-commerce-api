import { Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../../common/supabase.service';
import { ProductEntity } from '../entities/product.entity';

@Injectable()
export class ProductService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async findAll(): Promise<ProductEntity[]> {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('products')
      .select('*');

    if (error) {
      throw new NotFoundException('No products found');
    }

    return data as ProductEntity[];
  }

  async findOne(id: number): Promise<ProductEntity> {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('products')
      .select('*')
      .eq('productid', id)
      .single();

    if (error || !data) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    return data as ProductEntity;
  }

  async create(product: ProductEntity): Promise<ProductEntity> {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('products')
      .insert([product])
      .single();

    if (error) {
      throw new Error('Error creating product');
    }

    return data as ProductEntity;
  }

  async update(id: number, updateProductDto: Partial<ProductEntity>): Promise<ProductEntity> {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('products')
      .update(updateProductDto)
      .eq('productid', id)
      .single();

    if (error || !data) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    return data as ProductEntity;
  }

  async remove(id: number): Promise<void> {
    const { error } = await this.supabaseService
      .getClient()
      .from('products')
      .delete()
      .eq('productid', id);

    if (error) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }
  }
}
