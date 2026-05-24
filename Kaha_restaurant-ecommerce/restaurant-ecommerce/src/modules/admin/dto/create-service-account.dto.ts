import { IsString, IsOptional, IsNumber, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateServiceAccountDto {
  @ApiProperty({
    example: 'Kaha Integration',
    description: 'Name of the service account',
  })
  @IsString()
  name: string;

  @ApiProperty({
    example: 'Service account for Kaha main-api-v3 integration',
    description: 'Description of the service account purpose',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    example: 365,
    description: 'Token validity in days (default: 365)',
    required: false,
    minimum: 1,
    maximum: 3650,
  })
  @IsNumber()
  @Min(1)
  @Max(3650)
  @IsOptional()
  validityDays?: number;
}
