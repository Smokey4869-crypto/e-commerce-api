export class CreateCartItemDto {
  productid: number;
  quantity: number;
  cartId?: string; // Optional: Only needed if adding to an existing cart
  userId?: string; // Optional: Only needed if creating a new cart
}
