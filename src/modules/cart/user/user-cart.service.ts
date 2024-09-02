import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateCartItemDto } from './dto/create-cart-item.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { ErrorOr } from '../../../common/types/error-or.type';
import { SupabaseService } from '../../common/supabase.service';

@Injectable()
export class UserCartService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async fetchCart(userId?: string, cartId?: string): Promise<ErrorOr<any>> {
    let cart;

    try {
      if (userId) {
        const { data, error } = await this.supabaseService
          .getClient()
          .from('cart')
          .select(`id, cart_items (*)`)
          .eq('user_id', userId)
          .eq('is_active', true)
          .single();

        if (error || !data) {
          return await this.createNewCart(userId);
        }

        cart = data;
      } else if (cartId) {
        const { data, error } = await this.supabaseService
          .getClient()
          .from('cart')
          .select(`id, cart_items (*)`)
          .eq('id', cartId)
          .eq('is_active', true)
          .single();

        if (error || !data) {
          return await this.createNewCart(undefined, cartId);
        }

        cart = data;
      } else {
        return {
          error: 'Bad Request: No cart or user identifier provided',
          statusCode: 400,
        };
      }

      return cart;
    } catch (error) {
      return {
        error: 'Unable to fetch cart',
        details: error.message,
        statusCode: 500,
      };
    }
  }

  private async createNewCart(userId?: string, cartId?: string): Promise<any> {
    const { data: newCart, error } = await this.supabaseService
      .getClient()
      .from('cart')
      .insert({
        user_id: userId || null,
        id: cartId || undefined,
        is_active: true,
        status: 'active',
      })
      .select()
      .single();

    if (error) {
      return {
        error: 'Unable to create a new cart',
        details: error.message,
        statusCode: 500,
      };
    }

    return newCart;
  }

  async addToCart(dto: CreateCartItemDto): Promise<ErrorOr<any>> {
    try {
      let cartId = dto.cartId;

      if (!cartId) {
        const existingCart = await this.fetchCart(dto.userId);

        if ('error' in existingCart) {
          return existingCart;
        }

        cartId = existingCart.id;
      }

      const { data: newCartItem, error } = await this.supabaseService
        .getClient()
        .from('cart_items')
        .insert({
          productid: dto.productid,
          quantity: dto.quantity,
          cart_id: cartId,
        })
        .select();

      if (error) {
        return {
          error: 'Unable to add item to cart',
          details: error.message,
          statusCode: 500,
        };
      }

      return newCartItem;
    } catch (error) {
      return {
        error: 'Unable to add item to cart',
        details: error.message,
        statusCode: 500,
      };
    }
  }

  async updateCartItem(dto: UpdateCartItemDto): Promise<ErrorOr<any>> {
    try {
      const isActive = dto.quantity > 0;

      const { data, error } = await this.supabaseService
        .getClient()
        .from('cart_items')
        .update({
          quantity: isActive ? dto.quantity : 0,
          is_active: isActive,
        })
        .eq('cart_id', dto.cartId)
        .eq('productid', dto.productid)
        .eq('is_active', true);

      if (error) {
        return {
          error: 'Unable to update cart item',
          details: error.message,
          statusCode: 500,
        };
      }

      if (dto.disableCart && !isActive) {
        await this.disableCart(dto.cartId);
      }

      return data;
    } catch (error) {
      return {
        error: 'Unable to update cart item',
        details: error.message,
        statusCode: 500,
      };
    }
  }

  private async disableCart(cartId: string): Promise<void> {
    await this.supabaseService
      .getClient()
      .from('cart')
      .update({
        status: 'cleared',
        is_active: false,
      })
      .eq('id', cartId);
  }
}
