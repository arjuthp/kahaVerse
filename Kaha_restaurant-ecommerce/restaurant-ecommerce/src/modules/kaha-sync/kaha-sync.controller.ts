import { Controller, Post, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { KahaSyncService } from './kaha-sync.service';
import { SyncUserRestaurantDto } from './dto/sync-user-restaurant.dto';
import { ServiceAccountGuard } from './guards/service-account.guard';

@ApiTags('Kaha Sync')
@Controller('kaha-sync')
export class KahaSyncController {
  constructor(private readonly kahaSyncService: KahaSyncService) {}

  @Post('user-restaurant')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ServiceAccountGuard)
  @ApiBearerAuth('service-account')
  @ApiOperation({
    summary: 'Sync user and restaurant from Kaha',
    description: 'Endpoint for Kaha Main API to sync user and restaurant data. Requires service account authentication.',
  })
  @ApiResponse({
    status: 200,
    description: 'User and restaurant synced successfully',
    schema: {
      example: {
        userId: 'uuid-user-id',
        restaurantId: 'uuid-restaurant-id',
        isNewUser: false,
        isNewRestaurant: true,
        message: 'User and restaurant synced successfully',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing service account token',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict - User with phone/email already exists',
  })
  async syncUserRestaurant(@Body() dto: SyncUserRestaurantDto) {
    return await this.kahaSyncService.syncUserAndRestaurant(dto);
  }
}
