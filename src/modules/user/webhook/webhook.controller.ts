import { Controller, Post, Req, Res, Headers, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';
import { WebhookService } from './webhook.service';
import { ConfigService } from '@nestjs/config';

@Controller('webhook')
export class WebhookController {
  constructor(
    private readonly webhookService: WebhookService,
    private readonly configService: ConfigService,
  ) {}

  @Post('stripe')
  async handleStripeWebhook(@Req() req: Request, @Res() res: Response, @Headers('stripe-signature') sig: string) {
    const rawBody = (req as any).rawBody; // Ensure raw body is available
    try {
      await this.webhookService.handleWebhook(rawBody, sig);
      res.status(200).json({ received: true });
    } catch (err) {
      console.error(err.message);
      throw new HttpException(err.message, err.status || HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
