import { IsArray, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Min, ValidateNested } from "class-validator";
import { Type } from "class-transformer";
import { ServiceTypeEnum, PaymentMethodEnum } from "common/enums";
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateOrderFromCartDto {
  @ApiPropertyOptional({
    description: 'Business ID (optional — derived from cart if omitted)',
    example: 'biz-mock-001'
  })
  @IsString()
  @IsOptional()
  businessId?: string;

  @ApiProperty({
    description: 'Service type',
    example: 'DELIVERY',
    enum: ServiceTypeEnum
  })
  @IsEnum(ServiceTypeEnum)
  @IsNotEmpty()
  serviceType: ServiceTypeEnum;

  @ApiPropertyOptional({
    description: 'Table number (for dine-in)',
    example: 'T-12'
  })
  @IsString()
  @IsOptional()
  tableNumber?: string;

  @ApiPropertyOptional({
    description: 'Order remarks/notes',
    example: 'Ring doorbell twice, please'
  })
  @IsString()
  @IsOptional()
  remarks?: string;

  @ApiPropertyOptional({
    description: 'Payment method',
    example: 'ONLINE',
    enum: PaymentMethodEnum
  })
  @IsEnum(PaymentMethodEnum)
  @IsOptional()
  paymentMethod?: PaymentMethodEnum;

  // Optional: Select specific cart items (if not provided, checkout entire cart)
  @ApiPropertyOptional({
    description: 'Specific cart item IDs to checkout (leave empty for full cart)',
    example: ['550e8400-e29b-41d4-a716-446655440020', '550e8400-e29b-41d4-a716-446655440021']
  })
  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  cartItemIds?: string[];

  // Pricing overrides (optional, for delivery fee, service charge, etc.)
  @ApiPropertyOptional({
    description: 'Delivery fee',
    example: 50
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  deliveryFee?: number;

  @ApiPropertyOptional({
    description: 'Service charge',
    example: 10
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  serviceCharge?: number;

  @ApiPropertyOptional({
    description: 'Tip amount',
    example: 20
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  tipAmount?: number;

  @ApiPropertyOptional({
    description: 'Discount amount',
    example: 100
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  discountAmount?: number;

  @ApiPropertyOptional({
    description: 'Voucher code applied to the order',
    example: 'KAHA-VOUCHER12'
  })
  @IsString()
  @IsOptional()
  voucherCode?: string;

  @ApiPropertyOptional({
    description: 'Voucher codes applied to the order',
    example: ['KAHA-VOUCHER12'],
    type: [String]
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  voucherCodes?: string[];
}
