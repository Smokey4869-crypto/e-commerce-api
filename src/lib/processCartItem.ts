import { CartItem } from "../models/cart";
import { OrderItem } from "../models/checkout";
import { PlantRow } from "../models/product";

export default function productToCartItem(product: PlantRow): CartItem {
  return {
    productid: product.productid,
    name: product.name,
    image_urls: [product.image_urls[0]],
    category: product.category,
    price: product.price,
    quantity: 1, 
    selected: false, 
    price_id: product.price_id,
    product_include: product.product_include,
  };
}

export function tableRowToCartItem(row: any, products: PlantRow[]): CartItem {
  const product = products.find((e) => e.productid === row.productid);
  
  return {
    productid: row.productid,
    name: product!.name,
    image_urls: [product!.image_urls[0]],
    category: product!.category,
    price: product!.price,
    quantity: row.quantity, 
    selected: false, 
    id: row.id,
    price_id: product!.price_id,
    product_include: product!.product_include,
  };
}

export function cartItemsToOrderItemRows(
  items: CartItem[],
  orderId: string,
): OrderItem[] {
  return items.map((item) => ({
    order_id: orderId,
    productid: item.productid,
    quantity: item.quantity,
    price: item.quantity * item.price,
  }));
}