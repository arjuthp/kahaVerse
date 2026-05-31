import {
  Controller,
  Post,
  HttpCode,
  HttpStatus,
  Body,
  BadRequestException,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsEmail } from 'class-validator';
import { AuthService } from './auth.service';

export class AuthAdminLoginDto {
  @ApiProperty({ example: '9813870231', description: 'Registered contact number' })
  @IsNotEmpty()
  @IsString()
  contactNumber: string;

  @ApiProperty({ example: 'ishwor19944', description: 'Account password' })
  @IsNotEmpty()
  @IsString()
  password: string;
}

export class CustomerRegisterApiDto {
  @ApiProperty({ example: 'Fulkumari Thapa' })
  @IsNotEmpty()
  @IsString()
  fullName: string;

  @ApiProperty({ example: '9800000001' })
  @IsNotEmpty()
  @IsString()
  contactNumber: string;

  @ApiProperty({ example: 'fulkumari@gmail.com', required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ example: 'password123' })
  @IsNotEmpty()
  @IsString()
  password: string;
}

export class CustomerLoginApiDto {
  @ApiProperty({ example: '9800000001 or fulkumari@gmail.com' })
  @IsNotEmpty()
  @IsString()
  contactNumber: string;

  @ApiProperty({ example: 'password123' })
  @IsNotEmpty()
  @IsString()
  password: string;
}

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // ─── Customer Auth (local DB, no OTP) ────────────────────────────────────

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Customer self-registration — stored in local DB, no OTP' })
  @ApiResponse({ status: 201, description: 'Customer registered successfully' })
  @ApiResponse({ status: 409, description: 'Contact number or email already registered' })
  async customerRegister(@Body() dto: CustomerRegisterApiDto): Promise<any> {
    return this.authService.customerRegister(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Customer login — validates against local DB, no OTP' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async customerLogin(@Body() dto: CustomerLoginApiDto): Promise<any> {
    return this.authService.customerLogin(dto);
  }

  // ─── Admin Auth (production Kaha Main V3) ────────────────────────────────

  @Post('test-login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mock endpoint for checking body-parser functionality' })
  async testLogin(@Req() req: any, @Body() dto: AuthAdminLoginDto): Promise<any> {
    console.log('[TEST LOGIN RAW BODY]:', dto);
    return { success: true, body: dto };
  }

  @Post('admin-login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Authenticate admin using live Kaha Main V3 credentials' })
  @ApiResponse({ status: 200, description: 'Login successful, returns local JWT and user context' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid credentials or network error' })
  async adminLogin(@Body() loginDto: AuthAdminLoginDto): Promise<any> {
    console.log('[LOGIN DTO]:', loginDto);
    if (!loginDto || !loginDto.contactNumber || !loginDto.password) {
      throw new BadRequestException('Contact number and password are required');
    }
    return this.authService.adminLogin(loginDto.contactNumber, loginDto.password);
  }
}
