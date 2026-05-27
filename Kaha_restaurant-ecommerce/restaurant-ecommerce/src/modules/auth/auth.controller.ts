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
import { IsString, IsNotEmpty } from 'class-validator';
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

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('test-login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mock endpoint for checking body-parser functionality' })
  async testLogin(@Req() req: any, @Body() dto: AuthAdminLoginDto): Promise<any> {
    console.log('[TEST LOGIN RAW BODY]:', dto);
    console.log('[TEST LOGIN REQ]:', req ? Object.keys(req) : 'UNDEFINED REQ');
    return { success: true, body: dto };
  }

  @Post('admin-login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Authenticate admin using live Kaha Main V3 credentials' })
  @ApiResponse({
    status: 200,
    description: 'Login successful, returns local JWT and user context',
    schema: {
      type: 'object',
      properties: {
        access_token: {
          type: 'string',
          example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImFmYzcwZGIzLTZmNDMtNDg4Mi05MmZkLTQ3MTVmMjVmZmM5NSIsImthaGFJZCI6IlUtOEM2OTVFIiwiaWF0IjoxNzc5MjYwMDg1fQ._vMnH55SpkT6HXta7POJzKLprPY12znP7HSzT46PVyM',
          description: 'Local application JWT token'
        },
        refreshToken: {
          type: 'string',
          example: 'test-refresh-token',
          description: 'Refresh token'
        },
        user: {
          type: 'object',
          description: 'Decoded user profile and active business context',
          properties: {
            id: { type: 'string', example: 'afc70db3-6f43-4882-92fd-4715f25ffc95' },
            email: { type: 'string', example: 'replyishwor@gmail.com' },
            fullName: { type: 'string', example: 'ishwor gautam' },
            role: { type: 'string', example: 'admin' },
            businessId: { type: 'string', example: '7476ee15-1407-41fa-9a49-89e0caaf945d' }
          }
        }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid credentials or network error' })
  async adminLogin(@Body() loginDto: AuthAdminLoginDto): Promise<any> {
    console.log('[LOGIN DTO]:', loginDto);
    if (!loginDto || !loginDto.contactNumber || !loginDto.password) {
      throw new BadRequestException('Contact number and password are required');
    }
    return this.authService.adminLogin(loginDto.contactNumber, loginDto.password);
  }
}
