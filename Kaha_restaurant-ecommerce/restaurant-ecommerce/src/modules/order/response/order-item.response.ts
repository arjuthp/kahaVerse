export class IAddonsResponse {
  id: string;
  quantity: number;
  price: number;
}

export class IOrderItemResponse {
  id: string;
  quantity: number;
  price: number;
  addonsInfo: IAddonsResponse[];
}
