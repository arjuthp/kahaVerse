import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";

import { MenuRatingEntity } from "entities/index";
import { MenuRatingRepository, OrderItemRepository } from "repositories/index";
import { CreateMenuRatingDto, UpdateMenuRatingDto } from "./dto/index";
import { ISuccessReponse } from "common/responses";
import { IMenuRatingResponse } from "./responses/menu-rating.response";

@Injectable()
export class MenuRatingService {
  constructor(
    private menuRatingRepository: MenuRatingRepository,
    private orderItemRepository: OrderItemRepository
  ) {}

  async createMenuRating(
    userId: string,
    body: CreateMenuRatingDto
  ): Promise<ISuccessReponse> {
    const { menuId, orderItemId, ...rest } = body;
    const menuRating = await this.menuRatingRepository.findOne({
      where: { menu: { id: menuId }, ratedBy: userId, orderItem: { id: orderItemId } },
    });

    if (menuRating) {
      throw new BadRequestException("You have already reviewed this menu item for this order.");
    }

    const orderItem = await this.orderItemRepository.findOne({
      where: { id: orderItemId },
      relations: ['order']
    });

    if (!orderItem || orderItem.order.userId !== userId) {
      throw new BadRequestException("You can only review items you have explicitly ordered.");
    }

    await this.menuRatingRepository.save({
      ...rest,
      ratedBy: userId,
      menu: { id: menuId },
      orderItem: { id: orderItemId }
    });

    return { message: "Menu rating successfully created." };
  }

  async getMenuRatings(menuId: string): Promise<IMenuRatingResponse[]> {
    const ratings = await this.menuRatingRepository.find({
      where: { menu: { id: menuId } },
    });

    return ratings.map(this.transformToMenuRatingResponse);
  }

  async getBusinessMenuRatings(
    businessId: string
  ): Promise<IMenuRatingResponse[]> {
    const ratings = await this.menuRatingRepository.find({
      where: { businessId: businessId },
    });
    return ratings.map(this.transformToMenuRatingResponse);
  }

  async findOneRating(id: string): Promise<any> {
    const menuRating = await this.menuRatingRepository.findOne({
      where: { id },
      relations: { menu: true },
    });

    return this.transformToMenuRatingResponse(menuRating);
  }

  async updateMenuRating(
    userId: string,
    body: UpdateMenuRatingDto
  ): Promise<ISuccessReponse> {
    const { menuId, ...rest } = body;
    const menuRating = await this.menuRatingRepository.findOne({
      where: { menu: { id: menuId }, ratedBy: userId },
    });

    if (!menuRating) {
      throw new NotFoundException("Menu rating not found.");
    }

    await this.menuRatingRepository.update(menuRating?.id, { ...rest });

    return { message: "Menu rating successfully updated." };
  }

  async deleteRating(userId: string, id: string): Promise<ISuccessReponse> {
    const menuRating = await this.menuRatingRepository.findOne({
      where: { id, ratedBy: userId },
    });

    if (!menuRating) {
      throw new NotFoundException("Menu rating not found.");
    }

    await this.menuRatingRepository.delete({ id: menuRating?.id });

    return { message: "Menu rating successfully deleted." };
  }

  async toggleVisibility(id: string, businessId: string, isVisible: boolean): Promise<ISuccessReponse> {
    const menuRating = await this.menuRatingRepository.findOne({
      where: { id, businessId },
    });

    if (!menuRating) {
      throw new NotFoundException("Menu rating not found.");
    }

    menuRating.isVisible = isVisible;
    await this.menuRatingRepository.save(menuRating);

    return { message: "Menu rating visibility updated successfully." };
  }

  private transformToMenuRatingResponse(
    menuRating: MenuRatingEntity
  ): IMenuRatingResponse {
    const { id, rating, comments, ratedBy, businessId, menu } = menuRating;
    const { name, description } = menu;
    return {
      id,
      rating,
      comments,
      ratedBy,
      businessId,
      menu: {
        name,
        description,
      },
    };
  }
}
