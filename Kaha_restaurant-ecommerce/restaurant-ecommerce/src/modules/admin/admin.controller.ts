import { Controller, Post, Get, Patch, Delete, Body, Param, HttpCode, HttpStatus, Query, Req, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { CreateServiceAccountDto } from './dto/create-service-account.dto';
import { CreateTableDto } from './dto/create-table.dto';
import { UpdateTableDto } from './dto/update-table.dto';
import { JwtAuthGuard } from 'auth/guards';
import { RolesGuard } from 'auth/guards/roles.guard';
import { Roles } from 'common/decorator';
import { UserRoleEnum } from 'common/enums';


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

  @Get('users')
  @ApiOperation({ summary: 'List all registered customer users with pagination' })
  @ApiResponse({ status: 200, description: 'Paginated list of customer accounts' })
  async listCustomers(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = Math.max(1, parseInt(page || '1', 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit || '10', 10) || 10));
    return this.adminService.listCustomers(pageNum, limitNum);
  }

  @Post("tables")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoleEnum.BUSINESS_SUPER_ADMIN)
  @ApiOperation({ summary: 'Create a new table' })
  async createTable(@Body() dto: CreateTableDto, @Req() req) {
    return this.adminService.createTable(req.user.businessId, dto);
  }

  @Get("tables")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoleEnum.BUSINESS_SUPER_ADMIN)
  @ApiOperation({ summary: 'Get all tables for business' })
  async getTables(@Req() req) {
    return this.adminService.getTables(req.user.businessId);
  }

  @Patch("tables/:id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoleEnum.BUSINESS_SUPER_ADMIN)
  @ApiOperation({ summary: 'Update table details' })
  async updateTable(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateTableDto,
    @Req() req
  ) {
    return this.adminService.updateTable(req.user.businessId, id, dto);
  }

  @Delete("tables/:id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoleEnum.BUSINESS_SUPER_ADMIN)
  @ApiOperation({ summary: 'Delete table' })
  async deleteTable(@Param("id", ParseUUIDPipe) id: string, @Req() req) {
    return this.adminService.deleteTable(req.user.businessId, id);
  }
}
