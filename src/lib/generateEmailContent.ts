export function generateEmailContent(orderMetadata: any, customerFacingId: string, orderItems: any): string {
    let itemsDetails = '';
    let subtotal = 0;
  
    orderItems.forEach((item: any) => {
      itemsDetails += `
        <tr>
          <td>${item.name}</td>
          <td>${item.quantity}</td>
          <td>${item.price.toFixed(2)}</td>
          <td>${(item.quantity * item.price).toFixed(2)}</td>
        </tr>
      `;
      subtotal += item.quantity * item.price;
    });
  
    return `
      <div>
        <h1>Thank you for your order!</h1>
        <p>We are processing it now. Here are the details:</p>
        <p><strong>Order ID:</strong> ${customerFacingId}</p>
        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th>Quantity</th>
              <th>Includes</th>
              <th>Price</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsDetails}
          </tbody>
        </table>
        <p><strong>Subtotal:</strong> $${subtotal.toFixed(2)}</p>
        <p><strong>Shipping Fee:</strong> $${Number(orderMetadata.shipping_fee).toFixed(2)}</p>
        <p><strong>Total:</strong> $${(Number(subtotal) + Number(orderMetadata.shipping_fee)).toFixed(2)}</p>
      </div>
    `;
  }