import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { SupabaseService } from '../../common/supabase.service';

@Injectable()
export class CartService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async fetchCart(userId: string | undefined, cartId: string | undefined) {
    try {
      let cart;

      if (userId) {
        const { data, error } = await this.supabaseService.getClient()
          .from('cart')
          .select(`id, cart_items (*)`)
          .eq('user_id', userId)
          .filter('cart_items.is_active', 'eq', true)
          .filter('is_active', 'eq', true)
          .single();

        if (error || !data) {
          const { data: newCart, error: insertError } = await this.supabaseService.getClient()
            .from('cart')
            .insert({
              user_id: userId,
              is_active: true,
              status: 'active',
            })
            .select()
            .single();

          if (insertError) {
            throw new InternalServerErrorException('Unable to create a new cart');
          }

          cart = newCart;
        } else {
          cart = data;
        }
      } else if (cartId) {
        const { data, error } = await this.supabaseService.getClient()
          .from('cart')
          .select(`id, cart_items (*)`)
          .eq('id', cartId)
          .filter('cart_items.is_active', 'eq', true)
          .filter('is_active', 'eq', true)
          .single();

        if (error || !data) {
          const { data: newCart, error: insertError } = await this.supabaseService.getClient()
            .from('cart')
            .insert({
              id: cartId,
              is_active: true,
              status: 'active',
              user_id: null,
            })
            .select()
            .single();

          if (insertError) {
            throw new InternalServerErrorException('Unable to create a new cart for guest');
          }

          cart = newCart;
        } else {
          cart = data;
        }
      } else {
        throw new BadRequestException('No cart or user identifier provided');
      }

      return cart;
    } catch (error) {
      throw new InternalServerErrorException('Unable to fetch a cart');
    }
  }

  async addToCart(userId: string | undefined, cartId: string | undefined, productId: number, quantity: number) {
    try {
      let activeCartId = cartId;

      if (cartId) {
        const { data: cart, error: cartError } = await this.supabaseService.getClient()
          .from('cart')
          .select('id, is_active')
          .eq('id', cartId)
          .single();

        if (cartError || !cart.is_active) {
          activeCartId = ''; 
        }
      }

      if (activeCartId === '') {
        const { data: existingActiveCart, error } = await this.supabaseService.getClient()
          .from('cart')
          .select('id')
          .eq('user_id', userId)
          .eq('is_active', true)
          .single();

        activeCartId = existingActiveCart?.id;

        if (!existingActiveCart) {
          const { data: newCart, error: newCartError } = await this.supabaseService.getClient()
            .from('cart')
            .insert({
              user_id: userId,
              is_active: true,
              status: 'active',
            })
            .select();

          if (newCartError) throw newCartError;

          activeCartId = newCart[0].id!;
        }
      }

      const { data: newCartItem, error: addItemError } = await this.supabaseService.getClient().from('cart_items').insert({
        productid: productId,
        quantity: quantity,
        cart_id: activeCartId,
      }).select();

      if (addItemError) throw addItemError;

      return newCartItem;
    } catch (error) {
      throw new InternalServerErrorException('Unable to add item to cart');
    }
  }

  async updateCartItem(cartId: string, productId: number, quantity: number, disableCart: boolean) {
    try {
      const isActive = quantity > 0;

      const { data, error } = await this.supabaseService.getClient()
        .from('cart_items')
        .update({
          quantity: isActive ? quantity : 0,
          is_active: isActive,
        })
        .eq('is_active', true)
        .eq('cart_id', cartId)
        .eq('productid', productId);

      if (error) throw error;

      if (disableCart) {
        await this.supabaseService.getClient()
          .from('cart')
          .update({
            status: 'cleared',
            is_active: false,
          })
          .eq('id', cartId);
      }

      return { message: 'Cart item updated successfully' };
    } catch (error) {
      throw new InternalServerErrorException('Unable to update cart item');
    }
  }

  async updateCartItemsBatch(cartId: string, items: any[], disable: boolean): Promise<void> {
    const updates = items.map((item) => ({
      id: item.id,
      is_active: item.quantity > 0,
      quantity: item.quantity > 0 ? item.quantity : 0,
    }));

    const { error: updateError } = await this.supabaseService
      .getClient()
      .from('cart_items')
      .upsert(updates);

    if (updateError) {
      throw new Error(`Unable to update cart items: ${updateError.message}`);
    }

    if (disable) {
      const { error: disableError } = await this.supabaseService
        .getClient()
        .from('cart')
        .update({
          status: 'cleared',
          is_active: false,
        })
        .eq('id', cartId);

      if (disableError) {
        throw new Error(`Unable to disable cart: ${disableError.message}`);
      }
    }
  }
}
