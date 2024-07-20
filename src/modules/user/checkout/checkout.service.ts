import { Injectable } from '@nestjs/common';
import Stripe from 'stripe';
import { SupabaseService } from '../../../common/supabase.service'; // Adjust the path as necessary
import { CheckoutItem, DeliveryOptions, UserMetadata, OrderMetadata, LineItem } from '../../../models/checkout/index';

@Injectable()
export class CheckoutService {
  private readonly stripe: Stripe;

  constructor(private readonly supabaseService: SupabaseService) {
    this.stripe = new Stripe(process.env.SECRET_STRIPE_KEY, {
      apiVersion: '2024-06-20',
    });
  }

  async createCheckoutSession(cartId: string, body: {
    checkout_items: CheckoutItem[];
    shipping_rate: string;
    delivery_options: DeliveryOptions;
    user_metadata: UserMetadata;
    order_metadata: OrderMetadata;
  }, origin: string) {
    const { checkout_items, shipping_rate, delivery_options, user_metadata, order_metadata } = body;
    order_metadata.cart_id = cartId;

    const customers = await this.stripe.customers.list({
      email: user_metadata.email,
    });

    const customer = customers.data.length === 0
      ? await this.stripe.customers.create({
          email: user_metadata.email,
          tax_exempt: 'exempt',
          address: {
            line1: delivery_options.address_line1,
            line2: delivery_options.address_line2,
            city: delivery_options.city,
            postal_code: delivery_options.postal_code,
            country: delivery_options.country,
            state: delivery_options.state,
          },
        })
      : customers.data[0];

    const lineItems = await this.checkoutItemsToLineItems(checkout_items);

    const session = await this.stripe.checkout.sessions.create({
      line_items: lineItems,
      mode: 'payment',
      success_url: `${origin}/checkout_result?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/cart`,
      shipping_options: [
        {
          shipping_rate: shipping_rate,
        },
      ],
      customer: customer.id,
      metadata: order_metadata,
      allow_promotion_codes: true,
    });

    return {
      url: session.url,
      delivery_options,
      session_id: session.id,
    };
  }

  private async checkoutItemsToLineItems(checkoutItems: CheckoutItem[]): Promise<LineItem[]> {
    const itemIds = checkoutItems.map((item) => item.productid);

    const supabase = this.supabaseService.getClient();
    const { data, error } = await supabase
      .from('products')
      .select('productid, price_id')
      .in('productid', itemIds);

    if (error) {
      console.log(error);
    }

    const priceMap = data?.reduce((acc: { [key: string]: string }, item: any) => {
      acc[item.productid] = item.price_id;
      return acc;
    }, {});

    const lineItems: LineItem[] = checkoutItems.map((item) => ({
      price: priceMap![item.productid],
      quantity: item.quantity,
    }));

    return lineItems;
  }
}
