import { Controller, Post, Body, Req, Res, Headers, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';
import { CheckoutService } from './checkout.service';
import { CheckoutItem, DeliveryOptions, UserMetadata, OrderMetadata } from '../../models/checkout/index';

@Controller('checkout')
export class CheckoutController {
  constructor(private readonly checkoutService: CheckoutService) {}

  @Post()
  async handleCheckout(
    @Req() req: Request,
    @Res() res: Response,
    @Headers('x-cart-id') cartId: string,
    @Body() body: {
      checkout_items: CheckoutItem[];
      shipping_rate: string;
      delivery_options: DeliveryOptions;
      user_metadata: UserMetadata;
      order_metadata: OrderMetadata;
    }
  ) {
    try {
      const session = await this.checkoutService.createCheckoutSession(cartId, body, req.headers.origin);
      res.status(200).json(session);
    } catch (err) {
      console.error(err.message);
      throw new HttpException(err.message, err.statusCode || HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
