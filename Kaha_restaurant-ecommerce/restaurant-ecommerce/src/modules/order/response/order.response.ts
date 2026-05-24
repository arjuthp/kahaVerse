import { IOrderItemResponse } from "./index";

export interface IBusinessInfo {
  name: string;
  category: string;
  address: string;
  avatar: string;
}

export interface IUserInfo {
  name: string;
  email: string;
  contact: string;
  avatar: string;
}

export class IOrderResponse {
  id: string;
  userId: string;
  businessId: string;
  totalAmount: number;
  remarks?: string;
  orderItemsInfo: IOrderItemResponse[];
  businessInfo?: IBusinessInfo;
  userInfo?: IUserInfo;
}

export class IOrderSummaryResponse {
  id: string;
  userId: string;
  businessId: string;
  totalAmount: number;
  remarks?: string;
  businessInfo?: IBusinessInfo;
  userInfo?: IUserInfo;
}
