import { Controller, Post, Get, Patch, Body, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { CreateServiceAccountDto } from './dto/create-service-account.dto';

@ApiTags('Admin')
@Controller('admin')
// @UseGuards(AdminGuard) // TODO: Add admin authentication guard
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post('service-accounts')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create service account',
    description: 'Create a service account for external system integration (e.g., Kaha Main API)',
  })
  @ApiResponse({
    status: 201,
    description: 'Service account created successfully',
    schema: {
      example: {
        id: 'uuid',
        name: 'Kaha Integration',
        description: 'Service account for Kaha main-api-v3',
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        expiresAt: '2027-03-30T08:23:09Z',
        message: 'Service account created successfully. Store this token securely - it will not be shown again.',
      },
    },
  })
  @ApiResponse({
    status: 409,
    description: 'Service account with this name already exists',
  })
  async createServiceAccount(@Body() dto: CreateServiceAccountDto) {
    return await this.adminService.createServiceAccount(dto);
  }

  @Get('service-accounts')
  @ApiOperation({
    summary: 'List all service accounts',
    description: 'Get a list of all service accounts',
  })
  @ApiResponse({
    status: 200,
    description: 'List of service accounts',
  })
  async listServiceAccounts() {
    return await this.adminService.listServiceAccounts();
  }

  @Patch('service-accounts/:id/deactivate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Deactivate service account',
    description: 'Deactivate a service account to revoke access',
  })
  @ApiResponse({
    status: 200,
    description: 'Service account deactivated successfully',
  })
  async deactivateServiceAccount(@Param('id') id: string) {
    return await this.adminService.deactivateServiceAccount(id);
  }
}
