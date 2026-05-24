import { IsNotEmpty, IsNumber, IsString, Min, Max } from "class-validator";

export class UpdateMenuRatingDto {
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  @Max(5)
  rating: number;

  @IsNotEmpty()
  @IsString()
  comments: string;

  @IsNotEmpty()
  @IsString()
  menuId: string;

  @IsNotEmpty()
  @IsString()
  businessId: string;
}
