import { Controller, Get, Post, Put, Body, Req, Res } from '@nestjs/common';
import { UserCartService } from './user-cart.service';
import { CreateCartItemDto } from './dto/create-cart-item.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { Request, Response } from 'express';

@Controller('user/cart')
export class UserCartController {
  constructor(private readonly cartService: UserCartService) {}

  @Get()
  async fetchCart(@Req() req: Request, @Res() res: Response) {
    const userId = req['user']?.userId;
    const cartId = req['user']?.cartId;

    const cart = await this.cartService.fetchCart(userId, cartId);

    if ('error' in cart) {
      return res.status(cart.statusCode).json(cart);
    }

    return res.status(200).json(cart);
  }

  @Post()
  async addToCart(@Body() createCartItemDto: CreateCartItemDto, @Res() res: Response) {
    const cartItem = await this.cartService.addToCart(createCartItemDto);

    if ('error' in cartItem) {
      return res.status(cartItem.statusCode).json(cartItem);
    }

    return res.status(200).json(cartItem);
  }

  @Put()
  async updateCartItem(@Body() updateCartItemDto: UpdateCartItemDto, @Res() res: Response) {
    const updatedItem = await this.cartService.updateCartItem(updateCartItemDto);

    if ('error' in updatedItem) {
      return res.status(updatedItem.statusCode).json(updatedItem);
    }

    return res.status(200).json(updatedItem);
  }
}
