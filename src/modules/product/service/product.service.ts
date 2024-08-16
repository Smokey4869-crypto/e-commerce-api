import { Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../../common/supabase.service';
import { ProductDto } from '../dto/product.dto';
import { ErrorOr } from '../../../common/types/error-or.type';

@Injectable()
export class ProductService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async findAll(userRole: string): Promise<ProductDto[]> {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('products')
      .select('*');

    if (error) {
      throw new NotFoundException('No products found');
    }

    return this.filterFields(data, userRole);
  }

  async findOne(id: number, userRole: string): Promise<ProductDto> {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('products')
      .select('*')
      .eq('productid', id)
      .single();

    if (error || !data) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    return this.filterFields([data], userRole)[0];
  }

  // Filter out sensitive fields for non-admin users
  private filterFields(data: any[], userRole: string): ProductDto[] {
    if (userRole === 'admin') {
      return data as ProductDto[];
    }

    // Explicitly define the keys that should be included for normal users
    const allowedKeys = [
      'productid',
      'name',
      'link',
      'description',
      'product_include',
      'harvest_cycle',
      'flavour_characteristics',
      'height',
      'width',
      'care_technique',
      'harvesting_technique',
      'image_urls',
      'slug',
      'price',
      'price_id',
      'category',
    ];

    return data.map((product) => {
      const filteredProduct = {} as ProductDto;
      allowedKeys.forEach((key) => {
        if (product.hasOwnProperty(key)) {
          filteredProduct[key] = product[key];
        }
      });

      return filteredProduct;
    });
  }

  async create(product: ProductDto): Promise<ErrorOr<ProductDto>> {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('products')
      .insert([product])
      .select();

    if (error) {
      return {
        error: 'Error creating product',
        details: error.message,
        statusCode: error.code === '23505' ? 409 : 500,
      };
    }

    return data[0] as ProductDto;
  }

  async update(
    id: number,
    updateProductDto: Partial<ProductDto>,
  ): Promise<ErrorOr<ProductDto>> {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('products')
      .update(updateProductDto)
      .eq('productid', id)
      .select();

    if (error || !data) {
      return {
        error: `Product with ID ${id} not found`,
        details: error?.message,
        statusCode: 404,
      };
    }

    return data[0] as ProductDto;
  }

  async delete(id: number): Promise<ErrorOr<void>> {
    const { error } = await this.supabaseService
      .getClient()
      .from('products')
      .delete()
      .eq('productid', id);

    if (error) {
      return {
        error: `Product with ID ${id} not found`,
        details: error.message,
        statusCode: 404,
      };
    }
  }
}
