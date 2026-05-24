import { ICartItemResponse } from "./cart-item.response";

export class ICartResponse {
  id: string;
  userId: string;
  cartItemsInfo?: ICartItemResponse[];
}
