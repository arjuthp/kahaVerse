import { IsNotEmpty, IsNumber, IsString, Min, Max } from "class-validator";
import { ApiProperty } from '@nestjs/swagger';

export class CreateMenuRatingDto {
  @ApiProperty({
    description: 'Rating value (1-5)',
    example: 4.5,
    minimum: 1,
    maximum: 5
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiProperty({
    description: 'Review comments',
    example: 'Absolutely delicious! Best pizza in town.'
  })
  @IsNotEmpty()
  @IsString()
  comments: string;

  @ApiProperty({
    description: 'Menu item ID',
    example: '550e8400-e29b-41d4-a716-446655440003'
  })
  @IsNotEmpty()
  @IsString()
  menuId: string;

  @ApiProperty({
    description: 'Business ID',
    example: '550e8400-e29b-41d4-a716-446655440001'
  })
  @IsNotEmpty()
  @IsString()
  businessId: string;

  @ApiProperty({
    description: 'Order item ID',
    example: '550e8400-e29b-41d4-a716-446655440030'
  })
  @IsNotEmpty()
  @IsString()
  orderItemId: string;
}
