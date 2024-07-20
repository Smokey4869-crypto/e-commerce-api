import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SupabaseService } from '../../common/supabase.service';
import Stripe from 'stripe';
import { buffer } from 'micro';
import { CART_STATUS_ENUM } from '../../constants/enum/cart-status.enum';
import { CartItem } from '../../models/cart';
import { OrderItem } from '../../models/checkout';
import { ConfidentialClientApplication } from '@azure/msal-node';
import crypto from 'crypto';
import { cartItemsToOrderItemRows } from '../../lib/processCartItem';
import { generateEmailContent } from '../../lib/generateEmailContent';

@Injectable()
export class WebhookService {
  private stripe: Stripe;
  private clientApp: ConfidentialClientApplication;

  constructor(
    private configService: ConfigService,
    private supabaseService: SupabaseService,
  ) {
    this.stripe = new Stripe(configService.get<string>('SECRET_STRIPE_KEY'), {
      apiVersion: '2024-06-20',
    });

    const msalConfig = {
      auth: {
        clientId: configService.get<string>('AZURE_CLIENT_ID'),
        authority: `https://login.microsoftonline.com/${configService.get<string>('AZURE_TENANT_ID')}`,
        clientSecret: configService.get<string>('AZURE_CLIENT_SECRET'),
      },
    };

    this.clientApp = new ConfidentialClientApplication(msalConfig);
  }

  async handleWebhook(rawBody: Buffer, sig: string) {
    const webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET');
    let event;

    try {
      event = this.stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
    } catch (error) {
      throw new HttpException(`Webhook Error: ${error.message}`, HttpStatus.BAD_REQUEST);
    }

    const orderData = event?.data?.object;
    const orderMetadata = event?.data?.object.metadata;

    switch (event.type) {
      case 'checkout.session.completed':
        try {
          await this.handleCheckoutSessionCompleted(orderData, orderMetadata);
        } catch (error) {
          throw new HttpException(`Error handling checkout.session.completed: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
        }
        break;
      default:
        throw new HttpException(`Unhandled event type ${event.type}`, HttpStatus.BAD_REQUEST);
    }
  }

  private async handleCheckoutSessionCompleted(orderData: any, orderMetadata: any) {
    await this.processOrder(orderData, orderMetadata);
  }

  private async processOrder(orderData: any, orderMetadata: any) {
    const cartId = orderMetadata.cart_id;
    const customerFacingId = this.generateCustomerFacingId();
    const userId = orderMetadata.authenticated === 'true' ? orderMetadata.user_id : null;

    const supabase = this.supabaseService.getClient();
    const { data: newOrder, error } = await supabase
      .from('orders')
      .insert({
        user_id: userId,
        total_price: orderData.amount_total / 100,
        delivery_address: {
          address_line1: orderData.customer_details.address.line1,
          address_line2: orderData.customer_details.address.line2,
          city: orderData.customer_details.address.city,
          postal_code: orderData.customer_details.address.postal_code,
          country: orderData.customer_details.address.country,
          telephone: orderData.customer_details.phone,
        },
        shipping_method: orderMetadata.shipping_method,
        shipping_fee: orderMetadata.shipping_fee,
        comment: orderMetadata.comment,
        checkout_session: {
          session_id: orderData.id,
          data: orderData,
        },
        cart_id: cartId,
        customer_facing_id: customerFacingId,
      })
      .select('id');

    if (error || !newOrder) {
      throw new Error(`Error inserting new order: ${error?.message}`);
    }

    const orderId = newOrder[0].id;
    const orderItems = await this.addOrderItems(cartId, orderId);
    await this.updateCartStatus(cartId);
    await this.sendOrderConfirmationEmail(orderData.customer_details.email, orderMetadata, customerFacingId, orderItems);
  }

  private async addOrderItems(cartId: number, orderId: string) {
    const supabase = this.supabaseService.getClient();
    const { data: newOrderItems, error: orderItemsError } = await supabase
      .from('cart_items')
      .select(`
        *,
        product:productid (
          price,
          name
        )
      `)
      .eq('cart_id', cartId);

    if (orderItemsError) {
      throw new Error(`Error fetching cart items: ${orderItemsError.message}`);
    }

    if (!newOrderItems || newOrderItems.length === 0) {
      throw new Error('No items found in cart');
    }

    const adjustedOrderItems = newOrderItems.map(item => ({
      ...item,
      price: item.product.price,
    }));

    const newOrderItemRows = cartItemsToOrderItemRows(adjustedOrderItems as CartItem[], orderId);

    // for email sending
    const newOrderItemContent = newOrderItemRows.map((row, index) => ({
      ...row,
      name: newOrderItems[index].name,
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(newOrderItemRows);

    if (itemsError) {
      throw new Error(`Error inserting order items: ${itemsError.message}`);
    }

    return newOrderItemContent;
  }

  private async updateCartStatus(cartId: number) {
    const supabase = this.supabaseService.getClient();
    const { error } = await supabase
      .from('cart')
      .update({
        status: CART_STATUS_ENUM.PURCHASED,
        is_active: false,
      })
      .eq('id', cartId);

    if (error) {
      throw new Error(`Error updating cart status: ${error.message}`);
    }

    const { error: error_items } = await supabase
      .from('cart_items')
      .update({
        is_active: false,
      })
      .eq('cart_id', cartId);

    if (error_items) {
      throw new Error(`Error updating cart items status: ${error_items.message}`);
    }
  }

  private async sendOrderConfirmationEmail(customerEmail: string, orderMetadata: any, customerFacingId: string, orderItems: OrderItem[]) {
    const accessToken = await this.getAccessToken();
    const emailResponse = await fetch(`https://graph.microsoft.com/v1.0/users/orders@growplante.com/sendMail`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: {
          subject: 'Order Confirmation',
          body: {
            contentType: 'HTML',
            content: generateEmailContent(orderMetadata, customerFacingId, orderItems),
          },
          toRecipients: [
            { emailAddress: { address: customerEmail } },
          ],
        },
        saveToSentItems: 'true',
      }),
    });

    if (!emailResponse.ok) {
      const errorResponse = await emailResponse.json();
      console.error('Graph API Error Response:', errorResponse);
      throw new Error(`Email send failed: ${emailResponse.status}`);
    }
  }

  private generateCustomerFacingId(): string {
    const randomString = crypto.randomBytes(3).toString('hex').toUpperCase();
    return `ORDER-${randomString}`;
  }

  private async getAccessToken(): Promise<string> {
    const result = await this.clientApp.acquireTokenByClientCredential({
      scopes: ['https://graph.microsoft.com/.default'],
    });
    if (!result || !result.accessToken) {
      throw new Error('Failed to acquire access token');
    }
    return result.accessToken;
  }
}
