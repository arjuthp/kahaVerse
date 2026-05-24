import { IsBoolean, IsNotEmpty } from "class-validator";

export class ToggleSignatureDto {
  @IsNotEmpty()
  @IsBoolean()
  isSignature: boolean;
}
