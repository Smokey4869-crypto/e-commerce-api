import {
  Controller,
  Get,
  Post,
  Put,
  Req,
  Res,
  Body,
  BadRequestException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { CartService } from './cart.service';

@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  async fetchCart(@Req() req: Request, @Res() res: Response) {
    const userId = req.headers['x-user-id'] as string | undefined;
    const cartId = req.headers['x-cart-id'] as string | undefined;

    try {
      const cart = await this.cartService.fetchCart(userId, cartId);
      res.status(200).json({ message: 'Active cart fetched', cart });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  @Post()
  async addToCart(
    @Req() req: Request,
    @Res() res: Response,
    @Body() body: any,
  ) {
    const userId = req.headers['x-user-id'] as string | undefined;
    const cartId = req.headers['x-cart-id'] as string | undefined;
    const { productid, quantity } = body;

    if (typeof productid !== 'number' || typeof quantity !== 'number') {
      throw new BadRequestException('Invalid productid or quantity');
    }

    try {
      const newCartItem = await this.cartService.addToCart(
        userId,
        cartId,
        productid,
        quantity,
      );
      res
        .status(200)
        .json({
          item: newCartItem,
          message: 'Item added to cart successfully',
        });
    } catch (error) {
      res
        .status(500)
        .json({ error: 'Unable to add item to cart', details: error.message });
    }
  }

  @Put()
  async updateCartItem(
    @Req() req: Request,
    @Res() res: Response,
    @Body() body: any,
  ) {
    const { quantity, productid, cart_id, disable_cart } = body;
    if (
      typeof quantity !== 'number' ||
      typeof productid !== 'number' ||
      typeof cart_id !== 'string'
    ) {
      throw new BadRequestException('Invalid request data');
    }

    try {
      const result = await this.cartService.updateCartItem(
        cart_id,
        productid,
        quantity,
        disable_cart,
      );
      res.status(200).json(result);
    } catch (error) {
      res
        .status(500)
        .json({ error: 'Unable to update cart item', details: error.message });
    }
  }

  @Put('batch')
  async updateCartItemsBatch(
    @Req() req: Request,
    @Res() res: Response,
    @Body() body: any,
  ) {
    const cartId = req.headers['x-cart-id'] as string | undefined;

    if (!cartId) {
      throw new BadRequestException('Cart ID is required');
    }

    const { items, disable } = body;

    try {
      await this.cartService.updateCartItemsBatch(cartId, items, disable);
      res.status(200).json({ message: 'Cart items updated successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}
