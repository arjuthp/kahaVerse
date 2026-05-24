import { IsEnum, IsNotEmpty } from "class-validator";
import { OrderStatusEnum } from "common/enums";

export class OrderStatusDto {
  @IsEnum(OrderStatusEnum)
  @IsNotEmpty()
  status: OrderStatusEnum;
}
