import { IsNotEmpty, IsNumber, IsOptional, IsString, Min } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAddOnDto {
  @ApiProperty({
    description: 'Addon price',
    example: 2.50,
    minimum: 0
  })
  @IsNumber()
  @Min(0, { message: 'price must be a positive number' })
  @IsNotEmpty()
  public price: number;

  @ApiProperty({
    description: 'Addon name',
    example: 'Extra Cheese'
  })
  @IsString()
  @IsNotEmpty()
  public name: string;

  @ApiPropertyOptional({
    description: 'Addon description',
    example: 'Premium mozzarella cheese'
  })
  @IsString()
  @IsOptional()
  public description: string;

  @ApiPropertyOptional({
    description: 'Addon image URL',
    example: 'https://example.com/cheese.jpg'
  })
  @IsString()
  @IsOptional()
  public coverImg: string;
}
