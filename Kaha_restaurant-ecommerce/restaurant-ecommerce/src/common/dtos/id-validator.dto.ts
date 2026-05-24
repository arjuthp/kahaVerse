import { ApiProperty } from "@nestjs/swagger";
import { IsNumberString, IsString } from "class-validator";

export class IdValidator {
  @IsString()
  public id: string;
}
