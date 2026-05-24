import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  Req,
  Patch,
  Delete,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";

import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { MenuRatingService } from "./menu-rating.service";
import { CreateMenuRatingDto, UpdateMenuRatingDto } from "./dto/index";
import { Roles } from "common/decorator";
import { UserRoleEnum } from "common/enums";

@ApiTags("Menu Ratings")
@Controller("menu-ratings")
@ApiBearerAuth()
export class MenuRatingController {
  constructor(private menuRatingService: MenuRatingService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async createMenuRating(@Body() body: CreateMenuRatingDto, @Req() req) {
    const userId = req?.user?.id;
    return this.menuRatingService.createMenuRating(userId, body);
  }

  @Get("my-business")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoleEnum.BUSINESS_SUPER_ADMIN)
  async getBusinessMenuRatingsByBusinessAdmin(@Req() req) {
    const businessId = req?.user?.businessId;
    return this.menuRatingService.getBusinessMenuRatings(businessId);
  }

  @Get("business/:businessId")
  @UseGuards(JwtAuthGuard)
  async getBusinessMenuRatings(@Param("businessId") businessId: string) {
    return this.menuRatingService.getBusinessMenuRatings(businessId);
  }

  @Get("menu:menuId")
  @UseGuards(JwtAuthGuard, RolesGuard)
  async getMenuRatings(@Param("menuId") menuId: string) {
    return this.menuRatingService.getMenuRatings(menuId);
  }
  @Get(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  async findOneRating(@Param("id") id: string, @Req() req) {
    return this.menuRatingService.findOneRating(id);
  }

  @Patch()
  @UseGuards(JwtAuthGuard)
  async updateMenuRating(@Body() body: UpdateMenuRatingDto, @Req() req) {
    const userId = req?.user?.id;
    return this.menuRatingService.updateMenuRating(userId, body);
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard)
  async deleteRating(@Param("id") id: string, @Req() req) {
    const userId = req.user.id;
    return this.menuRatingService.deleteRating(userId, id);
  }

  @Patch(":id/visibility")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoleEnum.BUSINESS_SUPER_ADMIN)
  async toggleVisibility(
    @Param("id") id: string,
    @Body('isVisible') isVisible: boolean,
    @Req() req
  ) {
    const businessId = req?.user?.businessId;
    return this.menuRatingService.toggleVisibility(id, businessId, isVisible);
  }
}
