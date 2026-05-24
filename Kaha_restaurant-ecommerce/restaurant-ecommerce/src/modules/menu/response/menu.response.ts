import { MenuServiceEnum } from "common/enums/index";
import { IsNumber, IsNotEmpty, IsString, IsOptional } from "class-validator";
import { IBasePaginationResponse } from "common/responses";

class AddonsInfo {
  @IsNumber()
  @IsNotEmpty()
  price: number;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description: string;

  @IsString()
  @IsOptional()
  coverImg: string;
}

export class IMenuResponse {
  id: string;
  name: string;
  businessId: string;
  description?: string;
  details?: any;
  services?: MenuServiceEnum[];
  images?: string[];
  isBarItem?: boolean;
  allowAddOns?: boolean;
  isSignature?: boolean;
  isAvailable?: boolean;
  price: number;
  discountedPrice: number;
  addonsInfo?: AddonsInfo[];
}

export class IMenuPaginationResponse extends IBasePaginationResponse {
  data: IMenuResponse[];
}
