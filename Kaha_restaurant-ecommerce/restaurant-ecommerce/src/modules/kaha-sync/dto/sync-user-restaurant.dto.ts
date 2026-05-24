import { IsString, IsEmail, IsOptional, IsObject, ValidateNested, IsNumber, IsArray } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

class SyncUserDto {
  @ApiProperty({ example: 'kaha-user-12345', description: 'Kaha user ID' })
  @IsString()
  externalUserId: string;

  @ApiProperty({ example: '9801234567' })
  @IsString()
  phone: string;

  @ApiProperty({ example: 'John' })
  @IsString()
  @IsOptional()
  firstName?: string;

  @ApiProperty({ example: 'Doe' })
  @IsString()
  @IsOptional()
  lastName?: string;

  @ApiProperty({ example: 'john.doe@example.com' })
  @IsEmail()
  @IsOptional()
  email?: string;
}

class AddressDto {
  @ApiProperty({ example: 'Nepal' })
  @IsString()
  @IsOptional()
  country?: string;

  @ApiProperty({ example: 'Bagmati' })
  @IsString()
  @IsOptional()
  state?: string;

  @ApiProperty({ example: 'Kathmandu' })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiProperty({ example: 'Thamel Street, Ward 26' })
  @IsString()
  @IsOptional()
  streetAddress?: string;

  @ApiProperty({ example: '44600' })
  @IsString()
  @IsOptional()
  postalCode?: string;

  @ApiProperty({ example: 'Near Garden of Dreams' })
  @IsString()
  @IsOptional()
  landmark?: string;
}

class ContactDto {
  @ApiProperty({ example: ['+977-1-4567890', '9801234567'] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  phones?: string[];

  @ApiProperty({ example: 'info@restaurant.com' })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({ example: 'https://restaurant.com' })
  @IsString()
  @IsOptional()
  website?: string;
}

class CoordinatesDto {
  @ApiProperty({ example: 27.7172 })
  @IsNumber()
  latitude: number;

  @ApiProperty({ example: 85.3240 })
  @IsNumber()
  longitude: number;
}

class BusinessHoursDto {
  @ApiProperty({ example: '09:00' })
  @IsString()
  open: string;

  @ApiProperty({ example: '22:00' })
  @IsString()
  close: string;

  @ApiProperty({ example: true })
  @IsOptional()
  isOpen?: boolean;
}

class SyncRestaurantDto {
  @ApiProperty({ example: 'kaha-business-67890', description: 'Kaha business ID' })
  @IsString()
  externalRestaurantId: string;

  @ApiProperty({ example: 'Mountain View Restaurant' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'restaurant' })
  @IsString()
  @IsOptional()
  restaurantType?: string;

  @ApiProperty({ example: 'A beautiful restaurant serving authentic Nepali cuisine' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ type: AddressDto })
  @IsObject()
  @ValidateNested()
  @Type(() => AddressDto)
  @IsOptional()
  address?: AddressDto;

  @ApiProperty({ type: ContactDto })
  @IsObject()
  @ValidateNested()
  @Type(() => ContactDto)
  @IsOptional()
  contact?: ContactDto;

  @ApiProperty({ type: CoordinatesDto })
  @IsObject()
  @ValidateNested()
  @Type(() => CoordinatesDto)
  @IsOptional()
  coordinates?: CoordinatesDto;

  @ApiProperty({ example: 'https://cdn.kaha.com.np/logos/restaurant-logo.jpg' })
  @IsString()
  @IsOptional()
  logoUrl?: string;

  @ApiProperty({ example: 'https://cdn.kaha.com.np/banners/restaurant-banner.jpg' })
  @IsString()
  @IsOptional()
  bannerUrl?: string;

  @ApiProperty({ example: 4.5 })
  @IsNumber()
  @IsOptional()
  rating?: number;

  @ApiProperty({
    example: {
      monday: { open: '09:00', close: '22:00', isOpen: true },
      tuesday: { open: '09:00', close: '22:00', isOpen: true },
    },
  })
  @IsObject()
  @IsOptional()
  businessHours?: Record<string, BusinessHoursDto>;

  @ApiProperty({ example: { cuisine: ['Nepali', 'Indian', 'Chinese'] } })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}

export class SyncUserRestaurantDto {
  @ApiProperty({ type: SyncUserDto })
  @IsObject()
  @ValidateNested()
  @Type(() => SyncUserDto)
  user: SyncUserDto;

  @ApiProperty({ type: SyncRestaurantDto })
  @IsObject()
  @ValidateNested()
  @Type(() => SyncRestaurantDto)
  restaurant: SyncRestaurantDto;
}
