export interface CheckoutItem {
  productid: number;
  name: string;
  image: string;
  total_price: number;
  price_id: string;
  quantity: number;
  product_include: string;
};

export interface DeliveryOptions {
  address_line1: string;
  address_line2?: string;
  city: string;
  postal_code: string;
  state: string;
  country: string;
  shipping_fee: number;
}

export interface UserMetadata {
  email: string;
  name: string;
}

export interface OrderMetadata {
  [key: string]: string;
}

export interface LineItem {
  price: string;
  quantity: number;
}

export type OrderItem = {
  order_id: string;
  productid: number;
  quantity: number;
  price: number;
  image?: string;
  name?: string;
  product_include?: string;
};
