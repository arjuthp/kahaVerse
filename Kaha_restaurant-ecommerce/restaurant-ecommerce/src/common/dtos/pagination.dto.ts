import { IsNumberString, IsOptional } from "class-validator";

export class PaginationDto {
  @IsNumberString()
  @IsOptional()
  public page?: string;

  @IsNumberString()
  @IsOptional()
  public take?: string;
}
