export class UpdateCartItemDto {
  quantity: number;
  productid: number;
  cartId: string;
  disableCart?: boolean;
}
