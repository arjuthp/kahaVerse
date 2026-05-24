import { Type } from "class-transformer";
import { ServiceTypeEnum, PaymentMethodEnum } from "common/enums";
import { ApiProperty } from "@nestjs/swagger";
import {
  IsString,
  IsOptional,
  IsInt,
  IsNumber,
  ValidateNested,
  IsNotEmpty,
  ArrayMinSize,
  IsEnum,
} from "class-validator";

class OrderItemAddon {
  @ApiProperty({ example: 2, description: 'Quantity of the addon' })
  @IsInt()
  @IsNotEmpty()
  quantity: number;

  @ApiProperty({ 
    example: '550e8400-e29b-41d4-a716-446655440010', 
    description: 'UUID of the addon' 
  })
  @IsString()
  @IsNotEmpty()
  addonId: string;
}

class OrderItem {
  @ApiProperty({ example: 2, description: 'Quantity of the menu item' })
  @IsNumber()
  @IsNotEmpty()
  quantity: number;

  @ApiProperty({ 
    example: '550e8400-e29b-41d4-a716-446655440001', 
    description: 'UUID of the menu item' 
  })
  @IsString()
  @IsNotEmpty()
  menuId: string;

  @ApiProperty({ 
    example: '550e8400-e29b-41d4-a716-446655440002', 
    description: 'UUID of the menu variant' 
  })
  @IsString()
  @IsNotEmpty()
  menuVariantId: string;

  @ApiProperty({ 
    type: [OrderItemAddon],
    description: 'Array of addons for this order item',
    required: false
  })
  @IsOptional()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => OrderItemAddon)
  itemAddons?: OrderItemAddon[];
}

export class CreateOrderDto {
  @ApiProperty({ 
    example: 'abcdef12-3456-7890-abcd-ef1234567890', 
    description: 'UUID of the business' 
  })
  @IsNotEmpty()
  @IsString()
  businessId: string;

  @ApiProperty({ 
    example: 'Please make it spicy', 
    description: 'Special instructions for the order',
    required: false
  })
  @IsOptional()
  @IsString()
  remarks?: string;

  @ApiProperty({ 
    example: ServiceTypeEnum.DINE_IN, 
    enum: ServiceTypeEnum,
    description: 'Type of service',
    required: false
  })
  @IsOptional()
  @IsEnum(ServiceTypeEnum)
  serviceType?: ServiceTypeEnum;

  @ApiProperty({ 
    example: 'Table 5', 
    description: 'Table number for dine-in orders',
    required: false
  })
  @IsOptional()
  @IsString()
  tableNumber?: string;

  @ApiProperty({ 
    example: PaymentMethodEnum.CASH, 
    enum: PaymentMethodEnum,
    description: 'Payment method',
    required: false
  })
  @IsOptional()
  @IsEnum(PaymentMethodEnum)
  paymentMethod?: PaymentMethodEnum;

  @ApiProperty({ 
    example: 5.00, 
    description: 'Service charge amount',
    required: false
  })
  @IsOptional()
  @IsNumber()
  serviceCharge?: number;

  @ApiProperty({ 
    example: 2.50, 
    description: 'Discount amount',
    required: false
  })
  @IsOptional()
  @IsNumber()
  discountAmount?: number;

  @ApiProperty({ 
    example: 3.00, 
    description: 'Tip amount',
    required: false
  })
  @IsOptional()
  @IsNumber()
  tipAmount?: number;

  @ApiProperty({ 
    type: [OrderItem],
    description: 'Array of order items (minimum 1 required)'
  })
  @IsNotEmpty()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => OrderItem)
  orderItems: OrderItem[];
}
