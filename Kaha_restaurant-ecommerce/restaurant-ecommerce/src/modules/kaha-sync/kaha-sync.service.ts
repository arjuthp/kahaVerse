import { Injectable, Logger, ConflictException } from '@nestjs/common';
import { UserRepository } from '../../repositories/user.repository';
import { RestaurantRepository } from '../../repositories/restaurant.repository';
import { SyncUserRestaurantDto } from './dto/sync-user-restaurant.dto';
import { User, UserType, AuthProvider } from '../../entities/user.entity';
import { Restaurant, RestaurantStatus, SubscriptionStatus } from '../../entities/restaurant.entity';

@Injectable()
export class KahaSyncService {
  private readonly logger = new Logger(KahaSyncService.name);

  constructor(
    private readonly userRepository: UserRepository,
    private readonly restaurantRepository: RestaurantRepository,
  ) {}

  async syncUserAndRestaurant(dto: SyncUserRestaurantDto) {
    this.logger.log(`Syncing user and restaurant from Kaha: ${dto.user.externalUserId} -> ${dto.restaurant.externalRestaurantId}`);

    // 1. Sync User
    const user = await this.syncUser(dto.user);

    // 2. Sync Restaurant
    const restaurant = await this.syncRestaurant(dto.restaurant, user);

    this.logger.log(`Sync completed: User ${user.id}, Restaurant ${restaurant.id}`);

    return {
      userId: user.id,
      restaurantId: restaurant.id,
      isNewUser: !user.createdAt || user.createdAt === user.updatedAt,
      isNewRestaurant: !restaurant.createdAt || restaurant.createdAt === restaurant.updatedAt,
      message: 'User and restaurant synced successfully',
    };
  }

  private async syncUser(userDto: SyncUserRestaurantDto['user']): Promise<User> {
    // Find existing user by externalId (Kaha user ID)
    let user = await this.userRepository.findByExternalId(userDto.externalUserId);

    if (user) {
      // User exists → UPDATE
      this.logger.log(`Updating existing user: ${user.id}`);
      
      user.firstName = userDto.firstName || user.firstName;
      user.lastName = userDto.lastName || user.lastName;
      user.email = userDto.email || user.email;
      user.phone = userDto.phone;
      user.source = 'kaha';
      user.authProvider = AuthProvider.KAHA;
      
      return await this.userRepository.save(user);
    }

    // Check if phone already exists (prevent duplicate)
    const existingByPhone = await this.userRepository.findByPhone(userDto.phone);
    if (existingByPhone) {
      throw new ConflictException(`User with phone ${userDto.phone} already exists`);
    }

    // Check if email already exists
    if (userDto.email) {
      const existingByEmail = await this.userRepository.findByEmail(userDto.email);
      if (existingByEmail) {
        throw new ConflictException(`User with email ${userDto.email} already exists`);
      }
    }

    // User doesn't exist → CREATE
    this.logger.log(`Creating new user from Kaha: ${userDto.externalUserId}`);
    
    user = this.userRepository.create({
      externalId: userDto.externalUserId,
      source: 'kaha',
      phone: userDto.phone,
      firstName: userDto.firstName,
      lastName: userDto.lastName,
      email: userDto.email,
      userType: UserType.RESTAURANT_OWNER,
      authProvider: AuthProvider.KAHA,
      isActive: true,
      isPhoneVerified: true, // Assume Kaha verified
      isEmailVerified: !!userDto.email, // Assume Kaha verified if email provided
    });

    return await this.userRepository.save(user);
  }

  private async syncRestaurant(
    restaurantDto: SyncUserRestaurantDto['restaurant'],
    owner: User,
  ): Promise<Restaurant> {
    // Find existing restaurant by externalId (Kaha business ID)
    let restaurant = await this.restaurantRepository.findByExternalId(
      restaurantDto.externalRestaurantId,
    );

    if (restaurant) {
      // Restaurant exists → UPDATE
      this.logger.log(`Updating existing restaurant: ${restaurant.id}`);
      
      restaurant.name = restaurantDto.name;
      restaurant.description = restaurantDto.description || restaurant.description;
      restaurant.address = restaurantDto.address || restaurant.address;
      restaurant.contact = restaurantDto.contact || restaurant.contact;
      restaurant.coordinates = restaurantDto.coordinates || restaurant.coordinates;
      restaurant.logoUrl = restaurantDto.logoUrl || restaurant.logoUrl;
      restaurant.bannerUrl = restaurantDto.bannerUrl || restaurant.bannerUrl;
      restaurant.businessHours = restaurantDto.businessHours as any || restaurant.businessHours;
      restaurant.rating = restaurantDto.rating || restaurant.rating;
      restaurant.metadata = restaurantDto.metadata || restaurant.metadata;
      restaurant.source = 'kaha';
      restaurant.ownerId = owner.id;
      
      return await this.restaurantRepository.save(restaurant);
    }

    // Restaurant doesn't exist → CREATE
    this.logger.log(`Creating new restaurant from Kaha: ${restaurantDto.externalRestaurantId}`);
    
    const restaurantCode = await this.restaurantRepository.generateUniqueCode(
      restaurantDto.name,
    );

    restaurant = this.restaurantRepository.create({
      externalId: restaurantDto.externalRestaurantId,
      source: 'kaha',
      restaurantCode,
      name: restaurantDto.name,
      description: restaurantDto.description,
      address: restaurantDto.address,
      contact: restaurantDto.contact,
      coordinates: restaurantDto.coordinates,
      logoUrl: restaurantDto.logoUrl,
      bannerUrl: restaurantDto.bannerUrl,
      businessHours: restaurantDto.businessHours as any,
      rating: restaurantDto.rating || 0,
      totalRatings: 0,
      status: RestaurantStatus.TRIAL,
      subscriptionStatus: SubscriptionStatus.TRIAL,
      metadata: restaurantDto.metadata,
      ownerId: owner.id,
      owner,
    });

    return await this.restaurantRepository.save(restaurant);
  }
}
