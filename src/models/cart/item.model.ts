export type CartItem = {
    productid: number;
    name: string;
    image_urls: string[];
    category: string;
    price: number;
    quantity: number;
    selected: boolean;
    price_id: string;
    product_include: string;
    id?: number | null;
  };